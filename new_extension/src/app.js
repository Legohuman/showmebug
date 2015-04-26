(function () {
  'use strict';

  $(function(){
    var $loginView = $('#loginView'),
      $mainView = $('#mainView'),
      $selectRoomButton = $('#selectRoomButton'),
      $continueButton = $('#continueButton'),
      $peerNameInput = $('#peerNameInput'),
      $peerName = $('#peerName'),
      $roomName = $('#roomName'),
      $roomList = $('#roomList'),
      $toggleConsoleHeight = $('#toggleConsoleHeight');

    $loginView.show();

    $selectRoomButton.click(function () {
      $roomList.toggleClass('visible');
    });

    $continueButton.click(function () {
      var peerName = $peerNameInput.val();
      if (peerName) {
        $peerName.text(peerName)
        $loginView.hide();
        $mainView.show();
        socket.emit('rooms');
      }
    });

    $toggleConsoleHeight.click(function(){
      $('#consoleWrapper').toggleClass('high');
    });

    var serverUrl = 'http://localhost:3000/',
      config = {
        iceServers: [{
          url: 'stun:stun.l.google.com:19302'
        }]
      };
    var socket = io(serverUrl);
    var pc;
    var dataChannel;

// run start(true) to initiate a call
    function answer() {
      pc = new RTCPeerConnection(config, {optional: [{RtpDataChannels: true}]});
      setPeerConnectionEvents(pc);

      dataChannel = pc.createDataChannel('RTCDataChannel', {reliable: false});
      setChannelEvents(dataChannel);


      setTimeout(function () {
        console.log('Answering to extension');
        pc.createAnswer(gotDescription);
      }, 2000); //mysterious timeout, does not work without it


      function gotDescription(desc) {
        pc.setLocalDescription(new RTCSessionDescription(desc));
        console.log('Local sdp: ', desc);
        socket.emit('message', {"sdp": desc});
      }
    }

    function setPeerConnectionEvents(pc) {
      // send any ice candidates to the other peer
      pc.onicecandidate = function (evt) {
        console.log('Local candidate: ', evt);
        socket.emit('message', {'candidate': evt.candidate});
      };

      // once remote stream arrives, show it in the remote video element
      pc.onaddstream = function (evt) {
        console.log('Tab share stream added');
        $('#videoWrapper .overlay').hide();
        $('#tabShare').attr('src', URL.createObjectURL(evt.stream));
      };

      pc.onremovestream = function (evt) {
        console.log('Tab share stream added');
        $('#videoWrapper .overlay').show();
        $('#tabShare').removeAttr('src');
      }
    }

    function setChannelEvents(channel) {
      channel.onmessage = function (event) {
        var data = event.data ? JSON.parse(event.data) : event.data;
        if (data) {
          console.debug('Ext: ', data);
          if (data)
            var eventTitle = getEventTitle(data),
              eventText = getEventText(data),
              inspectionText = getInspectionText(data);
          $('<div class="item">' +
          '<i class="info icon"></i>' +
          '<div class="content">' +
          '<a class="header">' + eventTitle + '</a>' +
          '<div class="description">' + inspectionText + ' ' + eventText + '</div>' +
          '</div>' +
          '</div>').appendTo($('#allMessages'));
        }
      };
      channel.onopen = function () {
        console.debug('Channel opened');
      };
      channel.onclose = function (e) {
        console.error(e);
      };
      channel.onerror = function (e) {
        console.error(e);
      };
    }

    var eventTypeTitles = {
      'console': 'Console',
      'network.request': 'Network request',
      'network.response': 'Network response'
    };

    var lastUrls = {};

    function getInspectionText(eventData) {
      if (!eventData) return '';
      if (eventData.kind === 'network.request') {
        var obj = eventData.obj,
          lastTimeStamp = lastUrls[obj.url],
          timeStamp = eventData.timeStamp;
        lastUrls[obj.url] = timeStamp;
        console.log('Timestamps: last, current ', lastTimeStamp, timeStamp);
        if (lastTimeStamp && timeStamp - lastTimeStamp < 1000) {
          return '<b>Warn: request is sent too often</b>';
        }
      }
      return '';
    }

    function getEventTitle(eventData) {
      if (!eventData) return 'Uknown';
      return eventTypeTitles[eventData.kind] || 'Other';
    }

    function getEventText(eventData) {
      if (!eventData) return 'None';
      if (eventData.kind === 'console') {
        var obj = eventData.obj;
        return obj.url + ' # ' + obj.line + ': ' + obj.text;
      }
      if (eventData.kind === 'network.request') {
        var obj = eventData.obj;
        return obj.method + ' ' + obj.url;
      } else if (eventData.kind === 'network.response') {
        var obj = eventData.obj;
        return obj.url + ' ' + obj.status;
      }
    }

    socket.on('rooms', function (rooms) {
      console.log('rooms', rooms);
      $roomList.empty();
      for (var roomName in rooms) {
        var $roomConnectLink = $('<a class="item">' +
        '<i class="exchange icon"></i>' +
        roomName +
        '</a>');
        var roomToJoin = roomName;
        $roomConnectLink.click(function () {
          socket.emit('join', {
            name: $peerName.text(),
            role: 'sub'
          }, roomToJoin);
        });
        $roomConnectLink.appendTo($roomList);
      }
    });

    socket.on('joined', function (peer, room) {
      console.log('joined', peer, room);
      $roomName.text(room);
    });

    socket.on('message', function (message) {
      console.log('message', message);
      if (!pc) {
        console.log('Start viewing tab');
        answer();
      }

      if (message.sdp) {
        console.log('Remote sdp: ', message.sdp);
        pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
      } else {
        console.log('Remote candidate: ', message.candidate);
        if (message.candidate) {
          pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
      }
    });

    socket.on('leaved', function (peer, room) {
      dataChannel.close();
      pc.close();
    });
  });
})();
