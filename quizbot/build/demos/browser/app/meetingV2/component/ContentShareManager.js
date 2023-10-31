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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
const DemoMediaStreamProviders_1 = require("../util/mediastreamprovider/DemoMediaStreamProviders");
const CircularCut_1 = __importDefault(require("../video/filters/CircularCut"));
/**
 * Class to allow handling the UI interactions and display associated with content share.
 */
class ContentShareManager {
    constructor(logger, audioVideo, usingStereoMusicAudioProfile) {
        this.logger = logger;
        this.audioVideo = audioVideo;
        this.usingStereoMusicAudioProfile = usingStereoMusicAudioProfile;
        this.started = false;
        this.pendingLocalFileStart = false;
        this.paused = false;
        this.streamProvider = undefined;
        this.frameRate = undefined;
        this.enableCirculeCut = false;
        this.enableVolumeReduction = false;
        this.audioVideo.addContentShareObserver(this);
        this.initContentShareUI();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            let activeSourceSelection = undefined;
            document.querySelectorAll('.content-share-source-option').forEach((element) => {
                if (element.classList.contains('active')) {
                    activeSourceSelection = element;
                }
            });
            if (activeSourceSelection === undefined) {
                this.logger.error('No content share source selected');
                return;
            }
            this.streamProvider = undefined;
            switch (activeSourceSelection.id) {
                case 'dropdown-item-content-share-screen-capture': {
                    try {
                        this.logger.info(`Starting screen capture with frame rate ${this.frameRate}`);
                        if (this.enableCirculeCut || this.enableVolumeReduction) {
                            this.streamProvider = new DemoMediaStreamProviders_1.ScreenShareMediaStreamProvider(this.frameRate || 15);
                        }
                        else {
                            // Just use helper method
                            yield this.audioVideo.startContentShareFromScreenCapture(undefined, this.frameRate || undefined);
                        }
                    }
                    catch (e) {
                        // `getUserMedia` can throw
                        this.logger.error(`Could not start content share: ${e}`);
                        return;
                    }
                    break;
                }
                case 'dropdown-item-content-share-screen-test-video': {
                    this.streamProvider = new DemoMediaStreamProviders_1.FileMediaStreamProvider(ContentShareManager.TestVideo);
                    break;
                }
                case 'dropdown-item-content-share-test-mono-audio-speech': {
                    this.streamProvider = new DemoMediaStreamProviders_1.AudioBufferMediaStreamProvider('audio_file', true);
                    break;
                }
                case 'dropdown-item-content-share-test-stereo-audio-speech': {
                    this.streamProvider = new DemoMediaStreamProviders_1.AudioBufferMediaStreamProvider('stereo_audio_file', true);
                    break;
                }
                case 'dropdown-item-content-share-test-stereo-audio-tone': {
                    this.streamProvider = new DemoMediaStreamProviders_1.SynthesizedStereoMediaStreamProvider(500, 1000);
                    break;
                }
                case 'dropdown-item-content-share-file-item': {
                    const fileList = document.getElementById('content-share-item');
                    const file = fileList.files[0];
                    if (!file) {
                        this.logger.error('No content share file selected');
                        return;
                    }
                    const url = URL.createObjectURL(file);
                    this.streamProvider = new DemoMediaStreamProviders_1.FileMediaStreamProvider(url);
                    break;
                }
            }
            if (this.enableCirculeCut && (yield this.streamProvider.getMediaStream()).getVideoTracks().length !== 0) {
                const stages = [new CircularCut_1.default()];
                const videoTransformDevice = new amazon_chime_sdk_js_1.DefaultVideoTransformDevice(this.logger, undefined, stages);
                this.streamProvider = new DemoMediaStreamProviders_1.VideoTransformDeviceMediaStreamProvider(this.streamProvider, videoTransformDevice);
            }
            if (this.enableVolumeReduction && (yield this.streamProvider.getMediaStream()).getAudioTracks().length !== 0) {
                this.streamProvider = new DemoMediaStreamProviders_1.AudioGainMediaStreamProvider(this.streamProvider, 0.1);
            }
            if (this.streamProvider !== undefined) {
                yield this.audioVideo.startContentShare(yield this.streamProvider.getMediaStream());
            }
            this.started = true;
            this.paused = false;
            this.updateContentShareUX();
        });
    }
    stop() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.audioVideo.stopContentShare();
            (_a = this.streamProvider) === null || _a === void 0 ? void 0 : _a.pause();
            this.started = false;
            this.updateContentShareUX();
        });
    }
    initContentShareUI() {
        const buttonContentShare = document.getElementById('button-content-share');
        buttonContentShare.addEventListener('click', (_e) => {
            if (!this.started) {
                this.start();
            }
            else {
                this.stop();
            }
        });
        const buttonPauseContentShare = document.getElementById('dropdown-item-content-share-pause-resume');
        buttonPauseContentShare.addEventListener('click', (_e) => {
            if (!this.started) {
                this.logger.error('Content share cannot be paused if content share is not enabled');
                return;
            }
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                if (this.paused) {
                    this.audioVideo.unpauseContentShare();
                    (_a = this.streamProvider) === null || _a === void 0 ? void 0 : _a.resume();
                }
                else {
                    this.audioVideo.pauseContentShare();
                    (_b = this.streamProvider) === null || _b === void 0 ? void 0 : _b.pause();
                }
                this.paused = !this.paused;
                this.updateContentShareUX();
            }));
        });
        for (const id of ContentShareManager.SourceOptionElementIds) {
            document.getElementById(id).addEventListener('click', (event) => {
                event.target.classList.add('active');
                for (const idToMaybeStrip of ContentShareManager.SourceOptionElementIds) {
                    if (id === idToMaybeStrip) {
                        continue;
                    }
                    document.getElementById(idToMaybeStrip).classList.remove('active');
                }
                if (this.started) {
                    // If we have already started content share with a different source, immediately
                    // restart with the new one selected
                    this.stop();
                    // This restart will be completed by event listener below
                    if (id === 'dropdown-item-content-share-file-item') {
                        this.pendingLocalFileStart = true;
                    }
                    this.start();
                }
            });
        }
        document.getElementById('content-share-item').addEventListener('change', (_e) => {
            if (this.pendingLocalFileStart) {
                this.start();
                this.pendingLocalFileStart = false;
            }
        });
        if (!this.usingStereoMusicAudioProfile) {
            document.getElementById('dropdown-item-content-share-test-stereo-audio-speech').style.display = 'none';
            document.getElementById('dropdown-item-content-share-test-stereo-audio-tone').style.display = 'none';
        }
        document.getElementById('button-save-content-share-configs').addEventListener('click', () => {
            this.frameRate = parseInt(document.getElementById('content-capture-frame-rate').value, 10);
            const previousEnableVolumeReduction = this.enableVolumeReduction;
            const previousEnableCircularCut = this.enableCirculeCut;
            this.enableVolumeReduction = document.getElementById('content-enable-volume-reduction').checked;
            this.enableCirculeCut = document.getElementById('content-enable-circular-cut').checked;
            if (previousEnableVolumeReduction !== this.enableVolumeReduction ||
                previousEnableCircularCut !== this.enableCirculeCut) {
                this.logger.info(`New values for content share media processing, restarting. enableVolumeReduction:${this.enableVolumeReduction}, enableCirculeCut:${this.enableCirculeCut}`);
                if (this.started) {
                    this.stop();
                    this.start();
                }
            }
            const enableSimulcastForContentShare = document.getElementById('content-enable-simulcast')
                .checked;
            if (enableSimulcastForContentShare) {
                const lowMaxBitratesKbps = parseInt(document.getElementById('content-simulcast-low-max-bitratekbps').value) ||
                    undefined;
                const lowScaleFactor = parseInt(document.getElementById('content-simulcast-low-scale-factor').value) ||
                    undefined;
                const lowMaxFramerate = parseInt(document.getElementById('content-simulcast-low-max-framerate').value) ||
                    undefined;
                const highMaxBitratesKbps = parseInt(document.getElementById('content-simulcast-high-max-bitratekbps').value) ||
                    undefined;
                const highScaleFactor = parseInt(document.getElementById('content-simulcast-high-scale-factor').value) ||
                    undefined;
                const highMaxFramerate = parseInt(document.getElementById('content-simulcast-high-max-framerate').value) ||
                    undefined;
                this.audioVideo.enableSimulcastForContentShare(true, {
                    low: {
                        maxBitrateKbps: lowMaxBitratesKbps,
                        scaleResolutionDownBy: lowScaleFactor,
                        maxFramerate: lowMaxFramerate,
                    },
                    high: {
                        maxBitrateKbps: highMaxBitratesKbps,
                        scaleResolutionDownBy: highScaleFactor,
                        maxFramerate: highMaxFramerate,
                    },
                });
            }
            else {
                this.audioVideo.enableSimulcastForContentShare(false);
            }
        });
    }
    updateContentShareUX() {
        this.logger.info(`Updating content share UX, started:${this.started} paused:${this.paused}`);
        const contentSharePauseResumeElement = document.getElementById('dropdown-item-content-share-pause-resume');
        contentSharePauseResumeElement.style.display = this.started ? 'block' : 'none';
        contentSharePauseResumeElement.innerHTML = `${this.paused ? 'Resume' : 'Pause'} Content Share`;
    }
    contentShareDidStart() {
        this.logger.info('Content share started');
    }
    contentShareDidStop() {
        this.logger.info('Content share stopped');
    }
    contentShareDidPause() {
        this.logger.info('Content share paused');
    }
    contentShareDidUnpause() {
        this.logger.info('Content share unpaused');
    }
}
exports.default = ContentShareManager;
ContentShareManager.TestVideo = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.360p.vp9.webm';
ContentShareManager.SourceOptionElementIds = [
    'dropdown-item-content-share-screen-capture',
    'dropdown-item-content-share-screen-test-video',
    'dropdown-item-content-share-test-mono-audio-speech',
    'dropdown-item-content-share-test-stereo-audio-speech',
    'dropdown-item-content-share-test-stereo-audio-tone',
    'dropdown-item-content-share-file-item',
];
//# sourceMappingURL=ContentShareManager.js.map