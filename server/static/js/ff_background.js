var app = (function () {
  'use strict';

  var app = {},
    serverUrl = 'https://localhost:3001/',
    config = {
      iceServers: [{
        url: 'stun:stun.l.google.com:19302'
      }]
    },
    socket = io(serverUrl),
    pc,
    sendChannel,
    channelOpened = false,
    tabId;

  app.states = {
    stopped: 'stopped',
    starting: 'starting',
    started: 'started',
    stopping: 'stopping'
  };
  app.extensionState = app.states.stopped;

  function getTabMedia(successCallback) {
    initCapture(successCallback);
  }


  function room() {
    return '666';
  }

  function pub(peerName) {
    return {
      name: peerName,
      role: 'pub'
    }
  }

  function sub(peerName) {
    return {
      name: peerName,
      role: 'sub'
    }
  }

  app.createRoom = function (peerName) {
    console.log('create room, socket id', socket.id, peerName);
    socket.emit('join', pub(peerName), room());
  };

  app.sendMessageToChannel = function (text) {
    if (channelOpened) {
      sendChannel.send(text);
    }
  };

// run start(true) to initiate a call
  app.start = function () {
    app.extensionState = app.states.starting;
    pc = new RTCPeerConnection(config, {optional: [{RtpDataChannels: true}]});

    sendChannel = pc.createDataChannel('RTCDataChannel', {reliable: false});
    setChannelEvents(sendChannel, 'sendChannel');

    attachDebugger();

    setPeerConnectionEvents(pc);

    getTabMedia(function (stream) {
      pc.addStream(stream);

      console.log('Offer conection to view process page');
      pc.createOffer(gotDescription, function (errr) {console.error(errr)});

      function gotDescription(desc) {
        console.log(desc);
        console.log(RTCSessionDescription);
        pc.setLocalDescription(new RTCSessionDescription(desc));
        console.log('Local sdp: ', desc);
        console.log('Send sdp, socket id', socket.id);
        socket.emit('message', {"sdp": desc});
      }
    }, function (error) {
      console.log('Error', error);
    })
  };

  app.stop = function () {
    app.extensionState = app.states.stopping;
    //chrome.debugger.detach({tabId: tabId});
    //todo
    app.extensionState = app.states.stopped;
  };

  function attachDebugger() {
    //chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
    //  var version = "1.0";
    //  tabId = tabs[0].id;
    //  chrome.debugger.attach({tabId: tabId}, version, onAttach.bind(null, tabId));
    //
    //  function onAttach() {
    //    if (chrome.runtime.lastError) {
    //      alert(chrome.runtime.lastError.message);
    //    }
    //  }
    //
    //  chrome.debugger.sendCommand({tabId: tabId}, "Network.enable");
    //  chrome.debugger.sendCommand({tabId: tabId}, "Console.enable");
    //  chrome.debugger.onEvent.addListener(onEvent);
    //
    //  function onEvent(debuggeeId, message, params) {
    //    if (tabId != debuggeeId.tabId)
    //      return;
    //    if (message === 'Console.messageAdded') {
    //      console.log(params.message.text);
    //      app.sendMessageToChannel(params.message.text);
    //    }
    //  }
    //});
  }

  function setPeerConnectionEvents(pc) {
    // send any ice candidates to the other peer
    pc.onicecandidate = function (evt) {
      console.log('Local candidate: ', evt);
      socket.emit('message', {'candidate': evt.candidate});
    };
  }

  function setChannelEvents(channel) {
    channel.onmessage = function (event) {
      console.debug('Ext: ', event.data);
    };
    channel.onopen = function () {
      channelOpened = true;
      console.debug('Channel opened');
    };
    channel.onclose = function (e) {
      channelOpened = false;
      console.error(e);
    };
    channel.onerror = function (e) {
      console.error(e);
    };
  }

  socket.on('message', function (message) {
    if (message.sdp) {
      console.log('Remote sdp: ', message.sdp);
      pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
    } else {
      console.log('Remote candidate: ', message.candidate);
      if(message.candidate){
        pc.addIceCandidate(new RTCIceCandidate(message.candidate));
      }

      app.extensionState = app.states.started;
    }
  });

  socket.on('joined', function (peer, room) {
    console.log('Join: ' + peer + ' : room ' + room);
    $('#roomId').text(room);
    //chrome.extension.sendMessage({roomUID: room});
  });

  socket.on('ready', function (message) {
    console.log('ready message');
  });

  return app;
})();



//chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
//  'use strict';
//
//  console.log('Get message from popup: ' + msg.method);
//
//  switch (msg.method) {
//    case 'createRoom':
//      app.createRoom(msg.name);
//      break;
//    case 'toggleStart':
//      if (app.states.stopped === app.extensionState) {
//        app.start();
//      } else if (app.states.started === app.extensionState) {
//        app.stop();
//      }
//      break;
//    case 'join':
//      chrome.tabs.create({'url': chrome.extension.getURL('index.html')}, function(tab) {
//        // Tab opened.
//      });
//      break;
//  }
//});


(function () {
  'use strict';

  $(function () {
    var $peerName = $('#peerName'),
        $createRoom = $('#createRoom'),
        $roomId = $('#roomId'),

        $toggleCapturing = $('#toggleCapturing'),
        $joinButton = $('#joinBtn');

    $createRoom.click(function () {
      app.createRoom($peerName.text());
    });

    $toggleCapturing.click(function () {
      if (app.states.stopped === app.extensionState) {
        app.start();
      } else if (app.states.started === app.extensionState) {
        app.stop();
      }
      //chrome.extension.sendMessage({method: 'toggleStart'});
      //$toggleCapturing.text('Stop capture');
      //$toggleCapturing.text('Start capture');
    });

    $joinButton.click(function () {

      //chrome.extension.sendMessage({method: 'join'});
    });

    //chrome.extension.onMessage.addListener(function (msg) {
    //  console.log('Get msg from background');
    //  if (msg.roomUID) {
    //    $roomId.text(msg.roomUID);
    //  }
    //});
  });
})();