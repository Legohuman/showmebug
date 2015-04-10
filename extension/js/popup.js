(function () {
  'use strict';

  $(function () {
    var app = null,
    $toggleCapturing = $('#toggleCapturing');

    chrome.runtime.getBackgroundPage(function (backgroundPage) {
      app = backgroundPage.app;
    });

    $toggleCapturing.click(function () {
      if (app.states.stopped === app.extensionState) {
        app.start();
        $toggleCapturing.text('Stop capture');
      } else if (app.states.started === app.extensionState) {
        app.stop();
        $toggleCapturing.text('Start capture');
      }
    });
  });
})();
