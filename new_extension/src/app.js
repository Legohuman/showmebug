(function () {
  'use strict';

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
      $('#tabShare').attr('src', URL.createObjectURL(evt.stream));
    };
  }

  function setChannelEvents(channel) {
    channel.onmessage = function (event) {
      console.debug('Ext: ', event.data);
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

  socket.on('message', function (message) {
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

  socket.on('ready', function (message) {
    console.log('ready message')
    //if (!pc) {
    //  console.log('Start viewing tab');
    //  answer();
    //}
  });

  socket.emit('join', null);
})();
