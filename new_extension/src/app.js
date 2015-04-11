(function () {
  'use strict';

  var $loginView = $('#loginView'),
      $mainView = $('#mainView'),
      $selectRoomButton = $('#selectRoomButton'),
      $continueButton = $('#continueButton'),
      $peerNameInput = $('#peerNameInput'),
      $peerName = $('#peerName'),
      $roomName = $('#roomName'),
      $roomList = $('#roomList');
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

    pc.onremovestream = function(evt){
      console.log('Tab share stream added');
      $('#videoWrapper .overlay').show();
      $('#tabShare').removeAttr('src');
    }
  }

  function setChannelEvents(channel) {
    channel.onmessage = function (event) {
      console.debug('Ext: ', event.data);
      JSON.stringify(event.data)
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

  socket.on('rooms', function (rooms) {
    console.log('rooms', rooms);
    $roomList.empty();
    for (var roomName in rooms) {
      var $roomConnectLink = $('<a class="item">' +
      '<i class="exchange icon"></i>' +
      roomName +
      '</a>');
      var roomToJoin = roomName;
      $roomConnectLink.click(function(){
        socket.emit('join', {
          name: $peerName.text(),
          role: 'sub'
        }, roomToJoin);
      });
      $roomConnectLink.appendTo($roomList);
    }
  });

  socket.on('joined', function(peer, room){
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
})();
