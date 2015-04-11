
function initCapture(callback) {
    try {
        window.navigator.mozGetUserMedia({
                video: {
                    mozMediaSource: "screen",
                    mediaSource: "screen"
                }
            },
            function successCallback(localMediaStream) {
                //window.stream = localMediaStream;
                //video.src = window.URL.createObjectURL(localMediaStream);
                //var video = document.getElementById("sampleVideo");
                //
                //video.mozSrcObject = localMediaStream;
                //video.play();
                callback(localMediaStream)
            },
            function errorCallback(error) {
                console.log("navigator.getUserMedia error: ", error);
            }
        );
    } catch (e) {
        getusermedia_error(e, param);
    }
}

function getusermedia_error(err, params) {
    if (params.video.mediaSource) {
        if (location.protocol != "https:") {
            console.log( "<p class='error'>" + err + "</p>" +
            "<p>Screen/window sharing now requires the site be loaded from an https: URL</p>" +
            "<p>Reloading on https: in 10 seconds</p>");
            //setTimeout(function() {
            //    window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
            //}, 10000);
        } else {
            console.log("<p class='error'>" + err + "</p>" +
            "<p>In <a href=\"about:config\">about:config</a>, please enable media.getusermedia.screensharing.enabled<br> and add this" +
            " site's domain name to media.getusermedia.screensharing.allowed_domains in about:config</p>");
        }
    } else {
        console.log( "<p class='error'>" + err + "</p>");
    }
}
