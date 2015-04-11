(function () {
    var socket = io('http://localhost:3000/'),
        $peerName = $('#peerName'),
        $roomUid = $('#roomUid'),
        $response = $('#response');

    $('#createRoom').click(function () {
        socket.emit('join', pub(), room());
    });

    $('#joinRoom').click(function () {
        socket.emit('join', sub(), room());
    });

    $('#leaveRoom').click(function () {
        socket.emit('leave', sub(), room());
    });

    $('#destroyRoom').click(function () {
        socket.emit('leave', pub(), room());
    });

    $('#sendMessage').click(function () {
        socket.emit('message', $('#message').val());
    });

    $('#listRooms').click(function () {
        socket.emit('rooms');
    });

    $('#listPeers').click(function () {
        socket.emit('peers');
    });

    socket.on('joined', function(response){$response.text(JSON.stringify(arguments))});
    socket.on('not_joined', function(response){$response.text(JSON.stringify(arguments))});
    socket.on('leaved', function(response){$response.text(JSON.stringify(arguments))});
    socket.on('not_leaved', function(response){$response.text(JSON.stringify(arguments))});
    socket.on('message', function(response){$response.text(JSON.stringify(arguments))});
    socket.on('not_sent', function(response){$response.text(JSON.stringify(arguments))});
    socket.on('rooms', function(response){$response.text(JSON.stringify(arguments))});
    socket.on('peers', function(response){$response.text(JSON.stringify(arguments))});

    function room() {
        return $roomUid.val()
    }

    function pub() {
        return {
            name: $peerName.val(),
            role: 'pub'
        }
    }

    function sub() {
        return {
            name: $peerName.val(),
            role: 'sub'
        }
    }
})();
