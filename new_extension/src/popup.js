(function () {
    'use strict';

    $(function () {
        var $peerName = $('#peerName'),
            $createRoom = $('#createRoom'),
            $startRoom = $('#startRoom'),

            $toggleCapturing = $('#toggleCapturing'),
            $joinButton = $('#joinBtn');

        $createRoom.click(function () {
            chrome.extension.sendMessage({method: 'createRoom', name: $peerName.val()});
        });

        $startRoom.click(function () {
            chrome.extension.sendMessage({method: 'startRoom', name: $peerName.val()});
        });


        $toggleCapturing.click(function () {
            chrome.extension.sendMessage({method: 'toggleStart'});
            //$toggleCapturing.text('Stop capture');
            //$toggleCapturing.text('Start capture');
        });

        $joinButton.click(function () {
            chrome.extension.sendMessage({method: 'join'});
        });


    });
})();
