var app = (function () {
  'use strict';

  var serverUrl = 'http://localhost:3000/',
      config = {
        iceServers: [{
          url: 'stun:stun.l.google.com:19302'
        }]
      },
      socket = io(serverUrl),
      pc,
      messageDebugger,
      currentRoom = null,
      createRoom = function (peerName) {
        console.log('create room, socket id', socket.id, peerName);
        socket.emit('join', { name: peerName, role: 'pub' }, null);
      },
      getRoom = function () {
        return currentRoom;
      },
      getTabMedia = function (successCallback) {
        chrome.tabs.query({active: true, currentWindow: true}, function () {
          var constraints = {
            audio: false,
            video: true,
            videoConstraints: {
              mandatory: {
                chromeMediaSource: 'tab'
              }
            }
          };

          chrome.tabCapture.capture(constraints, successCallback);
        });
      },
      start = function () {
        pc = new RTCPeerConnection(config, {optional: [{RtpDataChannels: true}]});
        messageDebugger = initDebugger(pc);

        messageDebugger.attach();

        // send any ice candidates to the other peer
        pc.onicecandidate = function (evt) {
          console.log('Local candidate: ', evt);
          socket.emit('message', {'candidate': evt.candidate});
        };

        //setPeerConnectionEvents(pc);

        getTabMedia(function (stream) {
          pc.addStream(stream);

          console.log('Offer conection to view process page');
          pc.createOffer(gotDescription);

          function gotDescription(desc) {
            pc.setLocalDescription(new RTCSessionDescription(desc));
            console.log('Local sdp: ', desc);
            console.log('Send sdp, socket id', socket.id);
            socket.emit('message', {"sdp": desc});
          }
        }, function (error) {
          console.log('Error', error);
        });
      },
      stop = function () {
        socket.emit('leave');
      };

  //function setPeerConnectionEvents(pc) {
  //  // send any ice candidates to the other peer
  //  pc.onicecandidate = function (evt) {
  //    console.log('Local candidate: ', evt);
  //    socket.emit('message', {'candidate': evt.candidate});
  //  };
  //}

  function initDebugger(pc) {
    var version = "1.0",
        tabId,
        sendChannel,
        channelOpened = false,
        setChannelEvents = function (channel) {
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
        },
        sendMessageToChannel = function (text) {
          if (channelOpened) {
            sendChannel.send(text);
          }
        },
        onAttach = function () {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          }
        },
        onEvent = function (debuggeeId, message, params) {
          var text;

          if (tabId != debuggeeId.tabId) {
            return;
          }

          if (message === 'Console.messageAdded') {
            console.debug(params.message.text);
            text = JSON.stringify({kind: 'console', obj: params.message, timeStamp: new Date().getTime()});

            sendMessageToChannel(text);
          } else if (message === 'Network.requestWillBeSent') {
            console.debug(params.request);
            text = JSON.stringify({
              kind: 'network.request',
              obj: params.request,
              timeStamp: new Date().getTime()
            });

            sendMessageToChannel(text);
          } else if (message === 'Network.responseReceived') {
            console.debug(params.response);
            text = JSON.stringify({
              kind: 'network.response',
              obj: params.response,
              timeStamp: new Date().getTime()
            });

            sendMessageToChannel(text);
          }
        },
        attach = function () {
          chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
            tabId = tabs[0].id;

            chrome.debugger.attach({tabId: tabId}, version, onAttach.bind(null, tabId));
            chrome.debugger.sendCommand({tabId: tabId}, "Network.enable");
            chrome.debugger.sendCommand({tabId: tabId}, "Console.enable");

            chrome.debugger.onEvent.addListener(onEvent);
          });
        },
        detach = function () {
          chrome.debugger.detach({tabId: tabId});
          sendChannel.close();
        };

    // init data channel
    sendChannel = pc.createDataChannel('RTCDataChannel', {reliable: false});
    setChannelEvents(sendChannel);

    return {
      attach: attach,
      detach: detach
    }
  }

  socket.on('joined', function (peer, room) {
    console.log('Join: ' + peer + ' : room ' + room);

    currentRoom = room;
    chrome.extension.sendMessage({roomUID: room});
  });

  socket.on('message', function (message) {
    if (message.sdp) {
      console.log('Remote sdp: ', message.sdp);
      pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
    } else {
      console.log('Remote candidate: ', message.candidate);
      if(message.candidate){
        pc.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    }
  });

  socket.on('leaved', function (peer, name) {
    currentRoom = null;
    messageDebugger.detach();
    pc.getLocalStreams()[0].stop(); // close video stream
    pc.close();
  });

  return {
    createRoom: createRoom,
    getRoom: getRoom,
    start: start,
    stop: stop
  };
})();



chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
  'use strict';

  console.log('Get message from popup: ' + msg.method);

  switch (msg.method) {
    case 'popupInit':
      if (app.getRoom()) {
        chrome.extension.sendMessage({roomUID: app.getRoom()});
      }
      break;
    case 'createRoom':
      app.createRoom(msg.name);
      break;
    case 'startCapturing':
      app.start();
      break;
    case 'stopCapturing':
      app.stop();
      break;
    case 'join':
      chrome.tabs.create({'url': chrome.extension.getURL('index.html')}, function(tab) {
        // Tab opened.
      });
      break;
  }
});
