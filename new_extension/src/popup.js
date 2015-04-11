(function () {
    'use strict';

    $(function () {
        var $toggleCapturing = $('#toggleCapturing'),
            $joinButton = $('#joinBtn');

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
