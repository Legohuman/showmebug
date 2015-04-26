(function () {
    'use strict';

    $(function () {
        var $peerName = $('#peerName'),
            $createRoom = $('#createRoom'),
            $roomId = $('#roomId'),

            $toggleCapturing = $('#toggleCapturing'),
            $stopCapturing = $('#stopCapturing'),
            $joinButton = $('#joinBtn');

        chrome.extension.onMessage.addListener(function (msg) {
            console.log('Get msg from background');
            if (msg.roomUID) {
                $roomId.text(msg.roomUID);
            }
        });

        chrome.extension.sendMessage({method: 'popupInit'});

        $createRoom.click(function () {
            chrome.extension.sendMessage({method: 'createRoom', name: $peerName.val()});
        });

        $toggleCapturing.click(function () {
            chrome.extension.sendMessage({method: 'startCapturing'});
            // TODO: add states: start and stop
            //$toggleCapturing.text('Stop capture');
            //$toggleCapturing.text('Start capture');
            //chrome.extension.sendMessage({method: 'stopCapturing'});
        });

        $stopCapturing.click(function () {
            chrome.extension.sendMessage({method: 'stopCapturing'});
        });

        $joinButton.click(function () {
            chrome.extension.sendMessage({method: 'join'});
        });
    });
})();
