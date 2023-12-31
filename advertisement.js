// Copyright 2013 Google Inc. All Rights Reserved.
// You may study, modify, and use this example for any purpose.
// Note that this example is provided "as is", WITHOUT WARRANTY
// of any kind either expressed or implied.
let adsManager;
let adsLoader;
let adDisplayContainer;
let intervalTimer;
let videoContent;
let adPlayer;
let counter = 0;
/**
 * Initializes IMA setup 1.0.
 */
function init() {
    try {
        counter++;
        videoContent = document.querySelector('#adPlayer #adContentElement');
        adPlayer = document.querySelector('#adPlayer');
        videoContent.setAttribute('playsinline', 'true');
        videoContent.setAttribute('muted', 'true');

        document.querySelector('#adContainer').addEventListener('click', onPlayTrigger);
        videoContent.addEventListener('click', onPlayTrigger);

        setUpIMA();
    } catch (e) {
        if (counter > 10) {
            removePlayer();
            return;
        };

        setTimeout(() => {
            init();
        }, 200);
    }
}

function onPlayTrigger(event) {
    document.querySelector('#adContainer').removeEventListener('click', onPlayTrigger);
    event.stopPropagation();
    playAds();
}

/**
 * Sets up IMA ad display container, ads loader, and makes an ad request.
 */
function setUpIMA() {
    try {
        google.ima.settings.setDisableCustomPlaybackForIOS10Plus(true);
        google.ima.settings.setLocale('ru');
    } catch (e) {
        console.log(e);
        removePlayer();
    }

    adDisplayContainer = new google.ima.AdDisplayContainer(document.getElementById('adContainer'), videoContent);

    // Create ads loader.
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    // Listen and respond to ads loaded and error events.
    adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        onAdsManagerLoaded, false);
    adsLoader.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR, onAdError, false);

    // An event listener to tell the SDK that our content video
    // is completed so the SDK can play any post-roll ads.
    videoContent.onended = function () {
        adsLoader.contentComplete();
    };

    // Request video ads.
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = 'https://srv224.com/zqglLIQRrbs0CBLPCttQ444RJqwH1Qps37TQhsd1SYs-39gLD6yYRoN91X7NladDIUAPt2TZARVCJMTlPIJ_e2iV0bQeMfoI';

    // Specify the linear and nonlinear slot sizes. This helps the SDK to
    // select the correct creative if multiple are returned.
    adsRequest.linearAdSlotWidth = '100%';
    adsRequest.linearAdSlotHeight = '100%';

    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;

    adsLoader.requestAds(adsRequest);
}

/**
 * Loads the video content and initializes IMA ad playback.
 */
function playAds() {
    // Initialize the container. Must be done via a user action on mobile devices.
    videoContent.load();
    adDisplayContainer.initialize();

    document.querySelector('#adContainer .mejs-mediaelement video').style.display = 'block';

    try {
        // Initialize the ads manager. Ad rules playlist will start at this time.
        const player = document.querySelector("#adPlayer");
        adsManager.init(player.clientWidth, player.clientHeight, google.ima.ViewMode.NORMAL);
        // Call play to start showing the ad. Single video and overlay ads will
        // start at this time; the call will be ignored for ad rules.
        adsManager.start();
    } catch (adError) {
        // An error may be thrown if there was a problem with the VAST response.
        videoContent.play();
        onAdError(adError);
    }
}

/**
 * Handles the ad manager loading and sets ad event listeners.
 * @param {!google.ima.AdsManagerLoadedEvent} adsManagerLoadedEvent
 */
function onAdsManagerLoaded(adsManagerLoadedEvent) {
    // Get the ads manager.
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    // videoContent should be set to the content video element.
    adsManager =
        adsManagerLoadedEvent.getAdsManager(videoContent, adsRenderingSettings);

    // Add listeners to the required events.
    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
    adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
        onContentResumeRequested);
    adsManager.addEventListener(
        google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEvent);

    // Listen to any additional events, if necessary.
    adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.CLICK, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.PAUSE, onAdEvent);
}

/**
 * Handles actions taken in response to ad events.
 * @param {!google.ima.AdEvent} adEvent
 */
function onAdEvent(adEvent) {
    // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
    // don't have ad object associated.
    const ad = adEvent.getAd();
    switch (adEvent.type) {
        case google.ima.AdEvent.Type.LOADED:
            // This is the first event sent for an ad - it is possible to
            // determine whether the ad is a video ad or an overlay.
            if (!ad.isLinear()) {
                // Position AdDisplayContainer correctly for overlay.
                // Use ad.width and ad.height.
                videoContent.play();
            }
            break;
        case google.ima.AdEvent.Type.STARTED:
            // This event indicates the ad has started - the video player
            // can adjust the UI, for example display a pause button and
            // remaining time.
            if (ad.isLinear()) {
                // For a linear ad, a timer can be started to poll for
                // the remaining time.
                intervalTimer = setInterval(
                    function () {
                        // Example: const remainingTime = adsManager.getRemainingTime();
                    },
                    300);  // every 300ms
            }
            break;
        case google.ima.AdEvent.Type.COMPLETE:
            // This event indicates the ad has finished - the video player
            // can perform appropriate UI actions, such as removing the timer for
            // remaining time detection.
            if (ad.isLinear()) {
                clearInterval(intervalTimer);
            }
            removePlayer();
            break;
        case google.ima.AdEvent.Type.SKIPPED:
            removePlayer();
            break;
        case google.ima.AdEvent.Type.USER_CLOSE:
            removePlayer();
            break;
        case google.ima.AdEvent.Type.ALL_ADS_COMPLETED:
            removePlayer();
            break;
        case google.ima.AdEvent.Type.CLICK:
            removePlayer();
            break;
    }
}

function removePlayer() {
    adPlayer.parentNode.removeChild(adPlayer);
    if (adsManager) {
        adsManager.destroy();
    }
}

/**
 * Handles ad errors.
 * @param {!google.ima.AdErrorEvent} adErrorEvent
 */
function onAdError(adErrorEvent) {
    removePlayer();
    if (adsManager) {
        adsManager.destroy();
    }
}

/**
 * Pauses video content and sets up ad UI.
 */
function onContentPauseRequested() {
    videoContent.pause();
    // This function is where you should setup UI for showing ads (e.g.
    // display ad timer countdown, disable seeking etc.)
    // setupUIForAds();
}

/**
 * Resumes video content and removes ad UI.
 */
function onContentResumeRequested() {
    videoContent.play();
    // This function is where you should ensure that your UI is ready
    // to play content. It is the responsibility of the Publisher to
    // implement this function when necessary.
    // setupUIForContent();
}

// Wire UI element references and UI event listeners.
init();
