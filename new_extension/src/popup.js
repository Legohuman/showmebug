(function () {
    'use strict';

    $(function () {
        var $peerName = $('#peerName'),
            $createRoom = $('#createRoom'),
            $roomId = $('#roomId'),

            $toggleCapturing = $('#toggleCapturing'),
            $joinButton = $('#joinBtn');

        $createRoom.click(function () {
            chrome.extension.sendMessage({method: 'createRoom', name: $peerName.val()});
        });

        $toggleCapturing.click(function () {
            chrome.extension.sendMessage({method: 'toggleStart'});
            //$toggleCapturing.text('Stop capture');
            //$toggleCapturing.text('Start capture');
        });

        $joinButton.click(function () {
            chrome.extension.sendMessage({method: 'join'});
        });

        chrome.extension.onMessage.addListener(function (msg) {
            console.log('Get msg from background');
            if (msg.roomUID) {
                $roomId.text(msg.roomUID);
            }
        });
    });
})();
