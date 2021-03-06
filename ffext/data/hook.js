

//var app = (function () {
//    'use strict';
//
//    var app = {},
//        serverUrl = 'http://localhost:3000/',
//        config = {
//            iceServers: [{
//                url: 'stun:stun.l.google.com:19302'
//            }]
//        },
//        socket = io(serverUrl),
//        pc,
//        sendChannel,
//        channelOpened = false,
//        tabId;
//
//    app.states = {
//        stopped: 'stopped',
//        starting: 'starting',
//        started: 'started',
//        stopping: 'stopping'
//    };
//    app.extensionState = app.states.stopped;
//
//    function getTabMedia(successCallback) {
//        chrome.tabs.query({active: true, currentWindow: true}, function () {
//            var constraints = {
//                audio: false,
//                video: true,
//                videoConstraints: {
//                    mandatory: {
//                        chromeMediaSource: 'tab'
//                    }
//                }
//            };
//
//            chrome.tabCapture.capture(constraints, successCallback);
//        });
//    }
//
//
//    function room() {
//        return '666';
//    }
//
//    function pub(peerName) {
//        return {
//            name: peerName,
//            role: 'pub'
//        }
//    }
//
//    function sub(peerName) {
//        return {
//            name: peerName,
//            role: 'sub'
//        }
//    }
//
//    app.createRoom = function (peerName) {
//        console.log('create room, socket id', socket.id, peerName);
//        socket.emit('join', pub(peerName), room());
//    };
//
//    app.sendMessageToChannel = function (text) {
//        if (channelOpened) {
//            sendChannel.send(text);
//        }
//    };
//
//// run start(true) to initiate a call
//    app.start = function () {
//        app.extensionState = app.states.starting;
//        pc = new RTCPeerConnection(config, {optional: [{RtpDataChannels: true}]});
//
//        sendChannel = pc.createDataChannel('RTCDataChannel', {reliable: false});
//        setChannelEvents(sendChannel, 'sendChannel');
//
//        attachDebugger();
//
//        setPeerConnectionEvents(pc);
//
//        getTabMedia(function (stream) {
//            pc.addStream(stream);
//
//            console.log('Offer conection to view process page');
//            pc.createOffer(gotDescription);
//
//            function gotDescription(desc) {
//                pc.setLocalDescription(new RTCSessionDescription(desc));
//                console.log('Local sdp: ', desc);
//                console.log('Send sdp, socket id', socket.id);
//                socket.emit('message', {"sdp": desc});
//            }
//        }, function (error) {
//            console.log('Error', error);
//        })
//    };
//
//    app.stop = function () {
//        app.extensionState = app.states.stopping;
//        //todo
//        app.extensionState = app.states.stopped;
//    };
//
//
//    function setPeerConnectionEvents(pc) {
//        // send any ice candidates to the other peer
//        pc.onicecandidate = function (evt) {
//            console.log('Local candidate: ', evt);
//            socket.emit('message', {'candidate': evt.candidate});
//        };
//    }
//
//    function setChannelEvents(channel) {
//        channel.onmessage = function (event) {
//            console.debug('Ext: ', event.data);
//        };
//        channel.onopen = function () {
//            channelOpened = true;
//            console.debug('Channel opened');
//        };
//        channel.onclose = function (e) {
//            channelOpened = false;
//            console.error(e);
//        };
//        channel.onerror = function (e) {
//            console.error(e);
//        };
//    }
//
//    socket.on('message', function (message) {
//        if (message.sdp) {
//            console.log('Remote sdp: ', message.sdp);
//            pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
//        } else {
//            console.log('Remote candidate: ', message.candidate);
//            if(message.candidate){
//                pc.addIceCandidate(new RTCIceCandidate(message.candidate));
//            }
//
//            app.extensionState = app.states.started;
//        }
//    });
//
//    socket.on('joined', function (peer, room) {
//        console.log('Join: ' + peer + ' : room ' + room);
//        chrome.extension.sendMessage({roomUID: room});
//    });
//
//    socket.on('ready', function (message) {
//        console.log('ready message');
//    });
//
//    return app;
//})();
//
//
//
//chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
//    'use strict';
//
//    console.log('Get message from popup: ' + msg.method);
//
//    switch (msg.method) {
//        case 'createRoom':
//            app.createRoom(msg.name);
//            break;
//        case 'toggleStart':
//            if (app.states.stopped === app.extensionState) {
//                app.start();
//            } else if (app.states.started === app.extensionState) {
//                app.stop();
//            }
//            break;
//        case 'join':
//            chrome.tabs.create({'url': chrome.extension.getURL('index.html')}, function(tab) {
//                // Tab opened.
//            });
//            break;
//    }
//});
