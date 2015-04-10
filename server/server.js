var express = require('express'),
app = express();
app.use(express.static('static'));
var http = require('http').Server(app),
io = require('socket.io')(http);

io.on('connection', function (socket) {
  socket.on('message', function (msg) {
    console.log(msg);
    socket.broadcast.emit('message', msg);
  });
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});
