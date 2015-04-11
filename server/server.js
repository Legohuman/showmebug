var express = require('express'),
  app = express();
app.use(express.static('static'));
var http = require('http').Server(app),
  io = require('socket.io')(http);



var fs = require('fs');

var options = {
  key: fs.readFileSync(__dirname + '/ssl/key.pem'),
  cert: fs.readFileSync(__dirname + '/ssl/cert.pem')
};

var app1 = express();
app1.use(express.static('static'));
var https = require('https').createServer(options, app1).listen(3001);
io = require('socket.io')(https);

var portNumber = 3000;
http.listen(portNumber);
console.log('Listening ' + portNumber);

// usernames which are currently connected to server
var peers = {};

/**
 * rooms map <string, obj> of rooms which are currently available on server.
 * obj props
 *   uid: string - room uid
 *   peers: {
 *      pub: {peer}
 *      sub: {peer}
 *   }
 *
 *   {peer}:
 *       role: pub, sub
 *       name: unique user name
 *       socket: associated socket
 */
var rooms = {};

var peerInRooms = function (peer, rooms) {
  for (r in rooms) {
    var pub = rooms[r].peers.pub || {},
    sub = rooms[r].peers.sub || {};
      if(pub.name === peer.name || sub.name === peer.name){
      return true;
    }
  }
  return false;
};

io.on('connection', function (socket) {

  /**
   * peer obj with props
   *  role: pub, sub
   *  name: unique user name
   *
   * room: room number, used only for 'sub' peer
   */
  socket.on('join', function (peer, room) {
    console.log('join', peer, room);
    // store the username in the socket session for this client
    socket.username = peer.name;
    // add the client's username to the global list
    peers[peer.name] = peer;

    if (peer.role === 'sub') {
      var existingRoom = rooms[room];
      if (!existingRoom) {
        console.log('not_joined', 'No such room ' + room);
        socket.emit('not_joined', 'No such room ' + room);
      } else if (existingRoom && existingRoom.peers && existingRoom.peers.length == 2) {
        console.log('not_joined', 'Room is full ' + room);
        socket.emit('not_joined', 'Room is full ' + room);
      } else {
        existingRoom.peers.sub =  peer;
        // store the room name in the socket session for this client
        socket.room = room;
        //
        socket.join(room);
        console.log('joined', peer, room);
        socket.emit('joined', peer, room);
        socket.broadcast.to(room).emit('joined', peer, room);
      }
    } else {
      console.log('pub socket id ', socket.id);
      room = generateUid();
      rooms[room] = {
        uid: room,
        peers: {
         pub: {
           role: peer.role,
           name: peer.name
         }
        }
      };
      // store the room name in the socket session for this client
      socket.room = room;
      //
      socket.join(room);
      console.log('joined', peer, room);
      socket.emit('joined', peer, room);
      socket.broadcast.to(room).emit('joined', peer, room);
    }
  });

  socket.on('message', function (msg) {
    console.log('message received from ', socket.id, msg);
    var targetRoom = rooms[socket.room];
    if (!targetRoom) {
      console.log('not_sent', 'No such room ' + socket.room);
      socket.emit('not_sent', 'No such room ' + socket.room);
    } else {
      console.log('message broadcasted to ', socket.room);
      socket.broadcast.to(socket.room).emit('message', msg);
    }
  });

  socket.on('leave', function () {
    var targetRoom = rooms[socket.room];
    if (!targetRoom) {
      socket.emit('not_leaved', 'No such room ' + socket.room);
    } else {
      var existingPeer = peers[socket.username];
      if (!existingPeer) {
        socket.emit('not_leaved', 'No such peer ' + socket.username);
      } else {
        socket.emit('leaved', existingPeer, socket.room);
        socket.broadcast.to(socket.room).emit('leaved', existingPeer, socket.room);
        if (existingPeer.role === 'sub') {
          delete targetRoom.peers.sub;
          console.log('Remove peer from room ' + targetRoom.name);
        } else { //pub
          console.log('Delete room ' + socket.room);
          delete rooms[socket.room]
        }
        if (!peerInRooms(existingPeer, rooms)) {
          delete peers[socket.username];
        }
      }
    }
  });

  socket.on('rooms', function () {
    console.log('rooms', rooms);
    socket.emit('rooms', rooms);
  });

  socket.on('peers', function () {
    console.log('peers', peers);
    socket.emit('peers', peers);
  });

  //handlers for debug info
  socket.on('disconnect', function() {
    console.log('Disconnect! socket ', socket.id);
  });

  socket.on('error', function() {
    console.log('Connect error ', socket.id);
  });

  socket.on('reconnect', function() {
    console.log('Reconnect ', socket.id);
  });

  socket.on('reconnect_attempt', function() {
    console.log('Reconnect attempt ', socket.id);
  });

  socket.on('reconnecting', function() {
    console.log('Reconnecting ', socket.id);
  });

  socket.on('reconnect_error', function() {
    console.log('Reconnect error ', socket.id);
  });

  socket.on('reconnect_failed', function() {
    console.log('Reconnect failed ', socket.id);
  });

  function generateUid() {
    return Math.floor((1 + Math.random()) * 0x1000000000)
      .toString(10)
      .substring(1);
  }
});


