"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoMeetingApp = void 0;
require("../../style.scss");
require("bootstrap");
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid');
class SwappableLogger {
    constructor(inner) {
        this.inner = inner;
    }
    debug(debugFunction) {
        this.inner.debug(debugFunction);
    }
    info(msg) {
        this.inner.info(msg);
    }
    error(msg) {
        this.inner.error(msg);
    }
    warn(msg) {
        this.inner.warn(msg);
    }
    setLogLevel(level) {
        this.inner.setLogLevel(level);
    }
    getLogLevel() {
        return this.inner.getLogLevel();
    }
}
class DemoMeetingApp {
    constructor() {
        this.cameraDeviceIds = [];
        this.microphoneDeviceIds = [];
        this.meeting = null;
        this.name = null;
        this.region = null;
        this.meetingSession = null;
        this.audioVideo = null;
        this.meetingReadinessChecker = null;
        this.canStartLocalVideo = true;
        this.canHear = null;
        // feature flags
        this.enableWebAudio = false;
        this.enableSimulcast = false;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.markdown = require('markdown-it')({ linkify: true });
        this.lastMessageSender = null;
        this.lastReceivedMessageTimestamp = 0;
        this.getAudioInputDevice = () => {
            const dropdownList = document.getElementById('audio-input');
            if (dropdownList.value == 'No Audio') {
                // An empty media stream destination without any source connected to it, so it doesn't generate any audio.
                // This is currently only used for testing audio connectivity as part of meeting readiness checker
                // Note: It's currently not possible to emulate 'No Audio' in Firefox, so we don't provide it
                // as an option in the audio inputs list. Also, since waiting for attendee presence is explicitly executed inside
                // `DefaultAudioVideoController` if `attendeePresenceTimeoutMs` is configured to larger than zero, we need to
                // explicitly specify `attendeePresenceTimeoutMs`as zero for `No Audio` device
                this.meetingSession.configuration.attendeePresenceTimeoutMs = 0;
                return amazon_chime_sdk_js_1.DefaultDeviceController.getAudioContext().createMediaStreamDestination().stream;
            }
            return dropdownList.value;
        };
        this.getAudioOutputDeviceID = () => {
            const dropdownList = document.getElementById('audio-output');
            return dropdownList.value;
        };
        this.getVideoInputDeviceID = () => {
            const dropdownList = document.getElementById('video-input');
            return dropdownList.value;
        };
        this.speakerTest = () => __awaiter(this, void 0, void 0, function* () {
            const button = document.getElementById('speakertest-button');
            button.disabled = false;
        });
        this.audioTest = () => __awaiter(this, void 0, void 0, function* () {
            const speakerTestResult = document.getElementById('speaker-test');
            speakerTestResult.style.display = 'inline-block';
            this.createReadinessHtml('speaker-test', 'spinner-border');
            const audioOutput = this.getAudioOutputDeviceID();
            const speakerUserFeedbackHtml = document.getElementById('speaker-user-feedback');
            const audioElement = document.getElementById('speaker-test-audio-element');
            speakerUserFeedbackHtml.style.display = 'inline-block';
            const audioOutputResp = yield this.meetingReadinessChecker.checkAudioOutput(audioOutput, () => {
                return new Promise(resolve => {
                    const scheduler = new amazon_chime_sdk_js_1.IntervalScheduler(1000);
                    scheduler.start(() => {
                        if (this.canHear !== null) {
                            scheduler.stop();
                            resolve(this.canHear);
                        }
                    });
                });
            }, audioElement);
            const textToDisplay = amazon_chime_sdk_js_1.CheckAudioOutputFeedback[audioOutputResp];
            this.createReadinessHtml('speaker-test', textToDisplay);
            speakerUserFeedbackHtml.style.display = 'none';
            return audioOutputResp;
        });
        this.micTest = () => __awaiter(this, void 0, void 0, function* () {
            this.createReadinessHtml('mic-test', 'spinner-border');
            let audioInputDevice = this.getAudioInputDevice();
            const audioInputResp = yield this.meetingReadinessChecker.checkAudioInput(audioInputDevice);
            this.createReadinessHtml('mic-test', amazon_chime_sdk_js_1.CheckAudioInputFeedback[audioInputResp]);
            return audioInputResp;
        });
        this.videoTest = () => __awaiter(this, void 0, void 0, function* () {
            this.createReadinessHtml('video-test', 'spinner-border');
            const videoInput = this.getVideoInputDeviceID();
            const videoInputResp = yield this.meetingReadinessChecker.checkVideoInput(videoInput);
            const textToDisplay = amazon_chime_sdk_js_1.CheckVideoInputFeedback[videoInputResp];
            this.createReadinessHtml('video-test', textToDisplay);
            return videoInputResp;
        });
        this.cameraTest = () => __awaiter(this, void 0, void 0, function* () {
            this.createReadinessHtml('camera-test2', 'spinner-border');
            const videoInput = this.getVideoInputDeviceID();
            const cameraResolutionResp1 = yield this.meetingReadinessChecker.checkCameraResolution(videoInput, 640, 480);
            const cameraResolutionResp2 = yield this.meetingReadinessChecker.checkCameraResolution(videoInput, 1280, 720);
            const cameraResolutionResp3 = yield this.meetingReadinessChecker.checkCameraResolution(videoInput, 1920, 1080);
            let textToDisplay = `${amazon_chime_sdk_js_1.CheckCameraResolutionFeedback[cameraResolutionResp1]}@640x480p`;
            this.createReadinessHtml('camera-test1', textToDisplay);
            textToDisplay = `${amazon_chime_sdk_js_1.CheckCameraResolutionFeedback[cameraResolutionResp2]}@1280x720p`;
            this.createReadinessHtml('camera-test2', textToDisplay);
            textToDisplay = `${amazon_chime_sdk_js_1.CheckCameraResolutionFeedback[cameraResolutionResp3]}@1920x1080p`;
            this.createReadinessHtml('camera-test3', textToDisplay);
            return;
        });
        this.contentShareTest = () => __awaiter(this, void 0, void 0, function* () {
            const button = document.getElementById('contentshare-button');
            button.disabled = false;
        });
        this.audioConnectivityTest = () => __awaiter(this, void 0, void 0, function* () {
            this.createReadinessHtml('audioconnectivity-test', 'spinner-border');
            const audioInputDevice = this.getAudioInputDevice();
            const audioConnectivityResp = yield this.meetingReadinessChecker.checkAudioConnectivity(audioInputDevice);
            this.createReadinessHtml('audioconnectivity-test', amazon_chime_sdk_js_1.CheckAudioConnectivityFeedback[audioConnectivityResp]);
            return audioConnectivityResp;
        });
        this.videoConnectivityTest = () => __awaiter(this, void 0, void 0, function* () {
            this.createReadinessHtml('videoconnectivity-test', 'spinner-border');
            const videoInput = this.getVideoInputDeviceID();
            const videoConnectivityResp = yield this.meetingReadinessChecker.checkVideoConnectivity(videoInput);
            this.createReadinessHtml('videoconnectivity-test', amazon_chime_sdk_js_1.CheckVideoConnectivityFeedback[videoConnectivityResp]);
            return videoConnectivityResp;
        });
        this.networkTcpTest = () => __awaiter(this, void 0, void 0, function* () {
            this.createReadinessHtml('networktcp-test', 'spinner-border');
            const networkTcpResp = yield this.meetingReadinessChecker.checkNetworkTCPConnectivity();
            this.createReadinessHtml('networktcp-test', amazon_chime_sdk_js_1.CheckNetworkTCPConnectivityFeedback[networkTcpResp]);
            return networkTcpResp;
        });
        this.networkUdpTest = () => __awaiter(this, void 0, void 0, function* () {
            this.createReadinessHtml('networkudp-test', 'spinner-border');
            const networkUdpResp = yield this.meetingReadinessChecker.checkNetworkUDPConnectivity();
            this.createReadinessHtml('networkudp-test', amazon_chime_sdk_js_1.CheckNetworkUDPConnectivityFeedback[networkUdpResp]);
            return networkUdpResp;
        });
        this.continueTestExecution = () => __awaiter(this, void 0, void 0, function* () {
            yield this.micTest();
            yield this.videoTest();
            yield this.cameraTest();
            yield this.networkUdpTest();
            yield this.networkTcpTest();
            yield this.audioConnectivityTest();
            yield this.videoConnectivityTest();
            yield this.contentShareTest();
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        global.app = this;
        document.getElementById('sdk-version-readiness').innerText =
            'amazon-chime-sdk-js@' + amazon_chime_sdk_js_1.Versioning.sdkVersion;
        this.initEventListeners();
        this.initParameters();
        this.setMediaRegion();
        this.switchToFlow('flow-authenticate');
        const logLevel = amazon_chime_sdk_js_1.LogLevel.INFO;
        this.logger = new SwappableLogger(new amazon_chime_sdk_js_1.ConsoleLogger('SDK', logLevel));
    }
    switchToFlow(flow) {
        this.analyserNodeCallback = () => { };
        Array.from(document.getElementsByClassName('flow')).map(e => (e.style.display = 'none'));
        document.getElementById(flow).style.display = 'block';
    }
    initParameters() {
        this.defaultBrowserBehaviour = new amazon_chime_sdk_js_1.DefaultBrowserBehavior();
        // Initialize logger and device controller to populate device list
        new amazon_chime_sdk_js_1.AsyncScheduler().start(() => __awaiter(this, void 0, void 0, function* () {
            yield this.initializeDeviceController();
            yield this.initializeLogger();
            const button = document.getElementById('authenticate');
            button.disabled = false;
        }));
    }
    startMeetingAndInitializeMeetingReadinessChecker() {
        return __awaiter(this, void 0, void 0, function* () {
            //start meeting
            let chimeMeetingId = '';
            this.meeting = `READINESS_CHECKER-${uuidv4()}`;
            this.name = `READINESS_CHECKER${uuidv4()}`;
            try {
                this.region = document.getElementById('inputRegion').value;
                chimeMeetingId = yield this.authenticate();
                this.log(`chimeMeetingId: ${chimeMeetingId}`);
                return chimeMeetingId;
            }
            catch (error) {
                const httpErrorMessage = 'UserMedia is not allowed in HTTP sites. Either use HTTPS or enable media capture on insecure sites.';
                document.getElementById('failed-meeting').innerText = `Meeting ID: ${this.meeting}`;
                document.getElementById('failed-meeting-error').innerText =
                    window.location.protocol === 'http:' ? httpErrorMessage : error.message;
                this.switchToFlow('flow-failed-meeting');
                return null;
            }
        });
    }
    authenticate() {
        return __awaiter(this, void 0, void 0, function* () {
            const joinInfo = (yield this.joinMeeting()).JoinInfo;
            this.region = joinInfo.Meeting.Meeting.MediaRegion;
            const configuration = new amazon_chime_sdk_js_1.MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
            yield this.initializeMeetingSession(configuration);
            return configuration.meetingId;
        });
    }
    createLogStream(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = JSON.stringify({
                meetingId: configuration.meetingId,
                attendeeId: configuration.credentials.attendeeId,
            });
            try {
                const response = yield fetch(`${DemoMeetingApp.BASE_URL}create_log_stream`, {
                    method: 'POST',
                    body,
                });
                if (response.status === 200) {
                    console.log('Log stream created');
                }
            }
            catch (error) {
                console.error(error.message);
            }
        });
    }
    createReadinessHtml(id, textToDisplay) {
        const readinessElement = document.getElementById(id);
        readinessElement.innerHTML = '';
        readinessElement.innerText = textToDisplay;
        if (id === 'readiness-header') {
            return;
        }
        else if (textToDisplay === 'spinner-border') {
            readinessElement.innerHTML = '';
            readinessElement.className = '';
            readinessElement.className = 'spinner-border';
        }
        else if (textToDisplay.includes('Succeeded')) {
            readinessElement.className = '';
            readinessElement.className = 'badge bg-success';
        }
        else {
            readinessElement.className = 'badge bg-warning';
        }
    }
    initEventListeners() {
        //event listener for user feedback for speaker output
        document.getElementById('speaker-yes').addEventListener('input', e => {
            e.preventDefault();
            this.canHear = true;
        });
        document.getElementById('speaker-no').addEventListener('input', e => {
            e.preventDefault();
            this.canHear = false;
        });
        const speakerTestButton = document.getElementById('speakertest-button');
        speakerTestButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            speakerTestButton.style.display = 'none';
            yield this.audioTest();
            speakerTestButton.disabled = true;
            yield this.continueTestExecution();
        }));
        const contentShareButton = document.getElementById('contentshare-button');
        contentShareButton.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            contentShareButton.style.display = 'none';
            const contentShareResult = document.getElementById('contentshare-test');
            contentShareResult.style.display = 'inline-block';
            this.createReadinessHtml('contentshare-test', 'spinner-border');
            const contentShareResp = yield this.meetingReadinessChecker.checkContentShareConnectivity();
            this.createReadinessHtml('contentshare-test', amazon_chime_sdk_js_1.CheckContentShareConnectivityFeedback[contentShareResp]);
            contentShareButton.disabled = true;
            this.createReadinessHtml('readiness-header', 'Readiness tests complete!');
        }));
        document.getElementById('form-authenticate').addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            if (!!(yield this.startMeetingAndInitializeMeetingReadinessChecker())) {
                this.switchToFlow('flow-readinesstest');
                //create new HTML header
                document.getElementById('sdk-version').innerText =
                    'amazon-chime-sdk-js@' + amazon_chime_sdk_js_1.Versioning.sdkVersion;
                this.createReadinessHtml('readiness-header', 'Readiness tests underway...');
                yield this.speakerTest();
            }
        }));
    }
    initializeDeviceController() {
        return __awaiter(this, void 0, void 0, function* () {
            this.deviceController = new amazon_chime_sdk_js_1.DefaultDeviceController(this.logger, {
                enableWebAudio: this.enableWebAudio,
            });
            yield this.populateAllDeviceLists();
        });
    }
    initializeLogger(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            const logLevel = amazon_chime_sdk_js_1.LogLevel.INFO;
            const consoleLogger = new amazon_chime_sdk_js_1.ConsoleLogger('SDK', logLevel);
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || !configuration) {
                this.logger.inner = consoleLogger;
            }
            else {
                yield this.createLogStream(configuration);
                const metadata = {
                    appName: 'SDK',
                    meetingId: configuration.meetingId,
                    attendeeId: configuration.credentials.attendeeId,
                };
                this.logger.inner = new amazon_chime_sdk_js_1.MultiLogger(consoleLogger, new amazon_chime_sdk_js_1.POSTLogger({
                    url: `${DemoMeetingApp.BASE_URL}logs`,
                    batchSize: DemoMeetingApp.LOGGER_BATCH_SIZE,
                    intervalMs: DemoMeetingApp.LOGGER_INTERVAL_MS,
                    logLevel,
                    metadata,
                }));
            }
        });
    }
    initializeMeetingSession(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initializeLogger(configuration);
            configuration.attendeePresenceTimeoutMs = 15000;
            configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = this.enableSimulcast;
            this.meetingSession = new amazon_chime_sdk_js_1.DefaultMeetingSession(configuration, this.logger, this.deviceController);
            this.audioVideo = this.meetingSession.audioVideo;
            this.meetingReadinessChecker = new amazon_chime_sdk_js_1.DefaultMeetingReadinessChecker(this.logger, this.meetingSession);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            global.meetingReadinessChecker = this.meetingReadinessChecker;
            this.setupDeviceLabelTrigger();
        });
    }
    setupDeviceLabelTrigger() {
        // Note that device labels are privileged since they add to the
        // fingerprinting surface area of the browser session. In Chrome private
        // tabs and in all Firefox tabs, the labels can only be read once a
        // MediaStream is active. How to deal with this restriction depends on the
        // desired UX. The device controller includes an injectable device label
        // trigger which allows you to perform custom behavior in case there are no
        // labels, such as creating a temporary audio/video stream to unlock the
        // device names, which is the default behavior. Here we override the
        // trigger to also show an alert to let the user know that we are asking for
        // mic/camera permission.
        //
        // Also note that Firefox has its own device picker, which may be useful
        // for the first device selection. Subsequent device selections could use
        // a custom UX with a specific device id.
        this.audioVideo.setDeviceLabelTrigger(() => __awaiter(this, void 0, void 0, function* () {
            const stream = yield navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            return stream;
        }));
    }
    populateAllDeviceLists() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.populateAudioInputList();
            yield this.populateVideoInputList();
            yield this.populateAudioOutputList();
        });
    }
    populateAudioInputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const genericName = 'Microphone';
            const additionalDevices = ['None'];
            if (!this.defaultBrowserBehaviour.hasFirefoxWebRTC()) {
                // We don't add this in Firefox because there is no known mechanism, using MediaStream or WebAudio APIs,
                // to *not* generate audio in Firefox. By default, everything generates silent audio packets in Firefox.
                additionalDevices.push('No Audio');
            }
            this.populateDeviceList('audio-input', genericName, yield this.deviceController.listAudioInputDevices(), additionalDevices);
        });
    }
    populateVideoInputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const genericName = 'Camera';
            const additionalDevices = ['None'];
            this.populateDeviceList('video-input', genericName, yield this.deviceController.listVideoInputDevices(), additionalDevices);
            const cameras = yield this.deviceController.listVideoInputDevices();
            this.cameraDeviceIds = cameras.map(deviceInfo => {
                return deviceInfo.deviceId;
            });
        });
    }
    populateAudioOutputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const genericName = 'Speaker';
            const additionalDevices = [];
            this.populateDeviceList('audio-output', genericName, yield this.deviceController.listAudioOutputDevices(), additionalDevices);
        });
    }
    populateDeviceList(elementId, genericName, devices, additionalOptions) {
        const list = document.getElementById(elementId);
        while (list.firstElementChild) {
            list.removeChild(list.firstElementChild);
        }
        for (let i = 0; i < devices.length; i++) {
            const option = document.createElement('option');
            list.appendChild(option);
            option.text = devices[i].label || `${genericName} ${i + 1}`;
            option.value = devices[i].deviceId;
        }
        if (additionalOptions.length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.text = '──────────';
            list.appendChild(separator);
            for (const additionalOption of additionalOptions) {
                const option = document.createElement('option');
                list.appendChild(option);
                option.text = additionalOption;
                option.value = additionalOption;
            }
        }
        if (!list.firstElementChild) {
            const option = document.createElement('option');
            option.text = 'Device selection unavailable';
            list.appendChild(option);
        }
    }
    join() {
        return __awaiter(this, void 0, void 0, function* () {
            window.addEventListener('unhandledrejection', (event) => {
                this.log(event.reason);
            });
            this.audioVideo.start();
        });
    }
    // eslint-disable-next-line
    joinMeeting() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(this.meeting)}&name=${encodeURIComponent(this.name)}&region=${encodeURIComponent(this.region)}`, {
                method: 'POST',
            });
            const json = yield response.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            return json;
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    endMeeting() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fetch(`${DemoMeetingApp.BASE_URL}end?title=${encodeURIComponent(this.meeting)}`, {
                method: 'POST',
            });
        });
    }
    getSupportedMediaRegions() {
        const supportedMediaRegions = [];
        const mediaRegion = document.getElementById('inputRegion');
        for (let i = 0; i < mediaRegion.length; i++) {
            supportedMediaRegions.push(mediaRegion.value);
        }
        return supportedMediaRegions;
    }
    getNearestMediaRegion() {
        return __awaiter(this, void 0, void 0, function* () {
            const nearestMediaRegionResponse = yield fetch(`https://nearest-media-region.l.chime.aws`, {
                method: 'GET',
            });
            const nearestMediaRegionJSON = yield nearestMediaRegionResponse.json();
            const nearestMediaRegion = nearestMediaRegionJSON.region;
            return nearestMediaRegion;
        });
    }
    setMediaRegion() {
        new amazon_chime_sdk_js_1.AsyncScheduler().start(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const query = new URLSearchParams(document.location.search);
                const region = query.get('region');
                const nearestMediaRegion = region ? region : yield this.getNearestMediaRegion();
                if (nearestMediaRegion === '' || nearestMediaRegion === null) {
                    throw new Error('Nearest Media Region cannot be null or empty');
                }
                const supportedMediaRegions = this.getSupportedMediaRegions();
                if (supportedMediaRegions.indexOf(nearestMediaRegion) === -1) {
                    supportedMediaRegions.push(nearestMediaRegion);
                    const mediaRegionElement = document.getElementById('inputRegion');
                    const newMediaRegionOption = document.createElement('option');
                    newMediaRegionOption.value = nearestMediaRegion;
                    newMediaRegionOption.text = nearestMediaRegion + ' (' + nearestMediaRegion + ')';
                    mediaRegionElement.add(newMediaRegionOption, null);
                }
                document.getElementById('inputRegion').value = nearestMediaRegion;
            }
            catch (error) {
                this.log('Default media region selected: ' + error.message);
            }
        }));
    }
    log(str) {
        console.log(`[Meeting Readiness Checker] ${str}`);
    }
}
exports.DemoMeetingApp = DemoMeetingApp;
DemoMeetingApp.BASE_URL = [
    location.protocol,
    '//',
    location.host,
    location.pathname.replace(/\/*$/, '/'),
].join('');
DemoMeetingApp.LOGGER_BATCH_SIZE = 85;
DemoMeetingApp.LOGGER_INTERVAL_MS = 2000;
window.addEventListener('load', () => {
    new DemoMeetingApp();
});
//# sourceMappingURL=meetingReadinessChecker.js.map