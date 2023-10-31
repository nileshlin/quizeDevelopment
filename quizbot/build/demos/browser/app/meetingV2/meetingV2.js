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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoMeetingApp = exports.fatal = void 0;
require("./styleV2.scss");
require("./dbfunctions");
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
const bootstrap_1 = require("bootstrap");
const TestSound_1 = __importDefault(require("./audio/TestSound"));
const MeetingToast_1 = __importDefault(require("./util/MeetingToast"));
MeetingToast_1.default; // Make sure this file is included in webpack
const VideoTileCollection_1 = __importDefault(require("./video/VideoTileCollection"));
const VideoPreferenceManager_1 = __importDefault(require("./video/VideoPreferenceManager"));
const CircularCut_1 = __importDefault(require("./video/filters/CircularCut"));
const EmojifyVideoFrameProcessor_1 = __importDefault(require("./video/filters/EmojifyVideoFrameProcessor"));
const SegmentationProcessor_1 = __importDefault(require("./video/filters/SegmentationProcessor"));
const ResizeProcessor_1 = __importDefault(require("./video/filters/ResizeProcessor"));
const SegmentationUtil_1 = require("./video/filters/SegmentationUtil");
const SyntheticVideoDeviceFactory_1 = __importDefault(require("./video/SyntheticVideoDeviceFactory"));
const MeetingLogger_1 = require("./util/MeetingLogger");
const Roster_1 = __importDefault(require("./component/Roster"));
const ContentShareManager_1 = __importDefault(require("./component/ContentShareManager"));
const DemoMediaStreamProviders_1 = require("./util/mediastreamprovider/DemoMediaStreamProviders");
const BackgroundImage_1 = require("./util/BackgroundImage");
let SHOULD_EARLY_CONNECT = (() => {
    return document.location.search.includes('earlyConnect=1');
})();
let SHOULD_DIE_ON_FATALS = (() => {
    const isLocal = document.location.host === '127.0.0.1:8080' || document.location.host === 'localhost:8080';
    const fatalYes = document.location.search.includes('fatal=1');
    const fatalNo = document.location.search.includes('fatal=0');
    return fatalYes || (isLocal && !fatalNo);
})();
// Support a set of query parameters to allow for testing pre-release versions of
// Amazon Voice Focus. If none of these parameters are supplied, the SDK default
// values will be used.
const search = new URLSearchParams(document.location.search);
const VOICE_FOCUS_NAME = search.get('voiceFocusName') || undefined;
const VOICE_FOCUS_CDN = search.get('voiceFocusCDN') || undefined;
const VOICE_FOCUS_ASSET_GROUP = search.get('voiceFocusAssetGroup') || undefined;
const VOICE_FOCUS_REVISION_ID = search.get('voiceFocusRevisionID') || undefined;
const VOICE_FOCUS_PATHS = VOICE_FOCUS_CDN && {
    processors: `${VOICE_FOCUS_CDN}processors/`,
    wasm: `${VOICE_FOCUS_CDN}wasm/`,
    workers: `${VOICE_FOCUS_CDN}workers/`,
    models: `${VOICE_FOCUS_CDN}wasm/`,
};
function voiceFocusName(name = VOICE_FOCUS_NAME) {
    if (name && ['default', 'ns_es'].includes(name)) {
        return name;
    }
    return undefined;
}
const VOICE_FOCUS_SPEC = {
    name: voiceFocusName(),
    assetGroup: VOICE_FOCUS_ASSET_GROUP,
    revisionID: VOICE_FOCUS_REVISION_ID,
    paths: VOICE_FOCUS_PATHS,
};
function getVoiceFocusSpec(joinInfo) {
    var _a, _b, _c;
    const es = ((_c = (_b = (_a = joinInfo.Meeting.Meeting) === null || _a === void 0 ? void 0 : _a.MeetingFeatures) === null || _b === void 0 ? void 0 : _b.Audio) === null || _c === void 0 ? void 0 : _c.EchoReduction) === 'AVAILABLE';
    let spec = VOICE_FOCUS_SPEC;
    if (!spec.name) {
        spec.name = es ? voiceFocusName('ns_es') : voiceFocusName('default');
    }
    return spec;
}
;
const MAX_VOICE_FOCUS_COMPLEXITY = undefined;
const BACKGROUND_BLUR_CDN = search.get('blurCDN') || undefined;
const BACKGROUND_BLUR_ASSET_GROUP = search.get('blurAssetGroup') || undefined;
const BACKGROUND_BLUR_REVISION_ID = search.get('blurRevisionID') || undefined;
const BACKGROUND_BLUR_PATHS = BACKGROUND_BLUR_CDN && {
    worker: `${BACKGROUND_BLUR_CDN}/bgblur/workers/worker.js`,
    wasm: `${BACKGROUND_BLUR_CDN}/bgblur/wasm/_cwt-wasm.wasm`,
    simd: `${BACKGROUND_BLUR_CDN}/bgblur/wasm/_cwt-wasm-simd.wasm`,
};
const BACKGROUND_BLUR_MODEL = BACKGROUND_BLUR_CDN &&
    amazon_chime_sdk_js_1.ModelSpecBuilder.builder()
        .withSelfieSegmentationDefaults()
        .withPath(`${BACKGROUND_BLUR_CDN}/bgblur/models/selfie_segmentation_landscape.tflite`)
        .build();
const BACKGROUND_BLUR_ASSET_SPEC = (BACKGROUND_BLUR_ASSET_GROUP || BACKGROUND_BLUR_REVISION_ID) && {
    assetGroup: BACKGROUND_BLUR_ASSET_GROUP,
    revisionID: BACKGROUND_BLUR_REVISION_ID,
};
const BACKGROUND_BLUR_V1_LIST = [
    'Background Blur 10% CPU',
    'Background Blur 20% CPU',
    'Background Blur 30% CPU',
    'Background Blur 40% CPU',
];
const BACKGROUND_REPLACEMENT_V1_LIST = ['Background Replacement'];
const BACKGROUND_FILTER_V2_LIST = [
    'Background Blur 2.0 - Low',
    'Background Blur 2.0 - Medium',
    'Background Blur 2.0 - High',
    'Background Replacement 2.0 - (Beach)',
    'Background Replacement 2.0 - (Blue)',
    'Background Replacement 2.0 - (Default)',
];
const VIDEO_FILTERS = ['Emojify', 'NoOp', 'Resize (9/16)', 'CircularCut'];
const SimulcastLayerMapping = {
    [amazon_chime_sdk_js_1.SimulcastLayers.Low]: 'Low',
    [amazon_chime_sdk_js_1.SimulcastLayers.LowAndMedium]: 'Low and Medium',
    [amazon_chime_sdk_js_1.SimulcastLayers.LowAndHigh]: 'Low and High',
    [amazon_chime_sdk_js_1.SimulcastLayers.Medium]: 'Medium',
    [amazon_chime_sdk_js_1.SimulcastLayers.MediumAndHigh]: 'Medium and High',
    [amazon_chime_sdk_js_1.SimulcastLayers.High]: 'High',
};
const LANGUAGES_NO_WORD_SEPARATOR = new Set(['ja-JP', 'zh-CN']);
class DemoMeetingApp {
    constructor() {
        // Ideally we don't need to change this. Keep this configurable in case users have a super slow network.
        this.loadingBodyPixDependencyTimeoutMs = 10000;
        this.attendeeIdPresenceHandler = undefined;
        this.activeSpeakerHandler = undefined;
        this.volumeIndicatorHandler = undefined;
        this.canUnmuteLocalAudioHandler = undefined;
        this.muteAndUnmuteLocalAudioHandler = undefined;
        this.blurObserver = undefined;
        this.replacementObserver = undefined;
        this.showActiveSpeakerScores = false;
        this.meeting = null;
        this.name = null;
        this.voiceConnectorId = null;
        this.sipURI = null;
        this.region = null;
        this.primaryExternalMeetingId = undefined;
        // We cache these so we can avoid having to create new attendees for promotion retries
        // and so the local UX on attendee IDs matches the remote experience
        this.primaryMeetingSessionCredentials = undefined;
        this.meetingSession = null;
        this.priorityBasedDownlinkPolicy = null;
        this.audioVideo = null;
        this.deviceController = undefined;
        this.canStartLocalVideo = true;
        this.defaultBrowserBehavior = new amazon_chime_sdk_js_1.DefaultBrowserBehavior();
        this.videoTileCollection = undefined;
        this.videoPreferenceManager = undefined;
        // eslint-disable-next-line
        this.roster = new Roster_1.default();
        this.contentShare = undefined;
        this.cameraDeviceIds = [];
        this.microphoneDeviceIds = [];
        this.buttonStates = {
            'button-microphone': 'on',
            'button-camera': 'off',
            'button-speaker': 'on',
            'button-content-share': 'off',
            'button-live-transcription': 'on',
            'button-video-stats': 'off',
            'button-promote-to-primary': 'off',
            'button-video-filter': 'off',
            'button-video-recording-drop': 'off',
            'button-record-self': 'off',
            'button-record-cloud': 'off',
            'button-live-connector': 'off'
        };
        this.isViewOnly = false;
        // feature flags
        this.enableWebAudio = false;
        this.logLevel = amazon_chime_sdk_js_1.LogLevel.INFO;
        this.videoCodecPreferences = undefined;
        this.enableSimulcast = false;
        this.usePriorityBasedDownlinkPolicy = false;
        this.videoPriorityBasedPolicyConfig = new amazon_chime_sdk_js_1.VideoPriorityBasedPolicyConfig;
        this.enablePin = false;
        this.echoReductionCapability = false;
        this.usingStereoMusicAudioProfile = false;
        this.supportsVoiceFocus = false;
        this.enableVoiceFocus = false;
        this.joinMuted = true;
        this.voiceFocusIsActive = false;
        this.supportsBackgroundBlur = true;
        this.supportsBackgroundReplacement = false;
        this.supportsVideoFx = false;
        this.enableLiveTranscription = true;
        this.noWordSeparatorForTranscription = false;
        this.markdown = require('markdown-it')({ linkify: true });
        this.lastMessageSender = null;
        this.lastReceivedMessageTimestamp = 0;
        this.lastPacketsSent = 0;
        this.lastTotalAudioPacketsExpected = 0;
        this.lastTotalAudioPacketsLost = 0;
        this.lastTotalAudioPacketsRecoveredRed = 0;
        this.lastTotalAudioPacketsRecoveredFec = 0;
        this.lastRedRecoveryMetricsReceived = 0;
        this.hasChromiumWebRTC = this.defaultBrowserBehavior.hasChromiumWebRTC();
        this.deleteOwnAttendeeToLeave = false;
        this.disablePeriodicKeyframeRequestOnContentSender = false;
        this.allowAttendeeCapabilities = false;
        // This is an extremely minimal reactive programming approach: these elements
        // will be updated when the Amazon Voice Focus display state changes.
        this.voiceFocusDisplayables = [];
        this.liveTranscriptionDisplayables = [];
        this.chosenVideoFilter = 'None';
        this.selectedVideoFilterItem = 'None';
        this.DEFAULT_VIDEO_FX_CONFIG = {
            backgroundBlur: {
                isEnabled: true,
                strength: 'high',
            },
            backgroundReplacement: {
                isEnabled: false,
                backgroundImageURL: null,
                defaultColor: 'black',
            }
        };
        this.videoFxConfig = this.DEFAULT_VIDEO_FX_CONFIG;
        this.meetingLogger = undefined;
        // If you want to make this a repeatable SPA, change this to 'spa'
        // and fix some state (e.g., video buttons).
        // Holding Shift while hitting the Leave button is handled by setting
        // this to `halt`, which allows us to stop and measure memory leaks.
        // The `nothing` option can be used to stop cleanup from happening allowing
        // `audioVideo` to be reused without stopping the meeting.
        this.behaviorAfterLeave = 'reload';
        this.videoMetricReport = {};
        this.transcriptContainerDiv = document.getElementById('transcript-container');
        this.partialTranscriptResultTimeMap = new Map();
        this.partialTranscriptResultMap = new Map();
        this.transcriptEntitySet = new Set();
        this.eventReporter = undefined;
        this.enableEventReporting = false;
        this.resetStats = () => {
            this.videoMetricReport = {};
        };
        this.transcriptEventHandler = (transcriptEvent) => {
            var _a;
            if (!this.enableLiveTranscription) {
                // Toggle disabled 'Live Transcription' button to enabled when we receive any transcript event
                this.enableLiveTranscription = true;
                this.updateLiveTranscriptionDisplayState();
                // Transcripts view and the button to show and hide it are initially hidden
                // Show them when when live transcription gets enabled, and do not hide afterwards
                this.setButtonVisibility('button-live-transcription', true, 'on');
                this.transcriptContainerDiv.style.display = 'block';
            }
            if (transcriptEvent instanceof amazon_chime_sdk_js_1.TranscriptionStatus) {
                this.appendStatusDiv(transcriptEvent);
                if (transcriptEvent.type === amazon_chime_sdk_js_1.TranscriptionStatusType.STARTED) {
                    // Determine word separator based on language code
                    let languageCode = null;
                    const transcriptionConfiguration = JSON.parse(transcriptEvent.transcriptionConfiguration);
                    if (transcriptionConfiguration) {
                        if (transcriptionConfiguration.EngineTranscribeSettings) {
                            languageCode = transcriptionConfiguration.EngineTranscribeSettings.LanguageCode;
                        }
                        else if (transcriptionConfiguration.EngineTranscribeMedicalSettings) {
                            languageCode = transcriptionConfiguration.EngineTranscribeMedicalSettings.languageCode;
                        }
                    }
                    if (languageCode && LANGUAGES_NO_WORD_SEPARATOR.has(languageCode)) {
                        this.noWordSeparatorForTranscription = true;
                    }
                }
                else if ((transcriptEvent.type === amazon_chime_sdk_js_1.TranscriptionStatusType.STOPPED ||
                    transcriptEvent.type === amazon_chime_sdk_js_1.TranscriptionStatusType.FAILED) &&
                    this.enableLiveTranscription) {
                    // When we receive a STOPPED status event:
                    // 1. toggle enabled 'Live Transcription' button to disabled
                    this.enableLiveTranscription = false;
                    this.noWordSeparatorForTranscription = false;
                    this.updateLiveTranscriptionDisplayState();
                    // 2. force finalize all partial results
                    this.partialTranscriptResultTimeMap.clear();
                    this.partialTranscriptDiv = null;
                    this.partialTranscriptResultMap.clear();
                }
            }
            else if (transcriptEvent instanceof amazon_chime_sdk_js_1.Transcript) {
                for (const result of transcriptEvent.results) {
                    const resultId = result.resultId;
                    const isPartial = result.isPartial;
                    const languageCode = result.languageCode;
                    if (languageCode && LANGUAGES_NO_WORD_SEPARATOR.has(languageCode)) {
                        this.noWordSeparatorForTranscription = true;
                    }
                    if (!isPartial) {
                        if (((_a = result.alternatives[0].entities) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                            for (const entity of result.alternatives[0].entities) {
                                //split the entity based on space
                                let contentArray = entity.content.split(' ');
                                for (const content of contentArray) {
                                    this.transcriptEntitySet.add(content);
                                }
                            }
                        }
                    }
                    this.partialTranscriptResultMap.set(resultId, result);
                    this.partialTranscriptResultTimeMap.set(resultId, result.endTimeMs);
                    this.renderPartialTranscriptResults();
                    if (isPartial) {
                        continue;
                    }
                    // Force finalizing partial results that's 5 seconds older than the latest one,
                    // to prevent local partial results from indefinitely growing
                    for (const [olderResultId, endTimeMs] of this.partialTranscriptResultTimeMap) {
                        if (olderResultId === resultId) {
                            break;
                        }
                        else if (endTimeMs < result.endTimeMs - 5000) {
                            this.partialTranscriptResultTimeMap.delete(olderResultId);
                        }
                    }
                    this.partialTranscriptResultTimeMap.delete(resultId);
                    this.transcriptEntitySet.clear();
                    if (this.partialTranscriptResultTimeMap.size === 0) {
                        // No more partial results in current batch, reset current batch
                        this.partialTranscriptDiv = null;
                        this.partialTranscriptResultMap.clear();
                    }
                }
            }
            this.transcriptContainerDiv.scrollTop = this.transcriptContainerDiv.scrollHeight;
        };
        this.renderPartialTranscriptResults = () => {
            if (this.partialTranscriptDiv) {
                // Keep updating existing partial result div
                this.updatePartialTranscriptDiv();
            }
            else {
                // All previous results were finalized. Create a new div for new results, update, then add it to DOM
                this.partialTranscriptDiv = document.createElement('div');
                this.updatePartialTranscriptDiv();
                this.transcriptContainerDiv.appendChild(this.partialTranscriptDiv);
            }
        };
        this.updatePartialTranscriptDiv = () => {
            this.partialTranscriptDiv.innerHTML = '';
            const partialTranscriptSegments = [];
            for (const result of this.partialTranscriptResultMap.values()) {
                this.populatePartialTranscriptSegmentsFromResult(partialTranscriptSegments, result);
            }
            partialTranscriptSegments.sort((a, b) => a.startTimeMs - b.startTimeMs);
            const speakerToTranscriptSpanMap = new Map();
            for (const segment of partialTranscriptSegments) {
                const newSpeakerId = segment.attendee.attendeeId;
                if (!speakerToTranscriptSpanMap.has(newSpeakerId)) {
                    this.appendNewSpeakerTranscriptDiv(segment, speakerToTranscriptSpanMap);
                }
                else {
                    const partialResultSpeakers = Array.from(speakerToTranscriptSpanMap.keys());
                    if (partialResultSpeakers.indexOf(newSpeakerId) < partialResultSpeakers.length - 1) {
                        // Not the latest speaker and we reach the end of a sentence, clear the speaker to Span mapping to break line
                        speakerToTranscriptSpanMap.delete(newSpeakerId);
                        this.appendNewSpeakerTranscriptDiv(segment, speakerToTranscriptSpanMap);
                    }
                    else {
                        const transcriptSpan = speakerToTranscriptSpanMap.get(newSpeakerId);
                        transcriptSpan.appendChild(this.createSpaceSpan());
                        transcriptSpan.appendChild(segment.contentSpan);
                    }
                }
            }
        };
        this.populatePartialTranscriptSegmentsFromResult = (segments, result) => {
            let startTimeMs = null;
            let attendee = null;
            let contentSpan;
            for (const item of result.alternatives[0].items) {
                const itemContentSpan = document.createElement('span');
                itemContentSpan.innerText = item.content;
                itemContentSpan.classList.add('transcript-content');
                // underline the word with red to show confidence level of predicted word being less than 0.3
                // for redaction, words are represented as '[Name]' and has a confidence of 0. Redacted words are only shown with highlighting.
                if (item.hasOwnProperty('confidence') &&
                    !item.content.startsWith('[') &&
                    item.confidence < 0.3) {
                    itemContentSpan.classList.add('confidence-style');
                }
                // highlight the word in green to show the predicted word is a PII/PHI entity
                if (this.transcriptEntitySet.size > 0 && this.transcriptEntitySet.has(item.content)) {
                    itemContentSpan.classList.add('entity-color');
                }
                if (!startTimeMs) {
                    contentSpan = document.createElement('span');
                    contentSpan.appendChild(itemContentSpan);
                    attendee = item.attendee;
                    startTimeMs = item.startTimeMs;
                }
                else if (item.type === amazon_chime_sdk_js_1.TranscriptItemType.PUNCTUATION) {
                    contentSpan.appendChild(itemContentSpan);
                    segments.push({
                        contentSpan,
                        attendee: attendee,
                        startTimeMs: startTimeMs,
                        endTimeMs: item.endTimeMs,
                    });
                    startTimeMs = null;
                    attendee = null;
                }
                else {
                    if (this.noWordSeparatorForTranscription) {
                        contentSpan.appendChild(itemContentSpan);
                    }
                    else {
                        contentSpan.appendChild(this.createSpaceSpan());
                        contentSpan.appendChild(itemContentSpan);
                    }
                }
            }
            // Reached end of the result but there is no closing punctuation
            if (startTimeMs) {
                segments.push({
                    contentSpan: contentSpan,
                    attendee: attendee,
                    startTimeMs: startTimeMs,
                    endTimeMs: result.endTimeMs,
                });
            }
        };
        this.appendNewSpeakerTranscriptDiv = (segment, speakerToTranscriptSpanMap) => {
            const speakerTranscriptDiv = document.createElement('div');
            speakerTranscriptDiv.classList.add('transcript');
            const speakerSpan = document.createElement('span');
            speakerSpan.classList.add('transcript-speaker');
            speakerSpan.innerText = segment.attendee.externalUserId.split('#').slice(-1)[0] + ': ';
            speakerTranscriptDiv.appendChild(speakerSpan);
            speakerTranscriptDiv.appendChild(segment.contentSpan);
            this.partialTranscriptDiv.appendChild(speakerTranscriptDiv);
            speakerToTranscriptSpanMap.set(segment.attendee.attendeeId, segment.contentSpan);
        };
        this.appendStatusDiv = (status) => {
            const statusDiv = document.createElement('div');
            statusDiv.innerText =
                '(Live Transcription ' +
                    status.type +
                    ' at ' +
                    new Date(status.eventTimeMs).toLocaleTimeString() +
                    ' in ' +
                    status.transcriptionRegion +
                    ' with configuration: ' +
                    status.transcriptionConfiguration +
                    (status.message ? ' due to "' + status.message + '".' : '') +
                    ')';
            this.transcriptContainerDiv.appendChild(statusDiv);
        };
        this.setupLiveTranscription = () => {
            var _a;
            (_a = this.audioVideo.transcriptionController) === null || _a === void 0 ? void 0 : _a.subscribeToTranscriptEvent(this.transcriptEventHandler);
        };
        this.selectedVideoInput = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        global.app = this;
        this.addFatalHandlers();
        if (document.location.search.includes('testfatal=1')) {
            this.fatal(new Error('Testing fatal.'));
            return;
        }
        document.getElementById('sdk-version').innerText =
            'amazon-chime-sdk-js@' + amazon_chime_sdk_js_1.Versioning.sdkVersion;
        this.initEventListeners();
        this.initParameters();
        this.setMediaRegion();
        if (this.isRecorder() || this.isBroadcaster()) {
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                this.meeting = new URL(window.location.href).searchParams.get('m');
                this.name = this.isRecorder() ? '«Meeting Recorder»' : '«Meeting Broadcaster»';
                yield this.authenticate();
                yield this.openAudioOutputFromSelection();
                yield this.join();
                this.displayButtonStates();
                this.switchToFlow('flow-meeting');
            }));
        }
        else {
            this.switchToFlow('flow-authenticate');
        }
    }
    addFatalHandlers() {
        exports.fatal = this.fatal.bind(this);
        const onEvent = (event) => {
            // In Safari there's only a message.
            exports.fatal(event.error || event.message);
        };
        // Listen for unhandled errors, too.
        window.addEventListener('error', onEvent);
        window.onunhandledrejection = (event) => {
            exports.fatal(event.reason);
        };
        this.removeFatalHandlers = () => {
            window.onunhandledrejection = undefined;
            window.removeEventListener('error', onEvent);
            exports.fatal = undefined;
            this.removeFatalHandlers = undefined;
        };
    }
    /**
     * We want to make it abundantly clear at development and testing time
     * when an unexpected error occurs.
     * If we're running locally, or we passed a `fatal=1` query parameter, fail hard.
     */
    fatal(e) {
        var _a;
        // Muffle mode: let the `try-catch` do its job.
        if (!SHOULD_DIE_ON_FATALS) {
            console.info('Ignoring fatal', e);
            return;
        }
        console.error('Fatal error: this was going to be caught, but should not have been thrown.', e);
        if (e && e instanceof Error) {
            document.getElementById('stack').innerText = e.message + '\n' + ((_a = e.stack) === null || _a === void 0 ? void 0 : _a.toString());
        }
        else {
            document.getElementById('stack').innerText = '' + e;
        }
        // this.switchToFlow('flow-fatal');
    }
    initParameters() {
        const meeting = new URL(window.location.href).searchParams.get('m');
        if (meeting) {
            document.getElementById('inputMeeting').value = meeting;
            document.getElementById('inputName').focus();
        }
        else {
            document.getElementById('inputMeeting').focus();
        }
    }
    initVoiceFocus() {
        return __awaiter(this, void 0, void 0, function* () {
            const logger = new amazon_chime_sdk_js_1.ConsoleLogger('SDK', amazon_chime_sdk_js_1.LogLevel.DEBUG);
            if (!this.enableWebAudio) {
                logger.info('[DEMO] Web Audio not enabled. Not checking for Amazon Voice Focus support.');
                return;
            }
            const spec = getVoiceFocusSpec(this.joinInfo);
            try {
                this.supportsVoiceFocus = yield amazon_chime_sdk_js_1.VoiceFocusDeviceTransformer.isSupported(spec, {
                    logger,
                });
                if (this.supportsVoiceFocus) {
                    this.voiceFocusTransformer = yield this.getVoiceFocusDeviceTransformer(MAX_VOICE_FOCUS_COMPLEXITY);
                    this.supportsVoiceFocus =
                        this.voiceFocusTransformer && this.voiceFocusTransformer.isSupported();
                    if (this.supportsVoiceFocus) {
                        logger.info('[DEMO] Amazon Voice Focus is supported.');
                        document.getElementById('voice-focus-setting').classList.remove('hidden');
                        return;
                    }
                }
            }
            catch (e) {
                // Fall through.
                logger.warn(`[DEMO] Does not support Amazon Voice Focus: ${e.message}`);
            }
            logger.warn('[DEMO] Does not support Amazon Voice Focus.');
            this.supportsVoiceFocus = false;
            document.getElementById('voice-focus-setting').classList.toggle('hidden', true);
        });
    }
    initBackgroundBlur() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.supportsBackgroundBlur = yield amazon_chime_sdk_js_1.BackgroundBlurVideoFrameProcessor.isSupported(this.getBackgroundBlurSpec());
            }
            catch (e) {
                this.log(`[DEMO] Does not support background blur: ${e.message}`);
                this.supportsBackgroundBlur = false;
            }
        });
    }
    /**
     * Determine if the videoFxProcessor is supported in current environment
     */
    resolveSupportsVideoFX() {
        return __awaiter(this, void 0, void 0, function* () {
            const logger = new amazon_chime_sdk_js_1.ConsoleLogger('SDK', amazon_chime_sdk_js_1.LogLevel.DEBUG);
            try {
                this.supportsVideoFx = yield amazon_chime_sdk_js_1.VideoFxProcessor.isSupported(logger);
            }
            catch (e) {
                this.log(`[DEMO] Does not support background blur/background replacement v2: ${e.message}`);
                this.supportsVideoFx = false;
            }
        });
    }
    createReplacementImageBlob(startColor, endColor) {
        return __awaiter(this, void 0, void 0, function* () {
            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 500;
            const ctx = canvas.getContext('2d');
            const grd = ctx.createLinearGradient(0, 0, 250, 0);
            grd.addColorStop(0, startColor);
            grd.addColorStop(1, endColor);
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 500, 500);
            const blob = yield new Promise(resolve => {
                canvas.toBlob(resolve);
            });
            return blob;
        });
    }
    /**
     * The image blob in this demo is created by generating an image
     * from a canvas, but another common scenario would be to provide
     * an image blob from fetching a URL.
     *   const image = await fetch('https://someimage.jpeg');
     *   const imageBlob = await image.blob();
     */
    getBackgroundReplacementOptions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.replacementOptions) {
                const imageBlob = yield this.createReplacementImageBlob('#000428', '#004e92');
                this.replacementOptions = { imageBlob };
            }
            return this.replacementOptions;
        });
    }
    initBackgroundReplacement() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.supportsBackgroundReplacement = yield amazon_chime_sdk_js_1.BackgroundReplacementVideoFrameProcessor.isSupported(this.getBackgroundBlurSpec(), yield this.getBackgroundReplacementOptions());
            }
            catch (e) {
                this.log(`[DEMO] Does not support background replacement: ${e.message}`);
                this.supportsBackgroundReplacement = false;
            }
        });
    }
    onVoiceFocusSettingChanged() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('[DEMO] Amazon Voice Focus setting toggled to', this.enableVoiceFocus);
            this.openAudioInputFromSelectionAndPreview();
        });
    }
    initEventListeners() {
        var _a, _b, _c, _d, _f, _g, _h, _j;
        const buttonJoinMeeting = document.getElementById('join-meeting');
        buttonJoinMeeting.addEventListener('click', _e => {
            var x = document.getElementById('joining-page');
            var joining_page = document.getElementById('main-page');
            if (x.style.display === 'none') {
                x.style.display = 'block';
            }
            else {
                x.style.display = 'none';
                joining_page.style.display = 'flex';
            }
        });
        // do the exact same for new-meeting button
        const buttonNewMeeting = document.getElementById('new-meeting');
        buttonNewMeeting.addEventListener('click', _e => {
            var x = document.getElementById('joining-page');
            var joining_page = document.getElementById('main-page');
            if (x.style.display === 'none') {
                x.style.display = 'block';
            }
            else {
                x.style.display = 'none';
                joining_page.style.display = 'flex';
            }
        });
        const buttonQueriesTabs = document.getElementById('queries');
        buttonQueriesTabs.addEventListener('click', _e => {
            var participants_block = document.getElementById('participants-block');
            var queries_block = document.getElementById('queries-block');
            const element = document.getElementById('queries');
            const participants = document.getElementById('participants');
            element.classList.add('activeTabs');
            participants.classList.remove('activeTabs');
            participants_block.style.display = 'none';
            queries_block.style.display = 'block';
        });
        const buttonTabs = document.getElementById('participants');
        buttonTabs.addEventListener('click', _e => {
            const queries = document.getElementById('queries');
            const element = document.getElementById('participants');
            queries.classList.remove('activeTabs');
            element.classList.add('activeTabs');
            var participants_block = document.getElementById('participants-block');
            var queries_block = document.getElementById('queries-block');
            participants_block.style.display = 'block';
            queries_block.style.display = 'none';
        });
        const buttonTranscription = document.getElementById('transcription-button');
        buttonTranscription.addEventListener('click', _e => {
            var x = document.getElementById('transcript-container');
            if (x.style.display === 'none') {
                x.style.display = 'block';
                this.toggleButton('button-live-transcription');
            }
            else {
                x.style.display = 'none';
                this.toggleButton('button-live-transcription');
            }
        });
        // SEND QUIZBOT FORM TO USERS DREW SEND
        const buttonPublishQuiz = document.getElementById('publish-quiz-button');
        buttonPublishQuiz.addEventListener('click', _e => {
            var x = document.getElementById('quiz_in_progress');
            var html_quiz_question = document.getElementById('quiz_question');
            if (x) {
                x.style.display = 'block';
                html_quiz_question.style.display = 'none';
            }
            // Fetch the stored quiz data
            const storedQuiz = JSON.parse(localStorage.getItem('quizJson') || '{}');
            // DREW ADDITIONS
            const generateFormData = (quiz) => {
                const questions = quiz.questions;
                const formData = {
                    title: quiz.quiz_title,
                    fields: [
                        { label: 'Quiz Title', type: 'text', value: quiz.quiz_title },
                        ...questions.map((question) => {
                            return {
                                label: question.question,
                                type: 'dropdown',
                                options: [question.correct_answer, ...question.wrong_answers],
                                correct_answer: question.correct_answer,
                            };
                        })
                    ],
                    host: this.meetingSession.configuration.credentials.attendeeId
                };
                return formData;
            };
            const formData = generateFormData(storedQuiz);
            console.log("Checkpoint 2 Form Data", formData);
            console.log(formData);
            // END DREW ADDITIONS
            const formDataString = JSON.stringify(formData);
            console.log('Checkpoint 3 formDataString:', formDataString);
            // Send the formData as a stringified JSON
            this.audioVideo.realtimeSendDataMessage('displayForm', formDataString, DemoMeetingApp.DATA_MESSAGE_LIFETIME_MS);
            this.dataMessageHandler(new amazon_chime_sdk_js_1.DataMessage(Date.now(), 'displayForm', new TextEncoder().encode(formDataString), this.meetingSession.configuration.credentials.attendeeId, this.meetingSession.configuration.credentials.externalUserId));
        });
        // make a function displayForm():
        // Sample data for radio buttons
        // this.dataMessageHandler(
        //   new DataMessage(
        //     Date.now(),
        //     'displayForm',
        //     new TextEncoder().encode(formDataString),
        //     this.meetingSession.configuration.credentials.attendeeId,
        //     this.meetingSession.configuration.credentials.externalUserId
        //   )
        // );
        const buttonChat = document.getElementById('button-chat');
        buttonChat === null || buttonChat === void 0 ? void 0 : buttonChat.addEventListener('click', _e => {
            const x = document.getElementById('roster-message-container');
            if (x && (x.style.display === 'none' || x.classList.contains('d-none'))) {
                x.classList.remove('d-none');
                x.classList.add('d-flex');
                x.style.display = 'block';
            }
            else {
                x === null || x === void 0 ? void 0 : x.classList.add('d-none');
                x === null || x === void 0 ? void 0 : x.classList.remove('d-flex');
                if (x) {
                    x.style.display = 'none';
                }
            }
        });
        const toggleMenuButton = document.getElementById('toggle-menu');
        toggleMenuButton === null || toggleMenuButton === void 0 ? void 0 : toggleMenuButton.addEventListener('click', _e => {
            const x = document.getElementById('toggle-icons');
            if (x && x.style.display === 'none') {
                x.style.display = 'inline-flex';
            }
            else {
                if (x) {
                    x.style.display = 'none';
                }
            }
        });
        const registerButton = document.getElementById('register');
        registerButton === null || registerButton === void 0 ? void 0 : registerButton.addEventListener('click', _e => {
            const x = document.getElementById('loginForm');
            const y = document.getElementById('register-container');
            if (x && x.style.display === 'none') {
                x.style.display = 'block';
                if (y) {
                    y.style.display = 'none';
                }
            }
            else {
                if (x) {
                    x.style.display = 'none';
                }
                if (y) {
                    y.style.display = 'block';
                }
            }
        });
        const loginButton = document.getElementById('login');
        loginButton === null || loginButton === void 0 ? void 0 : loginButton.addEventListener('click', _e => {
            const x = document.getElementById('register-container');
            const y = document.getElementById('loginForm');
            if (x && x.style.display === 'none') {
                x.style.display = 'block';
                if (y) {
                    y.style.display = 'none';
                }
            }
            else {
                if (x) {
                    x.style.display = 'none';
                }
                if (y) {
                    y.style.display = 'block';
                }
                updateBodyBackgroundColor(); // Call this at the end of both event listeners
            }
        });
        const body = document.getElementById('body');
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');
        if (loginContainer && loginContainer.style.display === 'block' || registerContainer && registerContainer.style.display === 'block') {
            if (body) {
                body.style.background = '#1e1e1e';
            }
        }
        else {
            if (body) {
                body.style.background = '#fff';
            }
        }
        function updateBodyBackgroundColor() {
            const loginContainer = document.getElementById('login-container');
            const registerContainer = document.getElementById('register-container');
            const body = document.getElementById('body');
            if ((loginContainer && loginContainer.style.display === 'block') ||
                (registerContainer && registerContainer.style.display === 'block')) {
                if (body) {
                    body.style.background = '#1e1e1e';
                }
            }
            else {
                if (body) {
                    body.style.background = '#fff';
                }
            }
        }
        // Initial call
        updateBodyBackgroundColor();
        // FAULTY CODE
        const startingQuizButton = document.getElementById('starting-quiz');
        startingQuizButton.addEventListener('click', _e => {
            var roster_tile_container = document.getElementById('roster-tile-container');
            var starting_quiz_container = document.getElementById('starting_quiz_container');
            if (starting_quiz_container.style.display === 'none') {
                starting_quiz_container.style.display = 'flex';
                // roster_tile_container.style.display = 'none !important';
                roster_tile_container.setAttribute('style', 'display:none !important');
            }
            else {
                starting_quiz_container.style.display = 'none';
            }
        });
        const buttonParticipants = document.getElementById('button-participants');
        buttonParticipants.addEventListener('click', _e => {
            console.log('button-participants');
            var x = document.getElementById('roster-message-container');
            if (x.style.display === 'none' || x.classList.contains('d-none')) {
                // add d-hidden to hide the roster
                x.classList.remove('d-none');
                x.classList.add('d-flex');
                x.style.display = 'block';
            }
            else {
                x.classList.add('d-none');
                x.classList.remove('d-flex');
                x.style.display = 'none';
            }
        });
        // *****************************
        // *****************************
        // *****************************
        // BEGIN QUIZBOT
        const submitQuizBot = document.getElementById('submit-quiz');
        submitQuizBot.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            // STEP 1: CONFIGURATION FORM
            const create_quiz = document.getElementById('create-quiz');
            var generating_quiz = document.getElementById('generating-quiz');
            var html_quiz_question = document.getElementById('quiz_question');
            if (generating_quiz) {
                create_quiz.style.display = 'none';
                generating_quiz.style.display = 'block';
            }
            console.log('submit quiz');
            const transcript = document.getElementById('transcript-container').innerText;
            const transcriptData = {
                "transcript": transcript
                // "transcript" : "This is a test transcript, I want to see if this works. There are 5 questions in this quiz. This quiz was made on October 11th 2023. We will be quizzing on this content."
            };
            let selectedNumber = localStorage.getItem('selectedNumber');
            if (selectedNumber) {
                transcriptData.num_questions = selectedNumber;
                console.log('selectedNumber:', selectedNumber);
            }
            let vectorID = localStorage.getItem('vectorID');
            if (vectorID) {
                transcriptData.vector_id = vectorID;
                console.log('vector_id:', vectorID);
            }
            const url = "https://app.larq.ai/api/MakeQuiz";
            console.log("TRANSCRIPT DATA:", transcriptData);
            const response = yield fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transcriptData)
            });
            // on response, show #html_quiz_question:
            const quizJson = yield response.json();
            html_quiz_question.style.display = 'block';
            generating_quiz.style.display = 'none';
            // BELOW IS THE STRUCTURE OF THE QUIZ RESPONSE
            // const quizJson = {
            //     quiz_title: 'History 101',
            //     questions: [
            //       {
            //         answer_reason: 'The Magna Carta was sealed by King John in the year 1215.',
            //         correct_answer: '1215',
            //         question: 'In which year was the Magna Carta sealed?',
            //         question_number: 1,
            //         wrong_answers: ['1200', '1230', '1150'],
            //       },
            //       {
            //         answer_reason:
            //           'The primary aim of the Renaissance was the revival of classical learning and wisdom.',
            //         correct_answer: 'Revival of classical learning',
            //         question: 'What was the primary aim of the Renaissance?',
            //         question_number: 2,
            //         wrong_answers: [
            //           'Promotion of modern art',
            //           'Start of the industrial revolution',
            //           'Promotion of religious beliefs',
            //         ],
            //       },
            //       {
            //         answer_reason:
            //           'Galileo Galilei was known for his contributions to the fields of physics, astronomy, and modern science.',
            //         correct_answer: 'Galileo Galilei',
            //         question: 'Who is known as the father of observational astronomy?',
            //         question_number: 3,
            //         wrong_answers: ['Isaac Newton', 'Albert Einstein', 'Nikola Tesla'],
            //       },
            //     ]
            // };
            console.log('quizJson:', quizJson);
            // add quizJson to the local storage
            localStorage.setItem('quizJson', JSON.stringify(quizJson));
            const quizTitle = quizJson.quiz_title;
            console.log(quizTitle);
            const quizTitleHTML = document.getElementById('quiz-title');
            quizTitleHTML.innerText = quizTitle;
            const quizFormTitleHTML = document.getElementById('quiz-form-title');
            quizFormTitleHTML.innerText = quizTitle;
            const questions = quizJson.questions;
            console.log(questions);
            const quizNumbers = document.getElementById('quiz-numbers');
            // clear html of quizNumbers
            quizNumbers.innerHTML = '';
            const quizQuestionElement = document.getElementById('quiz-question');
            const quizOptions = document.getElementById('quiz-options');
            // Populate quiz numbers
            questions.forEach((question, index) => {
                let questionNumber = question.question_number;
                let questionBlock = document.createElement('div');
                questionBlock.className = 'numbers-block';
                questionBlock.innerText = `${questionNumber}`;
                quizNumbers.appendChild(questionBlock);
                // Attach a click event to each questionBlock
                questionBlock.addEventListener('click', function () {
                    // Display the selected question and its options
                    console.log('questionNumber', questionNumber);
                    const currentActive = document.querySelector('.numbers-block.active-numbers-block');
                    if (currentActive) {
                        currentActive.classList.remove('active-numbers-block');
                    }
                    questionBlock.classList.add('active-numbers-block');
                    quizQuestionElement.innerText = question.question;
                    quizOptions.innerHTML = ''; // Clear previous options
                    let correctAnswer = question.correct_answer;
                    let wrongAnswers = question.wrong_answers;
                    let allAnswers = [correctAnswer, ...wrongAnswers]; // No randomization
                    allAnswers.forEach((answer, ansIndex) => {
                        let optionLabel = document.createElement('label');
                        optionLabel.className = 'form-check form-check-inline';
                        let optionInput = document.createElement('input');
                        optionInput.type = 'radio';
                        optionInput.id = `option-${index}-${ansIndex}`;
                        optionInput.name = 'option';
                        optionInput.value = `${ansIndex}`;
                        optionInput.className = 'btn-check form-check-input';
                        // DRAFT ANSWERS (FOR REFERENCE)
                        if (answer === correctAnswer) {
                            // Check the correct answer
                            optionInput.checked = true;
                            optionLabel.classList.add('correct-answer');
                        }
                        else {
                            optionLabel.classList.remove('correct-answer');
                        }
                        let answerselectorLabel = document.createElement('label');
                        answerselectorLabel.className = 'btn btn-outline-primary';
                        answerselectorLabel.htmlFor = optionInput.id;
                        answerselectorLabel.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12L9 16L19 6" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                        let answerLabel = document.createElement('input');
                        answerLabel.className = 'form-control answer-text';
                        // answerLabel.htmlFor = optionInput.id;
                        answerLabel.value = answer;
                        optionLabel.appendChild(optionInput);
                        optionLabel.appendChild(answerselectorLabel);
                        optionLabel.appendChild(answerLabel);
                        quizOptions.appendChild(optionLabel);
                        quizQuestionElement.addEventListener('click', function () {
                            this.contentEditable = 'true';
                            // click on the object again now that its editable
                            this.focus();
                            const originalText = this.textContent;
                            this.addEventListener('blur', function () {
                                var _a;
                                const newText = ((_a = this.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                                this.contentEditable = 'false';
                                if (newText !== originalText) {
                                    question.question = newText;
                                    localStorage.setItem('quizJson', JSON.stringify(quizJson));
                                    console.log('quizJson in localstorage:', quizJson);
                                }
                            }, { once: true });
                            // End of questionElement.addEventListener
                        });
                        quizTitleHTML.addEventListener('click', function () {
                            this.contentEditable = 'true';
                            this.focus();
                            const originalText = this.textContent;
                            this.addEventListener('blur', function () {
                                var _a;
                                const newText = ((_a = this.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                                this.contentEditable = 'false';
                                if (newText !== originalText) {
                                    // Assuming you have a title field in your quizJson.
                                    quizJson.quiz_title = newText;
                                    localStorage.setItem('quizJson', JSON.stringify(quizJson));
                                    console.log('quizJson in localstorage:', quizJson);
                                }
                            }, { once: true });
                        });
                        optionLabel.addEventListener('click', () => {
                            answerLabel.contentEditable = 'true';
                            optionLabel.classList.add('editing');
                            // optionLabel.classList.add('form-control');
                            this.focus();
                            const originalText = answerLabel.value;
                            answerLabel.addEventListener('blur', () => {
                                var _a;
                                const newText = ((_a = answerLabel.value) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                                answerLabel.contentEditable = 'false';
                                optionLabel.classList.remove('editing');
                                // optionLabel.classList.remove('form-control');
                                if (newText === '') {
                                    answerLabel.value = answer;
                                }
                                if (newText !== originalText) {
                                    // Update the answer label in the DOM
                                    answerLabel.value = newText;
                                }
                                if (optionInput.checked) {
                                    // If this option is checked, update the correct answer
                                    question.correct_answer = newText;
                                }
                                else {
                                    // Update a wrong answer
                                    question.wrong_answers[ansIndex - 1] = newText;
                                }
                                localStorage.setItem('quizJson', JSON.stringify(quizJson));
                                console.log('quizJson in localstorage:', quizJson);
                            }, { once: true }); // Ensure the blur event only fires once per editing session
                            // if there has been a click that is not the option label, then remove the editing class
                            document.addEventListener('click', (event) => {
                                const target = event.target;
                                if (!target.classList.contains('editing')) {
                                    optionLabel.classList.remove('editing');
                                    // optionLabel.classList.remove('form-control');
                                }
                            });
                            optionInput.addEventListener('change', () => {
                                if (optionInput.checked) {
                                    optionLabel.classList.add('correct-answer');
                                    // remove the correct-answer class from all other options
                                    const allOptionLabels = document.querySelectorAll('.form-check.form-check-inline');
                                    allOptionLabels.forEach((label) => {
                                        if (label !== optionLabel) {
                                            label.classList.remove('correct-answer');
                                        }
                                    });
                                    // Update the correct answer.
                                    question.correct_answer = answerLabel.innerText;
                                    localStorage.setItem('quizJson', JSON.stringify(quizJson));
                                    console.log('quizJson in localstorage:', quizJson);
                                }
                            });
                            // End of optionLabel.addEventListener 
                        });
                        // End of allAnswers.forEach
                    });
                    // End of Click form
                });
                if (index === 0) {
                    questionBlock.click();
                }
                // End of questions.forEach
            });
            // Promise and quizbot
        }));
        // DREW CODE END
        // document.addEventListener('DOMContentLoaded', function() {
        // Get the form element
        console.log("Dom loaded");
        const myDIV = document.getElementById('myDIV');
        const video_container = document.getElementById('content-share-video');
        const starting_quiz_container = document.getElementById('starting_quiz_container');
        const meeting_container = document.getElementById('meeting-container');
        // Function to close the form (hide it in this case)
        function closeForm() {
            if (myDIV) {
                meeting_container.style.display = 'block';
                video_container.style.display = 'block',
                    myDIV.style.display = 'none';
            }
            if (starting_quiz_container) {
                meeting_container.style.display = 'block';
                video_container.style.display = 'block',
                    starting_quiz_container.style.display = 'none';
            }
        }
        // Listen to clicks on elements with class .btn-close and .cancel-button
        document.querySelectorAll('.cancel-button').forEach(button => {
            button.addEventListener('click', closeForm);
        });
        document.querySelectorAll('.deleteButton').forEach(button => {
            button.addEventListener('click', function () {
                var html_create_quiz = document.getElementById('create-quiz');
                var html_quiz_question = document.getElementById('quiz_question');
                var generating_quiz = document.getElementById('generating-quiz');
                html_create_quiz.style.display = 'block';
                html_quiz_question.style.display = 'none';
                generating_quiz.style.display = 'none';
            });
        });
        // Set a function for clicking #quiz-button to toggle #myDIV:
        const x = document.getElementById('myDIV');
        const quizButton = document.getElementById('quiz-button');
        quizButton === null || quizButton === void 0 ? void 0 : quizButton.addEventListener('click', function () {
            // this.toggleButton('quiz-button');
            if (x) {
                const create_quiz = document.getElementById('create-quiz');
                console.log('button-quizbot');
                const quiz_question = document.getElementById('quiz_question');
                const quiz_in_progress = document.getElementById('quiz_in_progress');
                const transcript_container = document.getElementById('tile-transcript-container');
                if (x && x.style.display === 'none') {
                    x.style.display = 'block';
                    if (transcript_container) {
                        transcript_container.style.width = '100%';
                    }
                }
                else {
                    if (create_quiz) {
                        create_quiz.style.display = 'block';
                    }
                    if (x) {
                        x.style.display = 'none';
                    }
                    if (quiz_question) {
                        quiz_question.style.display = 'none';
                    }
                    if (quiz_in_progress) {
                        quiz_in_progress.style.display = 'none';
                    }
                    if (transcript_container) {
                        transcript_container.style.width = '100%';
                    }
                }
            }
        });
        // FIRST FORM NUMBER OF QUESTIONS
        let selectedNumber = null;
        const numberContainer = document.getElementById('numberofQuestions');
        if (numberContainer) {
            numberContainer.addEventListener('click', (event) => {
                const target = event.target;
                if (target.classList.contains('numbers-block')) {
                    // Remove active-numbers-block class from all children
                    Array.from(numberContainer.children).forEach(child => {
                        child.classList.remove('active-numbers-block');
                    });
                    selectedNumber = target.getAttribute('value');
                    // console.log('selectedNumber:', selectedNumber);
                    // add active-numbers-block class
                    target.classList.add('active-numbers-block');
                    // save it to localstorage
                    localStorage.setItem('selectedNumber', selectedNumber);
                }
            });
        }
        // });
        // END QUIZBOT
        // *****************************
        // *****************************
        // *****************************
        // load the js file quizbot.js
        // when you click #joinButton, also click #button-start-transcription:
        const joinButton = document.getElementById('joinButton');
        joinButton === null || joinButton === void 0 ? void 0 : joinButton.addEventListener('click', function () {
            var startTranscription = document.getElementById('button-start-transcription');
            if (startTranscription) {
                startTranscription.click();
            }
        });
        var tc = document.getElementById('transcript-container');
        if (tc) {
            tc.style.display = 'block';
            this.toggleButton('button-live-transcription');
        }
        // DREW LOGIN
        // if you have localStorage.getItem('authToken') then hide the login form and show the joining page:
        if (localStorage.getItem('authToken')) {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('joining-page').style.display = 'block';
            //   // Update elements with class name "first_name" to display the first_name returned
            const firstNameElements = document.querySelectorAll('.first_name');
            firstNameElements.forEach(element => {
                element.textContent = localStorage.getItem('firstName');
            });
        }
        else {
            document.getElementById('login-container').style.display = 'block';
            document.getElementById('joining-page').style.display = 'none';
            document.getElementById('flow-meeting').style.display = 'none';
        }
        (_a = document.querySelector('#loginForm')) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', (event) => {
            event.preventDefault();
            document.getElementById('incorrect-pass').style.display = 'none';
            const loginSpinner = document.getElementById('login-spinner');
            loginSpinner.style.display = 'block';
            const targetForm = event.target;
            const username = targetForm.username.value;
            const password = targetForm.password.value;
            // Convert username and password to base64
            const base64Credentials = btoa(username + ':' + password);
            fetch("https://app.larq.ai/api/login", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + base64Credentials // Set the Authorization header
                }
            }).then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Server responded with status ${response.status}: ${text}`);
                    });
                }
                return response.json();
            }).then((data) => {
                if (data.status === 'success') {
                    console.log('Success:', data);
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('firstName', data.first_name);
                    localStorage.setItem('lastName', data.last_name);
                    localStorage.setItem('userId', data.user_id);
                    localStorage.setItem('data', JSON.stringify(data));
                    // hide #login-spinner
                    document.getElementById('login-spinner').style.display = 'none';
                    // reload page
                    location.reload();
                    // document.getElementById('login-container')!.style.display = 'none';
                    // document.getElementById('joining-page')!.style.display = 'block';
                    // Console log user_id and last_name
                    console.log("User ID:", data.user_id);
                    console.log("Last Name:", data.last_name);
                    // console.log("Dashboard Stats:", data.dashboard_stats);
                }
                else {
                    alert(data.message);
                }
                loginSpinner.style.display = 'none';
            })
                .catch(error => {
                loginSpinner.style.display = 'none';
                // show #incorrect-pass element 
                document.getElementById('incorrect-pass').style.display = 'block';
                console.error('Error:', error);
            });
        });
        { /* if #scheduleMeeting is clicked make modal popup with a date/time scheduler*/ }
        (_b = document.querySelector('#scheduleMeeting')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
            document.getElementById('scheduleMeetingModal').style.display = 'block';
        });
        (_c = document.querySelector('#scheduleMeetingSubmit')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
            const meetingScheduleTime = document.getElementById('meetingScheduleTime').value;
            const meetingScheduleDate = document.getElementById('meetingScheduleDate').value;
            if (!meetingScheduleTime || !meetingScheduleDate) {
                alert('Please ensure both date and time are selected.');
                return; // exit the function if inputs are missing
            }
            const meetingScheduleDateTime = meetingScheduleDate + " " + meetingScheduleTime;
            console.log(meetingScheduleDateTime);
            fetch("https://app.larq.ai/api/scheduleMeeting", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    meetingScheduleDateTime: meetingScheduleDateTime
                })
            })
                .then(response => response.json())
                .then(data => {
                if (data.status === 'success') {
                    alert(data.message);
                    document.getElementById('scheduleMeetingModal').style.display = 'none';
                }
                else {
                    alert(data.message);
                }
            })
                .catch(error => {
                alert('Error occurred: ' + error.message);
                console.error('Error:', error);
            });
        });
        // Drew take 2
        // Retrieve data from localStorage
        const data = JSON.parse(localStorage.getItem('data')).dashboard_stats;
        const emptyDash = document.getElementById('empty-dash');
        const fullDash = document.getElementById('full-dash');
        // Check if data exists and has recent_quizzes
        if (data && data.recent_quizzes && data.recent_quizzes.length > 0) {
            if (emptyDash && fullDash) {
                fullDash.style.display = 'block';
                emptyDash.style.display = 'none';
            }
            // Populate the dashboard with real data
            // Calculate the Class Average
            const average = data.last_attempts.reduce((acc, curr) => acc + curr.score, 0) / data.last_attempts.length;
            document.getElementById('classAverage').textContent = average.toFixed(2);
            // Assuming the most difficult question is the one most frequently answered incorrectly
            // This is just a placeholder, you'll need to replace with actual logic
            document.getElementById('mostDifficultQuestion').innerHTML = '<p>Sample Difficult Question</p>';
            // Find the top performer and the one needing attention
            const sortedAttempts = [...data.last_attempts].sort((a, b) => b.score - a.score);
            const topPerformer = sortedAttempts[0];
            const needsAttention = sortedAttempts[sortedAttempts.length - 1];
            document.getElementById('topPerformer').innerHTML = `<p>${topPerformer.user_id} <span>${(topPerformer.score * 100).toFixed(0)}%</span></p>`;
            document.getElementById('needsAttention').innerHTML = `<p>${needsAttention.user_id} <span>${(needsAttention.score * 100).toFixed(0)}%</span></p>`;
            // You can continue populating other sections similarly...
        }
        else {
            // Hide the detailed dashboard and show the "no quizzes" message
            if (emptyDash && fullDash) {
                fullDash.style.display = 'none';
                emptyDash.style.display = 'block';
            }
        }
        // UPCOMING CLASSES ON LEFT OF DASH
        const upcomingClassesContainer = document.getElementById('upcomingClasses');
        // Clear any existing listings (you might want to keep headers or static content)
        upcomingClassesContainer.innerHTML = '<p>Upcoming Classes</p>';
        // Check if data exists and has next_meetings
        if (data && data.next_meetings && data.next_meetings.length > 0) {
            data.next_meetings.forEach((meeting) => {
                // Convert the timestamp string to a Date object
                const meetingDate = new Date(meeting.timestamp);
                const today = new Date();
                let dateString;
                if (meetingDate.toDateString() === today.toDateString()) {
                    dateString = `${meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, Today`;
                }
                else {
                    dateString = `${meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${meetingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
                }
                // Construct the listing block for this meeting
                const meetingBlock = document.createElement('div');
                meetingBlock.classList.add('listingBlock', 'mt-3', 'mb-3');
                meetingBlock.innerHTML = `
                  <div class="d-flex justify-content-between align-items-center meeting-calendar-item">
                      <div>
                          <h5>${meeting.host_id}</h5>  <!-- Adjust this if you have a more appropriate title for the meeting -->
                          <p>${dateString}</p>
                      </div>
                      <a href="?m=${meeting.host_id}">(Start the Meeting)</a>
                  </div>
              `;
                upcomingClassesContainer.appendChild(meetingBlock);
            });
        }
        else {
            const meetingBlock = document.createElement('div');
            meetingBlock.classList.add('listingBlock', 'mt-3', 'mb-3');
            meetingBlock.innerHTML = `
            <div class="d-flex justify-content-between align-items-center meeting-calendar-item">
                <div>
                    <h5>No Meetings Yet</h5> 
                    <p>Schedule and make a meeting to begin.</p>
                </div>
            </div>
        `;
            upcomingClassesContainer.appendChild(meetingBlock);
            // Handle the case where there are no upcoming meetings, if needed
        }
        // Drew take 2 end
        this.enableLiveTranscription = false;
        this.noWordSeparatorForTranscription = false;
        this.updateLiveTranscriptionDisplayState();
        const token = localStorage.getItem('authToken');
        if (token) {
            const data = JSON.parse(localStorage.getItem('data') || '{}').dashboard_stats;
            if (data) {
                const firstName = data.first_name;
                const lastName = data.last_name;
                // Populate first name and last name
                document.getElementById('greetingFirstName').textContent = firstName;
                document.getElementById('dropdownFirstName').textContent = firstName;
                document.getElementById('dropdownLastName').textContent = lastName;
                // If you have a list of students for "Completed" and "Did not complete", you'd loop through the data and create elements dynamically
            }
        }
        else {
            document.getElementById('login-container').style.display = 'block';
            document.getElementById('joining-page').style.display = 'none';
        }
        function logout() {
            localStorage.removeItem('authToken');
            location.reload();
        }
        // if user clicks .logout button class, call logout function
        (_d = document.querySelector('.logout')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', logout);
        // if #join-view-only is clicked add "viewonly" to authToken, show #main-page and hide #login-container:
        (_f = document.querySelector('#join-view-only')) === null || _f === void 0 ? void 0 : _f.addEventListener('click', () => {
            localStorage.setItem('authToken', 'viewonly');
            this.isViewOnly = true;
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('main-page').style.display = 'block';
        });
        // END DREW LOGIN
        // DREW REGISTRATION
        (_g = document.querySelector('#registerForm')) === null || _g === void 0 ? void 0 : _g.addEventListener('submit', (event) => {
            event.preventDefault();
            const loginSpinner = document.getElementById('login-spinner');
            loginSpinner.style.display = 'block';
            const targetForm = event.target;
            const username = targetForm.username.value;
            const password = targetForm.password.value;
            const email = targetForm.email.value;
            const firstName = targetForm.first_name.value; // Retrieve first name
            const lastName = targetForm.last_name.value; // Retrieve last name
            fetch("https://app.larq.ai/api/register", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    email: email,
                    first_name: firstName,
                    last_name: lastName // Include last name in the request body
                })
            })
                .then(response => response.json())
                .then(data => {
                if (data.status === 'success') {
                    loginSpinner.style.display = 'none';
                    alert(data.message);
                    document.getElementById('login-container').style.display = 'none';
                    document.getElementById('joining-page').style.display = 'block';
                    localStorage.setItem('firstName', data.first_name);
                    localStorage.setItem('lastName', data.last_name);
                    localStorage.setItem('email', data.email);
                    // reload page
                    location.reload();
                }
                else {
                    alert(data.message);
                }
            })
                .catch(error => {
                loginSpinner.style.display = 'none';
                alert('Error occurred: ' + error.message);
                console.error('Error:', error);
            });
        });
        { /* VECTOR BUTTONS */ }
        function uploadPDF(pdfFile, userId) {
            return __awaiter(this, void 0, void 0, function* () {
                const formData = new FormData();
                formData.append('pdf', pdfFile);
                formData.append('user_id', userId);
                try {
                    const response = yield fetch('https://app.larq.ai/api/vectorize', {
                        method: 'POST',
                        body: formData,
                    });
                    const result = yield response.json();
                    // Update the button text with the store_name from the response
                    if (result.status === "success" && result.store_name) {
                        const uploadBtn = document.getElementById('uploadBtn');
                        const storeName = document.getElementById('store-name');
                        if (uploadBtn) {
                            uploadBtn.textContent = result.store_name;
                            uploadBtn.classList.add('btn btn-outline-success');
                            storeName.innerText = result.store_name;
                        }
                        localStorage.setItem('storeName', result.store_name);
                        localStorage.setItem('vectorID', result.vector);
                    }
                    return result;
                }
                catch (error) {
                    console.error("Error uploading PDF:", error);
                    throw error;
                }
            });
        }
        // Add event listener to the upload button
        (_h = document.getElementById('uploadBtn')) === null || _h === void 0 ? void 0 : _h.addEventListener('click', () => {
            const pdfFile = document.querySelector('#pdfInput').files[0];
            const userId = localStorage.getItem('userId');
            const uploadBtn = document.getElementById('uploadBtn');
            if (pdfFile && userId) {
                uploadPDF(pdfFile, userId)
                    .then(response => {
                    console.log(response);
                    uploadBtn.classList.add('btn-success');
                })
                    .catch(error => {
                    console.error(error);
                });
            }
            else {
                console.warn("Please select a PDF file first. userId:", userId);
                // make button glow and under it put the error:
                const pdfalert = document.getElementById('pdf-alert');
                uploadBtn === null || uploadBtn === void 0 ? void 0 : uploadBtn.classList.add('btn-danger');
                uploadBtn === null || uploadBtn === void 0 ? void 0 : uploadBtn.classList.add('btn');
                uploadBtn === null || uploadBtn === void 0 ? void 0 : uploadBtn.classList.add('text-white');
                pdfalert === null || pdfalert === void 0 ? void 0 : pdfalert.classList.remove('d-none');
            }
        });
        // add a listener for #end-quiz-button that when clicked will set #quiz_in_progress to display none and #create-quiz to display block
        (_j = document.querySelector('#end-quiz-button')) === null || _j === void 0 ? void 0 : _j.addEventListener('click', () => {
            const quiz_in_progress = document.getElementById('quiz_in_progress');
            const create_quiz = document.getElementById('create-quiz');
            if (quiz_in_progress && create_quiz) {
                quiz_in_progress.style.display = 'none';
                create_quiz.style.display = 'block';
            }
        });
        // END QUIZBOT
        // *****************************
        // *****************************
        document.getElementById('join-muted').addEventListener('change', e => {
            this.joinMuted = e.target.checked;
            if (this.joinMuted) {
                this.buttonStates['button-microphone'] = 'off';
            }
            else {
                this.buttonStates['button-microphone'] = 'on';
            }
        });
        if (this.defaultBrowserBehavior.hasFirefoxWebRTC()) {
            // Firefox currently does not support audio redundancy through insertable streams or
            // script transform so disable the redundancy checkbox
            document.getElementById('disable-audio-redundancy').disabled = true;
            document.getElementById('disable-audio-redundancy-checkbox').style.display = 'none';
        }
        if (!this.defaultBrowserBehavior.hasChromiumWebRTC()) {
            document.getElementById('simulcast').disabled = true;
            document.getElementById('content-simulcast-config').style.display = 'none';
        }
        document.getElementById('join-view-only').addEventListener('change', () => {
            this.isViewOnly = document.getElementById('join-view-only').checked;
        });
        document.getElementById('priority-downlink-policy').addEventListener('change', e => {
            this.usePriorityBasedDownlinkPolicy = document.getElementById('priority-downlink-policy').checked;
            const serverSideNetworkAdaption = document.getElementById('server-side-network-adaption');
            const paginationPageSize = document.getElementById('pagination-page-size');
            const paginationTitle = document.getElementById('pagination-title');
            const serverSideNetworkAdaptionTitle = document.getElementById('server-side-network-adaption-title');
            if (this.usePriorityBasedDownlinkPolicy) {
                serverSideNetworkAdaption.style.display = 'block';
                paginationPageSize.style.display = 'block';
                paginationTitle.style.display = 'block';
                serverSideNetworkAdaptionTitle.style.display = 'block';
            }
            else {
                serverSideNetworkAdaption.style.display = 'none';
                paginationTitle.style.display = 'none';
                paginationPageSize.style.display = 'none';
                serverSideNetworkAdaptionTitle.style.display = 'none';
            }
        });
        const echoReductionCheckbox = document.getElementById('echo-reduction-checkbox');
        document.getElementById('webaudio').addEventListener('change', e => {
            this.enableWebAudio = document.getElementById('webaudio').checked;
            if (this.enableWebAudio) {
                echoReductionCheckbox.style.display = 'block';
            }
            else {
                echoReductionCheckbox.style.display = 'none';
            }
        });
        const replicaMeetingInput = document.getElementById('replica-meeting-input');
        replicaMeetingInput.addEventListener('change', (_e) => __awaiter(this, void 0, void 0, function* () {
            document.getElementById('primary-meeting-external-id').value = "";
        }));
        document.getElementById('quick-join').addEventListener('click', e => {
            e.preventDefault();
            this.redirectFromAuthentication(true);
        });
        document.getElementById('form-authenticate').addEventListener('submit', e => {
            e.preventDefault();
            this.redirectFromAuthentication();
        });
        const earlyConnectCheckbox = document.getElementById('preconnect');
        earlyConnectCheckbox.checked = SHOULD_EARLY_CONNECT;
        earlyConnectCheckbox.onchange = () => {
            SHOULD_EARLY_CONNECT = !!earlyConnectCheckbox.checked;
        };
        const dieCheckbox = document.getElementById('die');
        dieCheckbox.checked = SHOULD_DIE_ON_FATALS;
        dieCheckbox.onchange = () => {
            SHOULD_DIE_ON_FATALS = !!dieCheckbox.checked;
        };
        const speechMonoCheckbox = document.getElementById('fullband-speech-mono-quality');
        const musicMonoCheckbox = document.getElementById('fullband-music-mono-quality');
        const musicStereoCheckbox = document.getElementById('fullband-music-stereo-quality');
        speechMonoCheckbox.addEventListener('change', _e => {
            if (speechMonoCheckbox.checked) {
                musicMonoCheckbox.checked = false;
                musicStereoCheckbox.checked = false;
            }
        });
        musicMonoCheckbox.addEventListener('change', _e => {
            if (musicMonoCheckbox.checked) {
                speechMonoCheckbox.checked = false;
                musicStereoCheckbox.checked = false;
            }
        });
        musicStereoCheckbox.addEventListener('change', _e => {
            if (musicStereoCheckbox.checked) {
                speechMonoCheckbox.checked = false;
                musicMonoCheckbox.checked = false;
                this.usingStereoMusicAudioProfile = true;
            }
            else {
                this.usingStereoMusicAudioProfile = false;
            }
        });
        document.getElementById('to-sip-flow').addEventListener('click', e => {
            e.preventDefault();
            this.switchToFlow('flow-sip-authenticate');
        });
        document.getElementById('form-sip-authenticate').addEventListener('submit', e => {
            e.preventDefault();
            this.meeting = document.getElementById('sip-inputMeeting').value;
            this.voiceConnectorId = document.getElementById('voiceConnectorId').value;
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                this.showProgress('progress-authenticate');
                const region = this.region || 'us-east-1';
                try {
                    const response = yield fetch(`${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(this.meeting)}&name=${encodeURIComponent(DemoMeetingApp.DID)}&region=${encodeURIComponent(region)}`, {
                        method: 'POST',
                    });
                    const json = yield response.json();
                    const joinToken = json.JoinInfo.Attendee.Attendee.JoinToken;
                    this.sipURI = `sip:${DemoMeetingApp.DID}@${this.voiceConnectorId};transport=tls;X-joinToken=${joinToken}`;
                    this.switchToFlow('flow-sip-uri');
                }
                catch (error) {
                    document.getElementById('failed-meeting').innerText = `Meeting ID: ${this.meeting}`;
                    document.getElementById('failed-meeting-error').innerText =
                        error.message;
                    this.switchToFlow('flow-failed-meeting');
                    return;
                }
                const sipUriElement = document.getElementById('sip-uri');
                sipUriElement.value = this.sipURI;
                this.hideProgress('progress-authenticate');
            }));
        });
        if (!this.areVideoFiltersSupported()) {
            document.getElementById('video-input-filter-container').style.display = 'none';
        }
        let videoInputFilter = document.getElementById('video-input-filter');
        videoInputFilter.addEventListener('change', () => __awaiter(this, void 0, void 0, function* () {
            this.selectedVideoFilterItem = videoInputFilter.value;
            this.log(`Clicking video filter: ${this.selectedVideoFilterItem}`);
            yield this.openVideoInputFromSelection(this.selectedVideoInput, true);
        }));
        document.getElementById('copy-sip-uri').addEventListener('click', () => {
            const sipUriElement = document.getElementById('sip-uri');
            sipUriElement.select();
            document.execCommand('copy');
        });
        const audioInput = document.getElementById('audio-input');
        audioInput.addEventListener('change', (_ev) => __awaiter(this, void 0, void 0, function* () {
            this.log('audio input device is changed');
            yield this.openAudioInputFromSelectionAndPreview();
        }));
        const videoInput = document.getElementById('video-input');
        videoInput.addEventListener('change', (_ev) => __awaiter(this, void 0, void 0, function* () {
            this.log('video input device is changed');
            try {
                yield this.openVideoInputFromSelection(videoInput.value, true);
            }
            catch (err) {
                exports.fatal(err);
            }
        }));
        const videoInputQuality = document.getElementById('video-input-quality');
        videoInputQuality.addEventListener('change', (_ev) => __awaiter(this, void 0, void 0, function* () {
            this.log('Video input quality is changed');
            switch (videoInputQuality.value) {
                case '360p':
                    this.audioVideo.chooseVideoInputQuality(640, 360, 15);
                    this.audioVideo.setVideoMaxBandwidthKbps(600);
                    break;
                case '540p':
                    this.audioVideo.chooseVideoInputQuality(960, 540, 15);
                    this.audioVideo.setVideoMaxBandwidthKbps(1400);
                    break;
                case '720p':
                    this.audioVideo.chooseVideoInputQuality(1280, 720, 15);
                    this.audioVideo.setVideoMaxBandwidthKbps(1500);
                    break;
            }
            try {
                if (this.chosenVideoTransformDevice) {
                    yield this.chosenVideoTransformDevice.stop();
                    this.chosenVideoTransformDevice = null;
                }
                yield this.openVideoInputFromSelection(videoInput.value, true);
            }
            catch (err) {
                exports.fatal(err);
            }
        }));
        const audioOutput = document.getElementById('audio-output');
        audioOutput.addEventListener('change', (_ev) => __awaiter(this, void 0, void 0, function* () {
            this.log('audio output device is changed');
            yield this.openAudioOutputFromSelection();
        }));
        document.getElementById('button-test-sound').addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const audioOutput = document.getElementById('audio-output');
            const testSound = new TestSound_1.default(this.meetingEventPOSTLogger, audioOutput.value);
            yield testSound.init();
        }));
        document.getElementById('form-devices').addEventListener('submit', e => {
            e.preventDefault();
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    this.showProgress('progress-join');
                    yield this.stopAudioPreview();
                    yield this.openVideoInputFromSelection(null, true);
                    // stopVideoProcessor should be called before join; it ensures that state variables and video processor stream are cleaned / removed before joining the meeting.
                    // If stopVideoProcessor is not called then the state from preview screen will be carried into the in meeting experience and it will cause undesired side effects.
                    yield this.stopVideoProcessor();
                    yield this.join();
                    this.hideProgress('progress-join');
                    this.displayButtonStates();
                    this.switchToFlow('flow-meeting');
                }
                catch (error) {
                    document.getElementById('failed-join').innerText = `Meeting ID: ${this.meeting}`;
                    document.getElementById('failed-join-error').innerText = `Error: ${error.message}`;
                }
            }));
        });
        document.getElementById('add-voice-focus').addEventListener('change', e => {
            this.enableVoiceFocus = e.target.checked;
            this.onVoiceFocusSettingChanged();
        });
        const buttonMute = document.getElementById('button-microphone');
        buttonMute.addEventListener('click', _e => {
            this.toggleButton('button-microphone');
            if (this.isButtonOn('button-microphone')) {
                this.audioVideo.realtimeUnmuteLocalAudio();
            }
            else {
                this.audioVideo.realtimeMuteLocalAudio();
            }
        });
        const buttonCloudCapture = document.getElementById('button-record-cloud');
        buttonCloudCapture.addEventListener('click', _e => {
            this.toggleButton('button-record-cloud');
            this.updateButtonVideoRecordingDrop();
            if (this.isButtonOn('button-record-cloud')) {
                amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                    buttonCloudCapture.disabled = true;
                    yield this.startMediaCapture();
                    buttonCloudCapture.disabled = false;
                }));
            }
            else {
                amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                    buttonCloudCapture.disabled = true;
                    yield this.stopMediaCapture();
                    buttonCloudCapture.disabled = false;
                }));
            }
        });
        const buttonLiveConnector = document.getElementById('button-live-connector');
        buttonLiveConnector.addEventListener('click', _e => {
            this.toggleButton('button-live-connector');
            this.updateButtonVideoRecordingDrop();
            if (this.isButtonOn('button-live-connector')) {
                amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                    buttonLiveConnector.disabled = true;
                    const response = yield this.startLiveConnector();
                    const toastContainer = document.getElementById('toast-container');
                    const toast = document.createElement('meeting-toast');
                    toastContainer.appendChild(toast);
                    toast.message = 'Playback URL: ' + response.playBackUrl;
                    toast.delay = '50000';
                    toast.show();
                    buttonLiveConnector.disabled = false;
                }));
            }
            else {
                amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                    buttonLiveConnector.disabled = true;
                    yield this.stopLiveConnector();
                    buttonLiveConnector.disabled = false;
                }));
            }
        });
        const buttonRecordSelf = document.getElementById('button-record-self');
        let recorder;
        buttonRecordSelf.addEventListener('click', _e => {
            const chunks = [];
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                this.toggleButton('button-record-self');
                this.updateButtonVideoRecordingDrop();
                if (!this.isButtonOn('button-record-self')) {
                    console.info('Stopping recorder ', recorder);
                    recorder.stop();
                    recorder = undefined;
                    return;
                }
                // Combine the audio and video streams.
                const mixed = new MediaStream();
                const localTile = this.audioVideo.getLocalVideoTile();
                if (localTile) {
                    mixed.addTrack(localTile.state().boundVideoStream.getVideoTracks()[0]);
                }
                // We need to get access to the media stream broker, which requires knowing
                // the exact implementation. Sorry!
                /* @ts-ignore */
                const av = this.audioVideo.audioVideoController;
                const input = yield av.mediaStreamBroker.acquireAudioInputStream();
                mixed.addTrack(input.getAudioTracks()[0]);
                recorder = new MediaRecorder(mixed, { mimeType: 'video/webm; codecs=vp9' });
                console.info('Setting recorder to', recorder);
                recorder.ondataavailable = (event) => {
                    if (event.data.size) {
                        chunks.push(event.data);
                    }
                };
                recorder.onstop = () => {
                    const blob = new Blob(chunks, {
                        type: 'video/webm',
                    });
                    chunks.length = 0;
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    document.body.appendChild(a);
                    /* @ts-ignore */
                    a.style = 'display: none';
                    a.href = url;
                    a.download = 'recording.webm';
                    a.click();
                    window.URL.revokeObjectURL(url);
                };
                recorder.start();
            }));
        });
        const buttonVideo = document.getElementById('button-camera');
        buttonVideo.addEventListener('click', _e => {
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                if (this.toggleButton('button-camera') === 'on' && this.canStartLocalVideo) {
                    try {
                        let camera = this.selectedVideoInput;
                        if (camera === null || camera === 'None') {
                            camera = this.cameraDeviceIds.length ? this.cameraDeviceIds[0] : 'None';
                        }
                        yield this.openVideoInputFromSelection(camera, false);
                        this.audioVideo.startLocalVideoTile();
                    }
                    catch (err) {
                        this.toggleButton('button-camera', 'off');
                        exports.fatal(err);
                    }
                }
                else {
                    yield this.audioVideo.stopVideoInput();
                    this.toggleButton('button-camera', 'off');
                }
            }));
        });
        const buttonSpeaker = document.getElementById('button-speaker');
        buttonSpeaker.addEventListener('click', _e => {
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                this.toggleButton('button-speaker');
                if (this.isButtonOn('button-speaker')) {
                    try {
                        yield this.audioVideo.bindAudioElement(document.getElementById('meeting-audio'));
                    }
                    catch (e) {
                        exports.fatal(e);
                        this.log('Failed to bindAudioElement', e);
                    }
                }
                else {
                    this.audioVideo.unbindAudioElement();
                }
            }));
        });
        const buttonLiveTranscription = document.getElementById('button-live-transcription');
        buttonLiveTranscription.addEventListener('click', () => {
            this.transcriptContainerDiv.style.display = this.isButtonOn('button-live-transcription')
                ? 'none'
                : 'block';
            this.toggleButton('button-live-transcription');
        });
        const buttonLiveTranscriptionModal = document.getElementById('button-live-transcription-modal-close');
        buttonLiveTranscriptionModal.addEventListener('click', () => {
            document.getElementById('live-transcription-modal').style.display = 'none';
        });
        // show only languages available to selected transcription engine
        document.getElementsByName('transcription-engine').forEach(e => {
            e.addEventListener('change', () => {
                const engineTranscribeChecked = document.getElementById('engine-transcribe').checked;
                const contentIdentificationChecked = document.getElementById('content-identification-checkbox').checked;
                const contentRedactionChecked = document.getElementById('content-redaction-checkbox').checked;
                document
                    .getElementById('engine-transcribe-language')
                    .classList.toggle('hidden', !engineTranscribeChecked);
                document
                    .getElementById('engine-transcribe-medical-language')
                    .classList.toggle('hidden', engineTranscribeChecked);
                document
                    .getElementById('engine-transcribe-region')
                    .classList.toggle('hidden', !engineTranscribeChecked);
                document
                    .getElementById('engine-transcribe-medical-region')
                    .classList.toggle('hidden', engineTranscribeChecked);
                document
                    .getElementById('engine-transcribe-medical-content-identification')
                    .classList.toggle('hidden', engineTranscribeChecked);
                document
                    .getElementById('engine-transcribe-language-identification')
                    .classList.toggle('hidden', !engineTranscribeChecked);
                document
                    .getElementById('engine-transcribe-content-identification')
                    .classList.toggle('hidden', !engineTranscribeChecked);
                document
                    .getElementById('engine-transcribe-redaction')
                    .classList.toggle('hidden', !engineTranscribeChecked);
                document
                    .getElementById('engine-transcribe-partial-stabilization')
                    .classList.toggle('hidden', !engineTranscribeChecked);
                document
                    .getElementById('engine-transcribe-custom-language-model')
                    .classList.toggle('hidden', !engineTranscribeChecked);
                if (!engineTranscribeChecked) {
                    document.getElementById('transcribe-entity-types').classList.toggle('hidden', true);
                }
                else if (engineTranscribeChecked &&
                    (contentIdentificationChecked || contentRedactionChecked)) {
                    document.getElementById('transcribe-entity-types').classList.toggle('hidden', false);
                }
            });
        });
        const languageIdentificationCb = document.getElementById('identify-language-checkbox');
        languageIdentificationCb.addEventListener('click', () => {
            document.getElementById('button-start-transcription').disabled =
                languageIdentificationCb.checked;
            document
                .getElementById('language-options')
                .classList.toggle('hidden', !languageIdentificationCb.checked);
            document
                .getElementById('preferred-language')
                .classList.toggle('hidden', !languageIdentificationCb.checked);
            document
                .getElementById('vocabulary-names')
                .classList.toggle('hidden', !languageIdentificationCb.checked);
            document
                .getElementById('vocabulary-filter-names')
                .classList.toggle('hidden', !languageIdentificationCb.checked);
            document.getElementById('transcribe-language').disabled =
                languageIdentificationCb.checked;
            document.getElementById('content-identification-checkbox').disabled =
                languageIdentificationCb.checked;
            document.getElementById('content-redaction-checkbox').disabled =
                languageIdentificationCb.checked;
            document.getElementById('custom-language-model-checkbox').disabled =
                languageIdentificationCb.checked;
            document.getElementById('transcribe-entity').disabled =
                languageIdentificationCb.checked;
            document.getElementById('language-model-input-text').disabled =
                languageIdentificationCb.checked;
        });
        const languageOptionsDropDown = document.getElementById('language-options');
        languageOptionsDropDown.addEventListener('change', event => languageOptionsDropDownClickHandler(event));
        const contentIdentificationCb = document.getElementById('content-identification-checkbox');
        contentIdentificationCb.addEventListener('click', () => {
            document.getElementById('content-redaction-checkbox').disabled =
                contentIdentificationCb.checked;
            document.getElementById('transcribe-entity-types').classList.toggle('hidden', !contentIdentificationCb.checked);
        });
        const contentRedactionCb = document.getElementById('content-redaction-checkbox');
        contentRedactionCb.addEventListener('click', () => {
            document.getElementById('content-identification-checkbox').disabled =
                contentRedactionCb.checked;
            document.getElementById('transcribe-entity-types').classList.toggle('hidden', !contentRedactionCb.checked);
        });
        const partialResultsStabilityCb = document.getElementById('partial-stabilization-checkbox');
        partialResultsStabilityCb.addEventListener('click', () => {
            document
                .getElementById('transcribe-partial-stability')
                .classList.toggle('hidden', !partialResultsStabilityCb.checked);
        });
        const languageModelCb = document.getElementById('custom-language-model-checkbox');
        languageModelCb.addEventListener('click', () => {
            document
                .getElementById('language-model')
                .classList.toggle('hidden', !languageModelCb.checked);
        });
        const buttonStartTranscription = document.getElementById('button-start-transcription');
        buttonStartTranscription.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            let engine = '';
            let languageCode = '';
            let region = '';
            const transcriptionStreamParams = {};
            if (document.getElementById('engine-transcribe').checked) {
                engine = 'transcribe';
                region = document.getElementById('transcribe-region').value;
                if (!isChecked('identify-language-checkbox')) {
                    languageCode = document.getElementById('transcribe-language').value;
                    if (isChecked('content-identification-checkbox')) {
                        transcriptionStreamParams.contentIdentificationType = 'PII';
                    }
                    if (isChecked('content-redaction-checkbox')) {
                        transcriptionStreamParams.contentRedactionType = 'PII';
                    }
                    if (isChecked('content-identification-checkbox') ||
                        isChecked('content-redaction-checkbox')) {
                        let piiEntityTypes = getSelectedValues('#transcribe-entity');
                        if (piiEntityTypes !== '') {
                            transcriptionStreamParams.piiEntityTypes = piiEntityTypes;
                        }
                    }
                    if (isChecked('custom-language-model-checkbox')) {
                        let languageModelName = document.getElementById('language-model-input-text').value;
                        if (languageModelName) {
                            transcriptionStreamParams.languageModelName = languageModelName;
                        }
                    }
                }
                if (isChecked('identify-language-checkbox')) {
                    transcriptionStreamParams.identifyLanguage = true;
                    const languageOptionsSelected = getSelectedValues('#language-options');
                    if (languageOptionsSelected !== '') {
                        transcriptionStreamParams.languageOptions = languageOptionsSelected;
                    }
                    const preferredLanguageSelected = document.getElementById('preferred-language-selection').value;
                    if (preferredLanguageSelected) {
                        transcriptionStreamParams.preferredLanguage = preferredLanguageSelected;
                    }
                    const vocabularyNames = document.getElementById('vocabulary-names-input-text').value;
                    if (vocabularyNames) {
                        transcriptionStreamParams.vocabularyNames = vocabularyNames;
                    }
                    const vocabularyFilterNames = document.getElementById('vocabulary-filter-names-input-text').value;
                    if (vocabularyFilterNames) {
                        transcriptionStreamParams.vocabularyFilterNames = vocabularyFilterNames;
                    }
                }
                if (isChecked('partial-stabilization-checkbox')) {
                    transcriptionStreamParams.enablePartialResultsStability = true;
                }
                let partialResultsStability = document.getElementById('partial-stability').value;
                if (partialResultsStability) {
                    transcriptionStreamParams.partialResultsStability = partialResultsStability;
                }
            }
            else if (document.getElementById('engine-transcribe-medical').checked) {
                engine = 'transcribe_medical';
                languageCode = document.getElementById('transcribe-medical-language')
                    .value;
                region = document.getElementById('transcribe-medical-region').value;
                if (isChecked('medical-content-identification-checkbox')) {
                    transcriptionStreamParams.contentIdentificationType = 'PHI';
                }
            }
            else {
                throw new Error('Unknown transcription engine');
            }
            yield startLiveTranscription(engine, languageCode, region, transcriptionStreamParams);
        }));
        function isChecked(id) {
            return document.getElementById(id).checked;
        }
        // fetches checked values of the list from given selector id
        function getSelectedValues(id) {
            let selectors = id + ' ' + 'option:checked';
            const selectedValues = document.querySelectorAll(selectors);
            let values = '';
            if (selectedValues.length > 0) {
                values = Array.from(selectedValues)
                    .filter(node => node.value !== '')
                    .map(el => el.value)
                    .join(',');
            }
            return values;
        }
        function createErrorSpan(message) {
            let languageOptionsErrorSpan = document.createElement('span');
            languageOptionsErrorSpan.innerText = message;
            languageOptionsErrorSpan.classList.add('error-message-color');
            document
                .getElementById('language-options-error-message')
                .appendChild(languageOptionsErrorSpan);
            document.getElementById('button-start-transcription').disabled = true;
        }
        // callback to restrict users from selecting multiple language variant (locale) per language code
        // e.g. en-US and en-AU as language options cannot be selected for the same transcription
        // Details in https://docs.aws.amazon.com/transcribe/latest/dg/lang-id-stream.html
        function languageOptionsDropDownClickHandler(event) {
            let languageGroupSet = new Set();
            document.getElementById('language-options-error-message').innerHTML = '';
            const languageOptionsSelected = document.querySelectorAll('#language-options option:checked');
            const languageOptionsPreviewSpan = document.getElementById('language-options-selected-options');
            const languageString = languageOptionsSelected.length === 0
                ? 'None'
                : Array.from(languageOptionsSelected)
                    .map((node) => node.value)
                    .join(',')
                    .trim();
            languageOptionsPreviewSpan.innerText = languageString;
            let preferredLanguageDropDown = document.getElementById('preferred-language-selection');
            if (preferredLanguageDropDown.hasChildNodes) {
                let options = preferredLanguageDropDown.options;
                for (let i = options.length - 1; i >= 0; i--) {
                    if (options[i].value.length > 0) {
                        preferredLanguageDropDown.removeChild(options[i]);
                    }
                }
            }
            for (let i = languageOptionsSelected.length - 1; i >= 0; i--) {
                let currentItem = languageOptionsSelected.item(i);
                if (languageGroupSet.has(currentItem.parentElement.id)) {
                    createErrorSpan('Please select one language per group');
                    return false;
                }
                languageGroupSet.add(currentItem.parentElement.id);
                let selectedValue = currentItem.value;
                let option = document.createElement('option');
                option.value = selectedValue;
                option.text = currentItem.innerText;
                document.getElementById('preferred-language-selection').appendChild(option);
            }
            if (languageOptionsSelected.length < 2) {
                createErrorSpan('Please select at least 2 language options');
                return false;
            }
            else if (languageOptionsSelected.length >= 2) {
                document.getElementById('button-start-transcription').disabled = false;
            }
        }
        const startLiveTranscription = (engine, languageCode, region, transcriptionStreamParams) => __awaiter(this, void 0, void 0, function* () {
            const transcriptionAdditionalParams = JSON.stringify(transcriptionStreamParams);
            const response = yield fetch(`${DemoMeetingApp.BASE_URL}start_transcription?title=${encodeURIComponent(this.meeting)}&engine=${encodeURIComponent(engine)}&language=${encodeURIComponent(languageCode)}&region=${encodeURIComponent(region)}&transcriptionStreamParams=${encodeURIComponent(transcriptionAdditionalParams)}`, {
                method: 'POST',
            });
            const json = yield response.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            document.getElementById('live-transcription-modal').style.display = 'none';
        });
        const buttonVideoStats = document.getElementById('button-video-stats');
        buttonVideoStats.addEventListener('click', () => {
            if (this.isButtonOn('button-video-stats')) {
                document.querySelectorAll('.stats-info').forEach(e => e.remove());
            }
            else {
                this.getRelayProtocol();
            }
            this.toggleButton('button-video-stats');
        });
        const buttonPromoteToPrimary = document.getElementById('button-promote-to-primary');
        buttonPromoteToPrimary.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            var _k;
            if (!this.isButtonOn('button-promote-to-primary')) {
                yield this.promoteToPrimaryMeeting();
            }
            else {
                this.meetingLogger.info('Demoting from primary meeting');
                if (this.deleteOwnAttendeeToLeave) {
                    this.deleteAttendee(this.primaryExternalMeetingId, (_k = this.primaryMeetingSessionCredentials) === null || _k === void 0 ? void 0 : _k.attendeeId);
                }
                else {
                    this.audioVideo.demoteFromPrimaryMeeting();
                }
                // `audioVideoWasDemotedFromPrimaryMeeting` will adjust UX
            }
        }));
        const sendMessage = () => {
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => {
                const textArea = document.getElementById('send-message');
                const textToSend = textArea.value.trim();
                if (!textToSend) {
                    return;
                }
                textArea.value = '';
                this.audioVideo.realtimeSendDataMessage(DemoMeetingApp.DATA_MESSAGE_TOPIC, textToSend, DemoMeetingApp.DATA_MESSAGE_LIFETIME_MS);
                // echo the message to the handler
                this.dataMessageHandler(new amazon_chime_sdk_js_1.DataMessage(Date.now(), DemoMeetingApp.DATA_MESSAGE_TOPIC, new TextEncoder().encode(textToSend), this.meetingSession.configuration.credentials.attendeeId, this.meetingSession.configuration.credentials.externalUserId));
            });
        };
        const textAreaSendMessage = document.getElementById('send-message');
        textAreaSendMessage.addEventListener('keydown', e => {
            if (e.keyCode === 13) {
                if (e.shiftKey) {
                    textAreaSendMessage.rows++;
                }
                else {
                    e.preventDefault();
                    sendMessage();
                    textAreaSendMessage.rows = 1;
                }
            }
        });
        const buttonMeetingEnd = document.getElementById('button-meeting-end');
        buttonMeetingEnd.addEventListener('click', _e => {
            const confirmEnd = new URL(window.location.href).searchParams.get('confirm-end') === 'true';
            const prompt = 'Are you sure you want to end the meeting for everyone? The meeting cannot be used after ending it.';
            if (confirmEnd && !window.confirm(prompt)) {
                return;
            }
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                buttonMeetingEnd.disabled = true;
                yield this.endMeeting();
                yield this.leave();
                buttonMeetingEnd.disabled = false;
            }));
        });
        const buttonMeetingLeave = document.getElementById('button-meeting-leave');
        buttonMeetingLeave.addEventListener('click', e => {
            if (e.shiftKey) {
                this.behaviorAfterLeave = 'halt';
            }
            amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                buttonMeetingLeave.disabled = true;
                yield this.leave();
                buttonMeetingLeave.disabled = false;
            }));
        });
    }
    logAudioStreamPPS(clientMetricReport) {
        const { currentTimestampMs, previousTimestampMs } = clientMetricReport;
        const deltaTime = currentTimestampMs - previousTimestampMs;
        const rtcStatsReport = clientMetricReport.getRTCStatsReport();
        rtcStatsReport.forEach(report => {
            if (report.type === 'outbound-rtp' && report.kind === 'audio') {
                // Skip initial metric.
                if (report.packetsSent === 0 && previousTimestampMs === 0)
                    return;
                const deltaPackets = report.packetsSent - this.lastPacketsSent;
                const pps = (1000 * deltaPackets) / deltaTime;
                let overage = 0;
                if ((pps > 52) || (pps < 47)) {
                    console.error('PPS:', pps, `(${++overage})`);
                }
                else {
                    overage = 0;
                    console.debug('PPS:', pps);
                }
                this.lastPacketsSent = report.packetsSent;
            }
        });
    }
    logRedRecoveryPercent(clientMetricReport) {
        const customStatsReports = clientMetricReport.customStatsReports;
        // @ts-ignore
        customStatsReports.forEach(report => {
            if (report.type === 'inbound-rtp-red' && report.kind === 'audio') {
                const deltaExpected = report.totalAudioPacketsExpected - this.lastTotalAudioPacketsExpected;
                const deltaLost = report.totalAudioPacketsLost - this.lastTotalAudioPacketsLost;
                const deltaRedRecovered = report.totalAudioPacketsRecoveredRed - this.lastTotalAudioPacketsRecoveredRed;
                const deltaFecRecovered = report.totalAudioPacketsRecoveredFec - this.lastTotalAudioPacketsRecoveredFec;
                if (this.lastRedRecoveryMetricsReceived === 0)
                    this.lastRedRecoveryMetricsReceived = report.timestamp;
                const deltaTime = report.timestamp - this.lastRedRecoveryMetricsReceived;
                this.lastRedRecoveryMetricsReceived = report.timestamp;
                this.lastTotalAudioPacketsExpected = report.totalAudioPacketsExpected;
                this.lastTotalAudioPacketsLost = report.totalAudioPacketsLost;
                this.lastTotalAudioPacketsRecoveredRed = report.totalAudioPacketsRecoveredRed;
                this.lastTotalAudioPacketsRecoveredFec = report.totalAudioPacketsRecoveredFec;
                let lossPercent = 0;
                if (deltaExpected > 0) {
                    lossPercent = 100 * (deltaLost / deltaExpected);
                }
                let redRecoveryPercent = 0;
                let fecRecoveryPercent = 0;
                if (deltaLost > 0) {
                    redRecoveryPercent = 100 * (deltaRedRecovered / deltaLost);
                    fecRecoveryPercent = 100 * (deltaFecRecovered / deltaLost);
                }
                console.debug(`[AudioRed] time since last report = ${deltaTime / 1000}s, loss % = ${lossPercent}, red recovery % = ${redRecoveryPercent}, fec recovery % = ${fecRecoveryPercent}, total expected = ${report.totalAudioPacketsExpected}, total lost = ${report.totalAudioPacketsLost}, total red recovered  = ${report.totalAudioPacketsRecoveredRed}, total fec recovered = ${report.totalAudioPacketsRecoveredFec}`);
            }
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
        amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
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
                exports.fatal(error);
                this.log('Default media region selected: ' + error.message);
            }
        }));
    }
    promoteToPrimaryMeeting() {
        return __awaiter(this, void 0, void 0, function* () {
            this.meetingLogger.info('Attempting to promote self to primary meeting from replica');
            if (this.primaryMeetingSessionCredentials === undefined) {
                this.primaryMeetingSessionCredentials = yield this.getPrimaryMeetingCredentials();
            }
            yield this.audioVideo
                .promoteToPrimaryMeeting(this.primaryMeetingSessionCredentials)
                .then((status) => {
                const toastContainer = document.getElementById('toast-container');
                const toast = document.createElement('meeting-toast');
                toastContainer.appendChild(toast);
                if (status.isFailure()) {
                    toast.message = ` Failed to promote to primary meeting due to error: ${status.toString()}`;
                    toast.addButton('Retry', () => {
                        this.promoteToPrimaryMeeting();
                    });
                }
                else {
                    toast.message = `Successfully promoted to primary meeting`;
                    this.updateUXForReplicaMeetingPromotionState('promoted');
                }
                toast.show();
            });
        });
    }
    getPrimaryMeetingCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            // Use the same join endpoint, but point it to the provided primary meeting title and give us an arbitrarily different user name
            const joinInfo = (yield this.sendJoinRequest(this.primaryExternalMeetingId, `promoted-${this.name}`, this.region, undefined, this.audioCapability, this.videoCapability, this.contentCapability)).JoinInfo;
            // To avoid duplicating code we reuse the constructor for `MeetingSessionConfiguration` which contains `MeetingSessionCredentials`
            // within it and properly does the parsing of the `chime::CreateAttendee` response
            const configuration = new amazon_chime_sdk_js_1.MeetingSessionConfiguration(joinInfo.Meeting, joinInfo.Attendee);
            return configuration.credentials;
        });
    }
    updateUXForViewOnlyMode() {
        for (const button in this.buttonStates) {
            if (button === 'button-speaker' ||
                button === 'button-video-stats' ||
                button === 'button-live-transcription') {
                continue;
            }
            this.toggleButton(button, 'disabled');
        }
        // Mute since we use dummy audio
        this.audioVideo.realtimeMuteLocalAudio();
    }
    updateUXForReplicaMeetingPromotionState(promotedState) {
        const isPromoted = promotedState === 'promoted';
        // Enable/disable buttons as appropriate
        for (const button in this.buttonStates) {
            if (button === 'button-speaker' ||
                button === 'button-video-stats' ||
                button === 'button-live-transcription') {
                continue;
            }
            if (button === 'button-promote-to-primary') {
                // Don't disable promotion button
                this.meetingLogger.info(`promote button ${isPromoted ? 'on' : 'off'}`);
                this.toggleButton(button, isPromoted ? 'on' : 'off');
                continue;
            }
            this.toggleButton(button, isPromoted ? 'off' : 'disabled');
        }
        // Additionally mute audio so it's not in an unexpected state when demoted
        if (!isPromoted) {
            this.audioVideo.realtimeMuteLocalAudio();
        }
    }
    setButtonVisibility(button, visible, state) {
        const element = document.getElementById(button);
        element.style.display = visible ? 'inline-block' : 'none';
        this.toggleButton(button, state);
    }
    toggleButton(button, state) {
        if (state) {
            this.buttonStates[button] = state;
        }
        else if (this.buttonStates[button] === 'on') {
            this.buttonStates[button] = 'off';
        }
        else {
            this.buttonStates[button] = 'on';
        }
        this.displayButtonStates();
        return this.buttonStates[button];
    }
    isButtonOn(button) {
        return this.buttonStates[button] === 'on';
    }
    updateButtonVideoRecordingDrop() {
        if (this.buttonStates['button-record-self'] === 'on' ||
            this.buttonStates['button-record-cloud'] === 'on' ||
            this.buttonStates['button-live-connector'] === 'on') {
            this.buttonStates['button-video-recording-drop'] = 'on';
        }
        else if (this.buttonStates['button-record-self'] === 'off' &&
            this.buttonStates['button-record-cloud'] === 'off' &&
            this.buttonStates['button-live-connector'] === 'off') {
            this.buttonStates['button-video-recording-drop'] = 'off';
        }
        this.displayButtonStates();
    }
    displayButtonStates() {
        for (const button in this.buttonStates) {
            const element = document.getElementById(button);
            const drop = document.getElementById(`${button}-drop`);
            const on = this.isButtonOn(button);
            element.classList.add(on ? 'btn-success' : 'btn-outline-secondary');
            element.classList.remove(on ? 'btn-outline-secondary' : 'btn-success');
            element.firstElementChild.classList.add(on ? 'svg-active' : 'svg-inactive');
            element.firstElementChild.classList.remove(on ? 'svg-inactive' : 'svg-active');
            if (this.buttonStates[button] === 'disabled') {
                element.setAttribute('disabled', '');
            }
            else {
                element.removeAttribute('disabled');
            }
            if (drop) {
                drop.classList.add(on ? 'btn-success' : 'btn-outline-secondary');
                drop.classList.remove(on ? 'btn-outline-secondary' : 'btn-success');
                if (this.buttonStates[button] === 'disabled') {
                    drop.setAttribute('disabled', '');
                }
                else {
                    drop.removeAttribute('disabled');
                }
            }
        }
    }
    showProgress(id) {
        document.getElementById(id).style.visibility = 'visible';
    }
    hideProgress(id) {
        document.getElementById(id).style.visibility = 'hidden';
    }
    switchToFlow(flow) {
        Array.from(document.getElementsByClassName('flow')).map(e => (e.style.display = 'none'));
        document.getElementById(flow).style.display = 'block';
    }
    onAudioInputsChanged(freshDevices) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.populateAudioInputList();
            if (!this.currentAudioInputDevice) {
                return;
            }
            if (this.currentAudioInputDevice === 'default') {
                // The default device might actually have changed. Go ahead and trigger a
                // reselection.
                this.log('Reselecting default device.');
                yield this.selectAudioInputDevice(this.currentAudioInputDevice);
                return;
            }
            const freshDeviceWithSameID = freshDevices.find(device => device.deviceId === this.currentAudioInputDevice);
            if (freshDeviceWithSameID === undefined) {
                this.log('Existing device disappeared. Selecting a new one.');
                // Select a new device.
                yield this.openAudioInputFromSelectionAndPreview();
            }
        });
    }
    audioInputMuteStateChanged(device, muted) {
        this.log('Mute state: device', device, muted ? 'is muted' : 'is not muted');
    }
    audioInputsChanged(freshAudioInputDeviceList) {
        this.onAudioInputsChanged(freshAudioInputDeviceList);
    }
    videoInputsChanged(_freshVideoInputDeviceList) {
        this.populateVideoInputList();
    }
    audioOutputsChanged(_freshAudioOutputDeviceList) {
        this.populateAudioOutputList();
    }
    audioInputStreamEnded(deviceId) {
        this.log(`Current audio input stream from device id ${deviceId} ended.`);
    }
    videoInputStreamEnded(deviceId) {
        this.log(`Current video input stream from device id ${deviceId} ended.`);
        if (this.buttonStates['button-camera'] === 'on') {
            // Video input is ended, update button state
            this.buttonStates['button-camera'] = 'off';
            this.displayButtonStates();
        }
    }
    metricsDidReceive(clientMetricReport) {
        this.logAudioStreamPPS(clientMetricReport);
        this.logRedRecoveryPercent(clientMetricReport);
        const metricReport = clientMetricReport.getObservableMetrics();
        this.videoMetricReport = clientMetricReport.getObservableVideoMetrics();
        this.displayEstimatedUplinkBandwidth(metricReport.availableOutgoingBitrate);
        this.displayEstimatedDownlinkBandwidth(metricReport.availableIncomingBitrate);
        this.isButtonOn('button-video-stats') &&
            this.videoTileCollection.showVideoWebRTCStats(this.videoMetricReport);
    }
    displayEstimatedUplinkBandwidth(bitrate) {
        const value = `Available Uplink Bandwidth: ${bitrate ? bitrate / 1000 : 'Unknown'} Kbps`;
        document.getElementById('video-uplink-bandwidth').innerText = value;
        document.getElementById('mobile-video-uplink-bandwidth').innerText = value;
    }
    displayEstimatedDownlinkBandwidth(bitrate) {
        const value = `Available Downlink Bandwidth: ${bitrate ? bitrate / 1000 : 'Unknown'} Kbps`;
        document.getElementById('video-downlink-bandwidth').innerText = value;
        document.getElementById('mobile-video-downlink-bandwidth').innerText = value;
    }
    getRelayProtocol() {
        return __awaiter(this, void 0, void 0, function* () {
            const rawStats = yield this.audioVideo.getRTCPeerConnectionStats();
            if (rawStats) {
                rawStats.forEach(report => {
                    if (report.type === 'local-candidate') {
                        this.log(`Local WebRTC Ice Candidate stats: ${JSON.stringify(report)}`);
                        const relayProtocol = report.relayProtocol;
                        if (typeof relayProtocol === 'string') {
                            if (relayProtocol === 'udp') {
                                this.log(`Connection using ${relayProtocol.toUpperCase()} protocol`);
                            }
                            else {
                                this.log(`Connection fell back to ${relayProtocol.toUpperCase()} protocol`);
                            }
                        }
                    }
                });
            }
        });
    }
    createLogStream(configuration, pathname) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = JSON.stringify({
                meetingId: configuration.meetingId,
                attendeeId: configuration.credentials.attendeeId,
            });
            try {
                const response = yield fetch(`${DemoMeetingApp.BASE_URL}${pathname}`, {
                    method: 'POST',
                    body,
                });
                if (response.status === 200) {
                    console.log('[DEMO] log stream created');
                }
            }
            catch (error) {
                exports.fatal(error);
                this.log(error.message);
            }
        });
    }
    eventDidReceive(name, attributes) {
        var _a, _b;
        this.log(`Received an event: ${JSON.stringify({ name, attributes })}`);
        const { meetingHistory } = attributes, otherAttributes = __rest(attributes, ["meetingHistory"]);
        switch (name) {
            case 'meetingStartRequested':
            case 'meetingStartSucceeded':
            case 'meetingEnded':
            case 'audioInputSelected':
            case 'videoInputSelected':
            case 'audioInputUnselected':
            case 'videoInputUnselected':
            case 'meetingReconnected':
            case 'receivingAudioDropped':
            case 'signalingDropped':
            case 'sendingAudioFailed':
            case 'sendingAudioRecovered':
            case 'attendeePresenceReceived': {
                // Exclude the "meetingHistory" attribute for successful -> published events.
                (_a = this.meetingEventPOSTLogger) === null || _a === void 0 ? void 0 : _a.info(JSON.stringify({
                    name,
                    attributes: otherAttributes,
                }));
                break;
            }
            case 'audioInputFailed':
            case 'videoInputFailed':
            case 'deviceLabelTriggerFailed':
            case 'meetingStartFailed':
            case 'meetingFailed': {
                // Send the last 5 minutes of events.
                (_b = this.meetingEventPOSTLogger) === null || _b === void 0 ? void 0 : _b.info(JSON.stringify({
                    name,
                    attributes: Object.assign(Object.assign({}, otherAttributes), { meetingHistory: meetingHistory.filter(({ timestampMs }) => {
                            return Date.now() - timestampMs < DemoMeetingApp.MAX_MEETING_HISTORY_MS;
                        }) }),
                }));
                break;
            }
        }
    }
    initializeMeetingSession(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            const consoleLogger = (this.meetingLogger = new amazon_chime_sdk_js_1.ConsoleLogger('SDK', this.logLevel));
            if (this.isLocalHost()) {
                this.meetingLogger = consoleLogger;
            }
            else {
                yield Promise.all([
                    this.createLogStream(configuration, 'create_log_stream'),
                    this.createLogStream(configuration, 'create_browser_event_log_stream'),
                ]);
                this.meetingSessionPOSTLogger = MeetingLogger_1.getPOSTLogger(configuration, 'SDK', `${DemoMeetingApp.BASE_URL}logs`, this.logLevel);
                this.meetingLogger = new amazon_chime_sdk_js_1.MultiLogger(consoleLogger, this.meetingSessionPOSTLogger);
                this.meetingEventPOSTLogger = MeetingLogger_1.getPOSTLogger(configuration, 'SDKEvent', `${DemoMeetingApp.BASE_URL}log_meeting_event`, this.logLevel);
            }
            this.eventReporter = yield this.setupEventReporter(configuration);
            this.deviceController = new amazon_chime_sdk_js_1.DefaultDeviceController(this.meetingLogger, {
                enableWebAudio: this.enableWebAudio,
            });
            const urlParameters = new URL(window.location.href).searchParams;
            const timeoutMs = Number(urlParameters.get('attendee-presence-timeout-ms'));
            if (!isNaN(timeoutMs)) {
                configuration.attendeePresenceTimeoutMs = Number(timeoutMs);
            }
            configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = this.enableSimulcast;
            if (this.usePriorityBasedDownlinkPolicy) {
                const serverSideNetworkAdaptionDropDown = document.getElementById('server-side-network-adaption');
                switch (serverSideNetworkAdaptionDropDown.value) {
                    case 'default':
                        this.videoPriorityBasedPolicyConfig.serverSideNetworkAdaption =
                            amazon_chime_sdk_js_1.ServerSideNetworkAdaption.Default;
                        break;
                    case 'none':
                        this.videoPriorityBasedPolicyConfig.serverSideNetworkAdaption =
                            amazon_chime_sdk_js_1.ServerSideNetworkAdaption.None;
                        break;
                    case 'enable-bandwidth-probing':
                        this.videoPriorityBasedPolicyConfig.serverSideNetworkAdaption =
                            amazon_chime_sdk_js_1.ServerSideNetworkAdaption.BandwidthProbing;
                        break;
                    case 'enable-bandwidth-probing-and-video-adaption':
                        this.videoPriorityBasedPolicyConfig.serverSideNetworkAdaption =
                            amazon_chime_sdk_js_1.ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption;
                        break;
                }
                this.priorityBasedDownlinkPolicy = new amazon_chime_sdk_js_1.VideoPriorityBasedPolicy(this.meetingLogger, this.videoPriorityBasedPolicyConfig);
                configuration.videoDownlinkBandwidthPolicy = this.priorityBasedDownlinkPolicy;
                this.priorityBasedDownlinkPolicy.addObserver(this);
            }
            configuration.disablePeriodicKeyframeRequestOnContentSender = this.disablePeriodicKeyframeRequestOnContentSender;
            configuration.applicationMetadata = amazon_chime_sdk_js_1.ApplicationMetadata.create('amazon-chime-sdk-js-demo', '2.0.0');
            if (document.getElementById('pause-last-frame').checked) {
                configuration.keepLastFrameWhenPaused = true;
            }
            this.meetingSession = new amazon_chime_sdk_js_1.DefaultMeetingSession(configuration, this.meetingLogger, this.deviceController, new amazon_chime_sdk_js_1.DefaultEventController(configuration, this.meetingLogger, this.eventReporter));
            const enableAudioRedundancy = !(document.getElementById('disable-audio-redundancy').checked);
            let audioProfile = new amazon_chime_sdk_js_1.AudioProfile(null, enableAudioRedundancy);
            if (document.getElementById('fullband-speech-mono-quality').checked) {
                audioProfile = amazon_chime_sdk_js_1.AudioProfile.fullbandSpeechMono(enableAudioRedundancy);
                this.log('Using audio profile fullband-speech-mono-quality');
            }
            else if (document.getElementById('fullband-music-mono-quality').checked) {
                audioProfile = amazon_chime_sdk_js_1.AudioProfile.fullbandMusicMono(enableAudioRedundancy);
                this.log('Using audio profile fullband-music-mono-quality');
            }
            else if (document.getElementById('fullband-music-stereo-quality').checked) {
                audioProfile = amazon_chime_sdk_js_1.AudioProfile.fullbandMusicStereo(enableAudioRedundancy);
                this.log('Using audio profile fullband-music-stereo-quality');
            }
            this.log(`Audio Redundancy Enabled = ${audioProfile.hasRedundancyEnabled()}`);
            this.meetingSession.audioVideo.setAudioProfile(audioProfile);
            this.meetingSession.audioVideo.setContentAudioProfile(audioProfile);
            this.audioVideo = this.meetingSession.audioVideo;
            this.audioVideo.addDeviceChangeObserver(this);
            this.setupDeviceLabelTrigger();
            this.setupMuteHandler();
            this.setupCanUnmuteHandler();
            this.setupSubscribeToAttendeeIdPresenceHandler();
            this.setupDataMessage();
            this.setupDataFormMessage();
            this.setupLiveTranscription();
            this.audioVideo.addObserver(this);
            this.meetingSession.eventController.addObserver(this);
            this.audioVideo.addContentShareObserver(this);
            if (this.videoCodecPreferences !== undefined && this.videoCodecPreferences.length > 0) {
                this.audioVideo.setVideoCodecSendPreferences(this.videoCodecPreferences);
                this.audioVideo.setContentShareVideoCodecPreferences(this.videoCodecPreferences);
            }
            // The default pagination size is 25.
            let paginationPageSize = parseInt(document.getElementById('pagination-page-size').value);
            this.videoTileCollection = new VideoTileCollection_1.default(this.audioVideo, this.meetingLogger, this.usePriorityBasedDownlinkPolicy
                ? new VideoPreferenceManager_1.default(this.meetingLogger, this.priorityBasedDownlinkPolicy)
                : undefined, paginationPageSize);
            this.audioVideo.addObserver(this.videoTileCollection);
            this.contentShare = new ContentShareManager_1.default(this.meetingLogger, this.audioVideo, this.usingStereoMusicAudioProfile);
        });
    }
    setupEventReporter(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            let eventReporter;
            const ingestionURL = configuration.urls.eventIngestionURL;
            if (!ingestionURL) {
                return eventReporter;
            }
            if (!this.enableEventReporting) {
                return new amazon_chime_sdk_js_1.NoOpEventReporter();
            }
            const eventReportingLogger = new amazon_chime_sdk_js_1.ConsoleLogger('SDKEventIngestion', amazon_chime_sdk_js_1.LogLevel.INFO);
            const meetingEventClientConfig = new amazon_chime_sdk_js_1.MeetingEventsClientConfiguration(configuration.meetingId, configuration.credentials.attendeeId, configuration.credentials.joinToken);
            const eventIngestionConfiguration = new amazon_chime_sdk_js_1.EventIngestionConfiguration(meetingEventClientConfig, ingestionURL);
            if (this.isLocalHost()) {
                eventReporter = new amazon_chime_sdk_js_1.DefaultMeetingEventReporter(eventIngestionConfiguration, eventReportingLogger);
            }
            else {
                yield this.createLogStream(configuration, 'create_browser_event_ingestion_log_stream');
                const eventReportingPOSTLogger = MeetingLogger_1.getPOSTLogger(configuration, 'SDKEventIngestion', `${DemoMeetingApp.BASE_URL}log_event_ingestion`, amazon_chime_sdk_js_1.LogLevel.DEBUG);
                const multiEventReportingLogger = new amazon_chime_sdk_js_1.MultiLogger(eventReportingLogger, eventReportingPOSTLogger);
                eventReporter = new amazon_chime_sdk_js_1.DefaultMeetingEventReporter(eventIngestionConfiguration, multiEventReportingLogger);
            }
            return eventReporter;
        });
    }
    isLocalHost() {
        return (document.location.host === '127.0.0.1:8080' || document.location.host === 'localhost:8080');
    }
    join() {
        return __awaiter(this, void 0, void 0, function* () {
            window.addEventListener('unhandledrejection', (event) => {
                this.log(event.reason);
            });
            if (this.joinMuted) {
                this.audioVideo.realtimeMuteLocalAudio();
            }
            this.audioVideo.start();
        });
    }
    leave() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.deleteOwnAttendeeToLeave) {
                yield this.deleteAttendee(this.meeting, this.meetingSession.configuration.credentials.attendeeId);
                return;
            }
            this.resetStats();
            this.audioVideo.stop();
            yield ((_a = this.voiceFocusDevice) === null || _a === void 0 ? void 0 : _a.stop());
            this.voiceFocusDevice = undefined;
            yield ((_b = this.chosenVideoTransformDevice) === null || _b === void 0 ? void 0 : _b.stop());
            this.chosenVideoTransformDevice = undefined;
            this.roster.clear();
        });
    }
    setupMuteHandler() {
        this.muteAndUnmuteLocalAudioHandler = (isMuted) => {
            this.log(`muted = ${isMuted}`);
        };
        this.audioVideo.realtimeSubscribeToMuteAndUnmuteLocalAudio(this.muteAndUnmuteLocalAudioHandler);
        const isMuted = this.audioVideo.realtimeIsLocalAudioMuted();
        this.muteAndUnmuteLocalAudioHandler(isMuted);
    }
    setupCanUnmuteHandler() {
        this.canUnmuteLocalAudioHandler = (canUnmute) => {
            this.log(`canUnmute = ${canUnmute}`);
        };
        this.audioVideo.realtimeSubscribeToSetCanUnmuteLocalAudio(this.canUnmuteLocalAudioHandler);
        this.canUnmuteLocalAudioHandler(this.audioVideo.realtimeCanUnmuteLocalAudio());
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateProperty(obj, key, value) {
        if (value !== undefined && obj[key] !== value) {
            obj[key] = value;
        }
    }
    setupSubscribeToAttendeeIdPresenceHandler() {
        this.attendeeIdPresenceHandler = (attendeeId, present, externalUserId, dropped) => {
            var _a;
            this.log(`${attendeeId} present = ${present} (${externalUserId})`);
            const isContentAttendee = new amazon_chime_sdk_js_1.DefaultModality(attendeeId).hasModality(amazon_chime_sdk_js_1.DefaultModality.MODALITY_CONTENT);
            const isSelfAttendee = new amazon_chime_sdk_js_1.DefaultModality(attendeeId).base() ===
                this.meetingSession.configuration.credentials.attendeeId ||
                new amazon_chime_sdk_js_1.DefaultModality(attendeeId).base() ===
                    ((_a = this.primaryMeetingSessionCredentials) === null || _a === void 0 ? void 0 : _a.attendeeId);
            if (!present) {
                this.roster.removeAttendee(attendeeId);
                this.audioVideo.realtimeUnsubscribeFromVolumeIndicator(attendeeId, this.volumeIndicatorHandler);
                this.log(`${attendeeId} dropped = ${dropped} (${externalUserId})`);
                return;
            }
            //If someone else share content, stop the current content share
            if (!this.allowMaxContentShare() &&
                !isSelfAttendee &&
                isContentAttendee &&
                this.isButtonOn('button-content-share')) {
                this.contentShare.stop();
            }
            const attendeeName = externalUserId.split('#').slice(-1)[0] + (isContentAttendee ? ' «Content»' : '');
            this.roster.addAttendee(attendeeId, attendeeName, this.allowAttendeeCapabilities);
            this.volumeIndicatorHandler = (attendeeId, volume, muted, signalStrength) => __awaiter(this, void 0, void 0, function* () {
                if (muted !== null) {
                    this.roster.setMuteStatus(attendeeId, muted);
                }
                if (signalStrength !== null) {
                    this.roster.setSignalStrength(attendeeId, Math.round(signalStrength * 100));
                }
            });
            this.audioVideo.realtimeSubscribeToVolumeIndicator(attendeeId, this.volumeIndicatorHandler);
        };
        this.audioVideo.realtimeSubscribeToAttendeeIdPresence(this.attendeeIdPresenceHandler);
        // Hang on to this so we can unsubscribe later.
        this.activeSpeakerHandler = (attendeeIds) => {
            // First reset all roster active speaker information
            for (const id of this.roster.getAllAttendeeIds()) {
                this.roster.setAttendeeSpeakingStatus(id, false);
            }
            // Then re-update roster and tile collection with latest information
            //
            // This will leave featured tiles up since this detector doesn't seem to clear
            // the list.
            for (const attendeeId of attendeeIds) {
                if (this.roster.hasAttendee(attendeeId)) {
                    this.roster.setAttendeeSpeakingStatus(attendeeId, true);
                    this.videoTileCollection.activeSpeakerAttendeeId = attendeeId;
                    break; // Only show the most active speaker
                }
            }
        };
        const scoreHandler = (scores) => { };
        this.audioVideo.subscribeToActiveSpeakerDetector(new amazon_chime_sdk_js_1.DefaultActiveSpeakerPolicy(), this.activeSpeakerHandler, scoreHandler, this.showActiveSpeakerScores ? 100 : 0);
    }
    dataMessageHandler(dataMessage) {
        console.log('*************************messager:', dataMessage);
        console.log('*************************message.TYPE:', dataMessage.topic);
        if (!dataMessage.throttled) {
            const isSelf = dataMessage.senderAttendeeId === this.meetingSession.configuration.credentials.attendeeId;
            if (dataMessage.timestampMs <= this.lastReceivedMessageTimestamp) {
                return;
            }
            this.lastReceivedMessageTimestamp = dataMessage.timestampMs;
            // DREW ADD
            // console.log("*************************message:", dataMessage);
            // console.log("*************************message.TYPE:", dataMessage.topic);
            if (dataMessage.topic === 'quizForumQuestion' && !isSelf) {
                console.log("quiz forum question");
                const quizForumQuestion = {
                    quiz_id: '',
                    timestamp: new Date().toISOString(),
                    user_id: dataMessage.senderAttendeeId,
                    host_id: this.meetingSession.configuration.credentials.attendeeId,
                    question: dataMessage.text()
                };
                // UPDATE THE HTML HERE WITH THE QUIZFORUMQUESTION
                // Access the DOM elements
                const queriesBlock = document.getElementById('queries-block');
                const queriesSection = queriesBlock.querySelector('.queries-section');
                // Create a new query element and populate it with data from quizForumQuestion
                const newQuery = document.createElement('div');
                newQuery.innerHTML = `
              <div class="d-flex">
                  <p class="pe-3">${quizForumQuestion.user_id}</p> 
                  <p>Question <span>✋</span></p>
              </div>
              <h5>${quizForumQuestion.question}</h5>
              <div class="customInput">
                  <input type="text" placeholder="Respond" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none" id="send-quiz-comment">
                      <rect x="0.362305" width="23.6375" height="24.2175" rx="4" fill="#F2F2F8" />
                      <path d="M5.71813 13.4979L4.03607 8.25383C3.55455 6.75305 4.86749 5.29226 6.36714 5.66164L19.0245 8.77372C20.6405 9.17066 21.0795 11.3136 19.7556 12.3427L9.38737 20.4057C8.15899 21.3607 6.38381 20.5649 6.2358 18.9924L5.71813 13.4979ZM5.71813 13.4979L12.4654 12.0472" stroke="#3F4149" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
              </div>
          `;
                // Append the new query element to the queries section
                queriesSection.appendChild(newQuery);
                // Optionally, you can make the 'queries-block' section visible
                queriesBlock.style.display = 'block';
            }
            if (dataMessage.topic === 'displayForm') {
                console.log('*************************RUNNNING DISPLAYFORM:');
                console.log('Received message:', dataMessage.text());
                populateQuiz(dataMessage.text());
                // QUIZ RECEIVED HANDLER END
                let myModalEl = document.getElementById('challenge-modal');
                if (myModalEl) {
                    let myModal = new bootstrap_1.Modal(myModalEl);
                    myModal.show();
                }
                // const messageContent = new TextDecoder().decode(dataMessage.data);
                // const parsedMessage = JSON.parse(messageContent);
                // const receivedData = JSON.parse(dataMessage.text());
                // this.displayForm(receivedData);
                return;
            }
            // DREW ADD END
            const messageDiv = document.getElementById('receive-message');
            const messageNameSpan = document.createElement('div');
            messageNameSpan.classList.add('message-bubble-sender');
            messageNameSpan.innerText = dataMessage.senderExternalUserId.split('#').slice(-1)[0];
            const messageTextSpan = document.createElement('div');
            messageTextSpan.classList.add(isSelf ? 'message-bubble-self' : 'message-bubble-other');
            messageTextSpan.innerHTML = this.markdown
                .render(dataMessage.text())
                .replace(/[<]a /g, '<a target="_blank" ');
            const appendClass = (element, className) => {
                for (let i = 0; i < element.children.length; i++) {
                    const child = element.children[i];
                    child.classList.add(className);
                    appendClass(child, className);
                }
            };
            appendClass(messageTextSpan, 'markdown');
            if (this.lastMessageSender !== dataMessage.senderAttendeeId) {
                messageDiv.appendChild(messageNameSpan);
            }
            this.lastMessageSender = dataMessage.senderAttendeeId;
            messageDiv.appendChild(messageTextSpan);
            messageDiv.scrollTop = messageDiv.scrollHeight;
        }
        else {
            this.log('Message is throttled. Please resend');
        }
    }
    setupDataMessage() {
        this.audioVideo.realtimeSubscribeToReceiveDataMessage(DemoMeetingApp.DATA_MESSAGE_TOPIC, (dataMessage) => {
            this.dataMessageHandler(dataMessage);
        });
    }
    setupDataFormMessage() {
        this.audioVideo.realtimeSubscribeToReceiveDataMessage('displayForm', (dataMessage) => {
            this.dataMessageHandler(dataMessage);
        });
    }
    setupDataQuestionForumMessage() {
        this.audioVideo.realtimeSubscribeToReceiveDataMessage('quizForumQuestion', (dataMessage) => {
            this.dataMessageHandler(dataMessage);
        });
    }
    createSpaceSpan() {
        const spaceSpan = document.createElement('span');
        spaceSpan.classList.add('transcript-content');
        spaceSpan.innerText = '\u00a0';
        return spaceSpan;
    }
    ;
    // eslint-disable-next-line
    sendJoinRequest(meeting, name, region, primaryExternalMeetingId, audioCapability, videoCapability, contentCapability) {
        return __awaiter(this, void 0, void 0, function* () {
            let uri = `${DemoMeetingApp.BASE_URL}join?title=${encodeURIComponent(meeting)}&name=${encodeURIComponent(name)}&region=${encodeURIComponent(region)}`;
            if (primaryExternalMeetingId) {
                uri += `&primaryExternalMeetingId=${primaryExternalMeetingId}`;
            }
            if (audioCapability) {
                uri += `&attendeeAudioCapability=${audioCapability}`;
            }
            if (videoCapability) {
                uri += `&attendeeVideoCapability=${videoCapability}`;
            }
            if (contentCapability) {
                uri += `&attendeeContentCapability=${contentCapability}`;
            }
            uri += `&ns_es=${this.echoReductionCapability}`;
            const response = yield fetch(uri, {
                method: 'POST',
            });
            const json = yield response.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            return json;
        });
    }
    deleteAttendee(meeting, attendeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            let uri = `${DemoMeetingApp.BASE_URL}deleteAttendee?title=${encodeURIComponent(meeting)}&attendeeId=${encodeURIComponent(attendeeId)}`;
            const response = yield fetch(uri, {
                method: 'POST',
            });
            const json = yield response.json();
            this.meetingLogger.info(`Delete attendee response: ${JSON.stringify(json)}`);
        });
    }
    startMediaCapture() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fetch(`${DemoMeetingApp.BASE_URL}startCapture?title=${encodeURIComponent(this.meeting)}`, {
                method: 'POST',
            });
        });
    }
    stopMediaCapture() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fetch(`${DemoMeetingApp.BASE_URL}endCapture?title=${encodeURIComponent(this.meeting)}`, {
                method: 'POST',
            });
        });
    }
    startLiveConnector() {
        return __awaiter(this, void 0, void 0, function* () {
            const liveConnectorresponse = yield fetch(`${DemoMeetingApp.BASE_URL}startLiveConnector?title=${encodeURIComponent(this.meeting)}`, {
                method: 'POST',
            });
            const json = yield liveConnectorresponse.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            return json;
        });
    }
    stopLiveConnector() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fetch(`${DemoMeetingApp.BASE_URL}endLiveConnector?title=${encodeURIComponent(this.meeting)}`, {
                method: 'POST',
            });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAttendee(attendeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${DemoMeetingApp.BASE_URL}get_attendee?title=${encodeURIComponent(this.meeting)}&id=${encodeURIComponent(attendeeId)}`, {
                method: 'GET',
            });
            const json = yield response.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            return json;
        });
    }
    updateAttendeeCapabilities(attendeeId, audioCapability, videoCapability, contentCapability) {
        return __awaiter(this, void 0, void 0, function* () {
            const uri = `${DemoMeetingApp.BASE_URL}update_attendee_capabilities?title=${encodeURIComponent(this.meeting)}&attendeeId=${encodeURIComponent(attendeeId)}&audioCapability=${encodeURIComponent(audioCapability)}&videoCapability=${encodeURIComponent(videoCapability)}&contentCapability=${encodeURIComponent(contentCapability)}`;
            const response = yield fetch(uri, {
                method: 'POST',
            });
            const json = yield response.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            return json;
        });
    }
    updateAttendeeCapabilitiesExcept(attendees, audioCapability, videoCapability, contentCapability) {
        return __awaiter(this, void 0, void 0, function* () {
            const uri = `${DemoMeetingApp.BASE_URL}batch_update_attendee_capabilities_except?title=${encodeURIComponent(this.meeting)}&attendeeIds=${encodeURIComponent(attendees.join(','))}&audioCapability=${encodeURIComponent(audioCapability)}&videoCapability=${encodeURIComponent(videoCapability)}&contentCapability=${encodeURIComponent(contentCapability)}`;
            const response = yield fetch(uri, { method: 'POST' });
            const json = yield response.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            return json;
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
        if (!this.defaultBrowserBehavior.doesNotSupportMediaDeviceLabels()) {
            this.audioVideo.setDeviceLabelTrigger(() => __awaiter(this, void 0, void 0, function* () {
                if (this.isRecorder() || this.isBroadcaster() || this.isViewOnly) {
                    throw new Error('Recorder or Broadcaster does not need device labels');
                }
                this.switchToFlow('flow-need-permission');
                const stream = yield navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                this.switchToFlow('flow-devices');
                return stream;
            }));
        }
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
            option.value = devices[i].label ? devices[i].deviceId : '';
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
    populateVideoPreviewFilterList(elementId, genericName, filters) {
        const list = document.getElementById(elementId);
        while (list.firstElementChild) {
            list.removeChild(list.firstElementChild);
        }
        for (let i = 0; i < filters.length; i++) {
            const option = document.createElement('option');
            list.appendChild(option);
            option.text = filters[i] || `${genericName} ${i + 1}`;
            option.value = filters[i];
        }
        if (!list.firstElementChild) {
            const option = document.createElement('option');
            option.text = 'Filter selection unavailable';
            list.appendChild(option);
        }
    }
    populateInMeetingDeviceList(elementId, genericName, devices, additionalOptions, additionalToggles, callback) {
        const menu = document.getElementById(elementId);
        while (menu.firstElementChild) {
            menu.removeChild(menu.firstElementChild);
        }
        for (let i = 0; i < devices.length; i++) {
            this.createDropdownMenuItem(menu, devices[i].label || `${genericName} ${i + 1}`, () => {
                callback(devices[i].deviceId);
            });
        }
        if (additionalOptions.length) {
            this.createDropdownMenuItem(menu, '──────────', () => { }).classList.add('text-center');
            for (const additionalOption of additionalOptions) {
                this.createDropdownMenuItem(menu, additionalOption, () => {
                    callback(additionalOption);
                }, `${elementId}-${additionalOption.replace(/\s/g, '-')}`);
            }
        }
        if (additionalToggles === null || additionalToggles === void 0 ? void 0 : additionalToggles.length) {
            this.createDropdownMenuItem(menu, '──────────', () => { }).classList.add('text-center');
            for (const { name, oncreate, action } of additionalToggles) {
                const id = `toggle-${elementId}-${name.replace(/\s/g, '-')}`;
                const elem = this.createDropdownMenuItem(menu, name, action, id);
                oncreate(elem);
            }
        }
        if (!menu.firstElementChild) {
            this.createDropdownMenuItem(menu, 'Device selection unavailable', () => { });
        }
    }
    createDropdownMenuItem(menu, title, clickHandler, id) {
        const button = document.createElement('button');
        menu.appendChild(button);
        button.innerText = title;
        button.classList.add('dropdown-item');
        this.updateProperty(button, 'id', id);
        button.addEventListener('click', () => {
            clickHandler();
        });
        return button;
    }
    populateAllDeviceLists() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.populateAudioInputList();
            yield this.populateVideoInputList();
            yield this.populateAudioOutputList();
        });
    }
    selectVideoFilterByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.selectedVideoFilterItem = name;
            this.log(`clicking video filter ${this.selectedVideoFilterItem}`);
            this.toggleButton('button-video-filter', this.selectedVideoFilterItem === 'None' ? 'off' : 'on');
            if (this.isButtonOn('button-camera')) {
                try {
                    yield this.openVideoInputFromSelection(this.selectedVideoInput, false);
                }
                catch (err) {
                    exports.fatal(err);
                    this.log('Failed to choose VideoTransformDevice', err);
                }
            }
        });
    }
    stopVideoProcessor() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.log('Clearing filter variables and stopping the video transform device');
            this.chosenVideoFilter = 'None';
            this.selectedVideoFilterItem = 'None';
            (_a = this.chosenVideoTransformDevice) === null || _a === void 0 ? void 0 : _a.stop();
        });
    }
    getBackgroundBlurSpec() {
        return Object.assign({ paths: BACKGROUND_BLUR_PATHS, model: BACKGROUND_BLUR_MODEL }, BACKGROUND_BLUR_ASSET_SPEC);
    }
    populateVideoFilterInputList(isPreviewWindow) {
        return __awaiter(this, void 0, void 0, function* () {
            const genericName = 'Filter';
            let filters = ['None'];
            if (this.areVideoFiltersSupported()) {
                filters = filters.concat(VIDEO_FILTERS);
                if (SegmentationUtil_1.platformCanSupportBodyPixWithoutDegradation()) {
                    if (!this.loadingBodyPixDependencyPromise) {
                        this.loadingBodyPixDependencyPromise = SegmentationUtil_1.loadBodyPixDependency(this.loadingBodyPixDependencyTimeoutMs);
                    }
                    // do not use `await` to avoid blocking page loading
                    this.loadingBodyPixDependencyPromise
                        .then(() => {
                        filters.push('Segmentation');
                        this.populateFilterList(isPreviewWindow, genericName, filters);
                    })
                        .catch(err => {
                        this.log('Could not load BodyPix dependency', err);
                    });
                }
                if (this.supportsBackgroundBlur) {
                    filters.push('Background Blur 10% CPU');
                    filters.push('Background Blur 20% CPU');
                    filters.push('Background Blur 30% CPU');
                    filters.push('Background Blur 40% CPU');
                }
                if (this.supportsBackgroundReplacement) {
                    filters.push('Background Replacement');
                }
                // Add VideoFx functionality/options if the processor is supported
                if (this.supportsVideoFx) {
                    BACKGROUND_FILTER_V2_LIST.map(effectName => filters.push(effectName));
                }
            }
            this.populateFilterList(isPreviewWindow, genericName, filters);
        });
    }
    populateFilterList(isPreviewWindow, genericName, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isPreviewWindow) {
                this.populateVideoPreviewFilterList('video-input-filter', genericName, filters);
            }
            else {
                this.populateInMeetingDeviceList('dropdown-menu-filter', genericName, [], filters, undefined, (name) => __awaiter(this, void 0, void 0, function* () {
                    yield this.selectVideoFilterByName(name);
                }));
            }
        });
    }
    populateAudioInputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const genericName = 'Microphone';
            let additionalDevices = ['None', '440 Hz', 'Prerecorded Speech', 'Prerecorded Speech Loop (Mono)', 'Echo'];
            const additionalStereoTestDevices = ['L-500Hz R-1000Hz', 'Prerecorded Speech Loop (Stereo)'];
            const additionalToggles = [];
            if (!this.defaultBrowserBehavior.hasFirefoxWebRTC()) {
                // We don't add this in Firefox because there is no known mechanism, using MediaStream or WebAudio APIs,
                // to *not* generate audio in Firefox. By default, everything generates silent audio packets in Firefox.
                additionalDevices.push('No Audio');
            }
            // This can't work unless Web Audio is enabled.
            if (this.enableWebAudio && this.supportsVoiceFocus) {
                additionalToggles.push({
                    name: 'Amazon Voice Focus',
                    oncreate: (elem) => {
                        this.voiceFocusDisplayables.push(elem);
                    },
                    action: () => this.toggleVoiceFocusInMeeting(),
                });
            }
            // Don't allow replica meeting attendees to enable transcription even when promoted
            if (this.primaryExternalMeetingId === undefined || this.primaryExternalMeetingId.length === 0) {
                additionalToggles.push({
                    name: 'Live Transcription',
                    oncreate: (elem) => {
                        this.liveTranscriptionDisplayables.push(elem);
                    },
                    action: () => this.toggleLiveTranscription(),
                });
            }
            this.populateDeviceList('audio-input', genericName, yield this.audioVideo.listAudioInputDevices(), additionalDevices);
            if (this.usingStereoMusicAudioProfile) {
                additionalDevices = additionalDevices.concat(additionalStereoTestDevices);
            }
            this.populateInMeetingDeviceList('dropdown-menu-microphone', genericName, yield this.audioVideo.listAudioInputDevices(), additionalDevices, additionalToggles, (name) => __awaiter(this, void 0, void 0, function* () {
                yield this.selectAudioInputDeviceByName(name);
            }));
        });
    }
    areVideoFiltersSupported() {
        return this.defaultBrowserBehavior.supportsCanvasCapturedStreamPlayback();
    }
    isVoiceFocusActive() {
        return this.currentAudioInputDevice instanceof amazon_chime_sdk_js_1.VoiceFocusTransformDevice;
    }
    updateVoiceFocusDisplayState() {
        const active = this.isVoiceFocusActive();
        this.log('Updating Amazon Voice Focus display state:', active);
        for (const elem of this.voiceFocusDisplayables) {
            elem.classList.toggle('vf-active', active);
        }
    }
    showQuiz() {
        console.log('done');
        this.switchToFlow('quiz');
    }
    isVoiceFocusEnabled() {
        this.log('VF supported:', this.supportsVoiceFocus);
        this.log('VF enabled:', this.enableVoiceFocus);
        return this.supportsVoiceFocus && this.enableVoiceFocus;
    }
    reselectAudioInputDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            const current = this.currentAudioInputDevice;
            if (current instanceof amazon_chime_sdk_js_1.VoiceFocusTransformDevice) {
                // Unwrap and rewrap if Amazon Voice Focus is selected.
                const intrinsic = current.getInnerDevice();
                const device = yield this.audioInputSelectionWithOptionalVoiceFocus(intrinsic);
                return this.selectAudioInputDevice(device);
            }
            // If it's another kind of transform device, just reselect it.
            if (amazon_chime_sdk_js_1.isAudioTransformDevice(current)) {
                return this.selectAudioInputDevice(current);
            }
            // Otherwise, apply Amazon Voice Focus if needed.
            const device = yield this.audioInputSelectionWithOptionalVoiceFocus(current);
            return this.selectAudioInputDevice(device);
        });
    }
    toggleVoiceFocusInMeeting() {
        return __awaiter(this, void 0, void 0, function* () {
            const elem = document.getElementById('add-voice-focus');
            this.enableVoiceFocus = this.supportsVoiceFocus && !this.enableVoiceFocus;
            elem.checked = this.enableVoiceFocus;
            this.log('Amazon Voice Focus toggle is now', elem.checked);
            yield this.reselectAudioInputDevice();
        });
    }
    updateLiveTranscriptionDisplayState() {
        this.log('Updating live transcription display state to:', this.enableLiveTranscription);
        for (const elem of this.liveTranscriptionDisplayables) {
            elem.classList.toggle('live-transcription-active', this.enableLiveTranscription);
        }
    }
    toggleLiveTranscription() {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('live transcription were previously set to ' +
                this.enableLiveTranscription +
                '; attempting to toggle');
            if (this.enableLiveTranscription) {
                const response = yield fetch(`${DemoMeetingApp.BASE_URL}${encodeURIComponent('stop_transcription')}?title=${encodeURIComponent(this.meeting)}`, {
                    method: 'POST',
                });
                const json = yield response.json();
                if (json.error) {
                    throw new Error(`Server error: ${json.error}`);
                }
            }
            else {
                const liveTranscriptionModal = document.getElementById(`live-transcription-modal`);
                liveTranscriptionModal.style.display = 'block';
            }
        });
    }
    populateVideoInputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const genericName = 'Camera';
            const additionalDevices = ['None', 'Blue', 'SMPTE Color Bars'];
            this.populateDeviceList('video-input', genericName, yield this.audioVideo.listVideoInputDevices(), additionalDevices);
            this.populateInMeetingDeviceList('dropdown-menu-camera', genericName, yield this.audioVideo.listVideoInputDevices(), additionalDevices, undefined, (name) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // If video is already started sending or the video button is enabled, then reselect a new stream
                    // Otherwise, just update the device.
                    if (this.meetingSession.audioVideo.hasStartedLocalVideoTile()) {
                        yield this.openVideoInputFromSelection(name, false);
                    }
                    else {
                        this.selectedVideoInput = name;
                    }
                }
                catch (err) {
                    exports.fatal(err);
                }
            }));
            const cameras = yield this.audioVideo.listVideoInputDevices();
            this.cameraDeviceIds = cameras.map(deviceInfo => {
                return deviceInfo.deviceId;
            });
        });
    }
    populateAudioOutputList() {
        return __awaiter(this, void 0, void 0, function* () {
            const supportsChoosing = this.defaultBrowserBehavior.supportsSetSinkId();
            const genericName = 'Speaker';
            const additionalDevices = [];
            const devices = supportsChoosing ? yield this.audioVideo.listAudioOutputDevices() : [];
            this.populateDeviceList('audio-output', genericName, devices, additionalDevices);
            this.populateInMeetingDeviceList('dropdown-menu-speaker', genericName, devices, additionalDevices, undefined, (name) => __awaiter(this, void 0, void 0, function* () {
                if (!supportsChoosing) {
                    return;
                }
                try {
                    yield this.chooseAudioOutput(name);
                }
                catch (e) {
                    exports.fatal(e);
                    this.log('Failed to chooseAudioOutput', e);
                }
            }));
        });
    }
    chooseAudioOutput(device) {
        return __awaiter(this, void 0, void 0, function* () {
            // Set it for the content share stream if we can.
            const videoElem = document.getElementById('content-share-video');
            if (this.defaultBrowserBehavior.supportsSetSinkId()) {
                // @ts-ignore
                videoElem.setSinkId(device);
            }
            yield this.audioVideo.chooseAudioOutput(device);
        });
    }
    selectedAudioInput() {
        return __awaiter(this, void 0, void 0, function* () {
            const audioInput = document.getElementById('audio-input');
            const device = yield this.audioInputSelectionToDevice(audioInput.value);
            return device;
        });
    }
    selectAudioInputDevice(device) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentAudioInputDevice = device;
            this.log('Selecting audio input', device);
            try {
                yield this.audioVideo.startAudioInput(device);
            }
            catch (e) {
                exports.fatal(e);
                this.log(`failed to choose audio input device ${device}`, e);
            }
            this.updateVoiceFocusDisplayState();
        });
    }
    selectAudioInputDeviceByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log('Selecting audio input device by name:', name);
            const device = yield this.audioInputSelectionToDevice(name);
            return this.selectAudioInputDevice(device);
        });
    }
    openAudioInputFromSelection() {
        return __awaiter(this, void 0, void 0, function* () {
            const device = yield this.selectedAudioInput();
            yield this.selectAudioInputDevice(device);
        });
    }
    openAudioInputFromSelectionAndPreview() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.stopAudioPreview();
            yield this.openAudioInputFromSelection();
            this.log('Starting audio preview.');
            yield this.startAudioPreview();
        });
    }
    setAudioPreviewPercent(percent) {
        const audioPreview = document.getElementById('audio-preview');
        if (!audioPreview) {
            return;
        }
        this.updateProperty(audioPreview.style, 'transitionDuration', '33ms');
        this.updateProperty(audioPreview.style, 'width', `${percent}%`);
        if (audioPreview.getAttribute('aria-valuenow') !== `${percent}`) {
            audioPreview.setAttribute('aria-valuenow', `${percent}`);
        }
    }
    stopAudioPreview() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.analyserNode) {
                return;
            }
            this.analyserNodeCallback = undefined;
            // Disconnect the analyser node from its inputs and outputs.
            this.analyserNode.disconnect();
            this.analyserNode.removeOriginalInputs();
            this.analyserNode = undefined;
        });
    }
    startAudioPreview() {
        this.setAudioPreviewPercent(0);
        // Recreate.
        if (this.analyserNode) {
            // Disconnect the analyser node from its inputs and outputs.
            this.analyserNode.disconnect();
            this.analyserNode.removeOriginalInputs();
            this.analyserNode = undefined;
        }
        const analyserNode = this.audioVideo.createAnalyserNodeForAudioInput();
        if (!analyserNode) {
            return;
        }
        if (!analyserNode.getByteTimeDomainData) {
            document.getElementById('audio-preview').parentElement.style.visibility = 'hidden';
            return;
        }
        this.analyserNode = analyserNode;
        const data = new Uint8Array(analyserNode.fftSize);
        let frameIndex = 0;
        this.analyserNodeCallback = () => {
            if (frameIndex === 0) {
                analyserNode.getByteTimeDomainData(data);
                const lowest = 0.01;
                let max = lowest;
                for (const f of data) {
                    max = Math.max(max, (f - 128) / 128);
                }
                let normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
                let percent = Math.min(Math.max(normalized * 100, 0), 100);
                this.setAudioPreviewPercent(percent);
            }
            frameIndex = (frameIndex + 1) % 2;
            if (this.analyserNodeCallback) {
                requestAnimationFrame(this.analyserNodeCallback);
            }
        };
        requestAnimationFrame(this.analyserNodeCallback);
    }
    openAudioOutputFromSelection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.defaultBrowserBehavior.supportsSetSinkId()) {
                try {
                    const audioOutput = document.getElementById('audio-output');
                    yield this.chooseAudioOutput(audioOutput.value);
                }
                catch (e) {
                    exports.fatal(e);
                    this.log('failed to chooseAudioOutput', e);
                }
            }
            const audioMix = document.getElementById('meeting-audio');
            try {
                yield this.audioVideo.bindAudioElement(audioMix);
            }
            catch (e) {
                exports.fatal(e);
                this.log('failed to bindAudioElement', e);
            }
        });
    }
    openVideoInputFromSelection(selection, showPreview) {
        return __awaiter(this, void 0, void 0, function* () {
            this.selectedVideoInput = selection;
            this.log(`Switching to: ${this.selectedVideoInput}`);
            const device = yield this.videoInputSelectionToDevice(this.selectedVideoInput);
            if (device === null) {
                try {
                    yield this.audioVideo.stopVideoInput();
                }
                catch (e) {
                    exports.fatal(e);
                    this.log(`failed to stop video input`, e);
                }
                this.log('no video device selected');
                if (showPreview) {
                    const videoPreviewEl = document.getElementById('video-preview');
                    yield this.audioVideo.stopVideoPreviewForVideoInput(videoPreviewEl);
                }
            }
            else {
                try {
                    yield this.audioVideo.startVideoInput(device);
                }
                catch (e) {
                    exports.fatal(e);
                    this.log(`failed to start video input ${device}`, e);
                }
                if (showPreview) {
                    const videoPreviewEl = document.getElementById('video-preview');
                    this.audioVideo.startVideoPreviewForVideoInput(videoPreviewEl);
                }
            }
        });
    }
    audioInputSelectionToIntrinsicDevice(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRecorder() || this.isBroadcaster()) {
                return null;
            }
            if (value === '440 Hz') {
                return amazon_chime_sdk_js_1.DefaultDeviceController.synthesizeAudioDevice(440);
            }
            if (value === 'L-500Hz R-1000Hz') {
                return new DemoMediaStreamProviders_1.SynthesizedStereoMediaStreamProvider(500, 1000).getMediaStream();
            }
            if (value === 'Prerecorded Speech') {
                return new DemoMediaStreamProviders_1.AudioBufferMediaStreamProvider('audio_file').getMediaStream();
            }
            if (value === 'Prerecorded Speech Loop (Mono)') {
                return new DemoMediaStreamProviders_1.AudioBufferMediaStreamProvider('audio_file', /*shouldLoop*/ true).getMediaStream();
            }
            if (value === 'Prerecorded Speech Loop (Stereo)') {
                return new DemoMediaStreamProviders_1.AudioBufferMediaStreamProvider('stereo_audio_file', true).getMediaStream();
            }
            // use the speaker output MediaStream with a 50ms delay and a 20% volume reduction as audio input
            if (value === 'Echo') {
                try {
                    const speakerStream = yield this.audioVideo.getCurrentMeetingAudioStream();
                    const audioContext = amazon_chime_sdk_js_1.DefaultDeviceController.getAudioContext();
                    const streamDestination = audioContext.createMediaStreamDestination();
                    const audioSourceNode = audioContext.createMediaStreamSource(speakerStream);
                    const delayNode = audioContext.createDelay(0.05);
                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = 0.8;
                    // connect the AudioSourceNode, DelayNode and GainNode to the same output destination
                    audioSourceNode.connect(delayNode);
                    delayNode.connect(gainNode);
                    gainNode.connect(streamDestination);
                    return streamDestination.stream;
                }
                catch (e) {
                    this.log(`Error creating Echo`);
                    return null;
                }
            }
            if (value === 'No Audio') {
                // An empty media stream destination without any source connected to it, so it doesn't generate any audio.
                // This is currently only used for integration testing of 'sendingAudioFailed' and 'sendingAudioRecovered' events.
                // Note: It's currently not possible to emulate 'No Audio' in Firefox, so we don't provide it
                // as an option in the audio inputs list.
                return amazon_chime_sdk_js_1.DefaultDeviceController.getAudioContext().createMediaStreamDestination().stream;
            }
            if (value === 'None' || value === '') {
                // When the device is passed in as null, the SDK will synthesize an empty audio device that generates silence.
                return null;
            }
            return value;
        });
    }
    getVoiceFocusDeviceTransformer(maxComplexity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.voiceFocusTransformer) {
                return this.voiceFocusTransformer;
            }
            function exceeds(configured) {
                const max = Number.parseInt(maxComplexity.substring(1), 10);
                const complexity = Number.parseInt(configured.substring(1), 10);
                return complexity > max;
            }
            const logger = new amazon_chime_sdk_js_1.ConsoleLogger('SDK', amazon_chime_sdk_js_1.LogLevel.DEBUG);
            // Find out what it will actually execute, and cap it if needed.
            const spec = getVoiceFocusSpec(this.joinInfo);
            const config = yield amazon_chime_sdk_js_1.VoiceFocusDeviceTransformer.configure(spec, { logger });
            let transformer;
            if (maxComplexity && config.supported && exceeds(config.model.variant)) {
                logger.info(`Downgrading VF to ${maxComplexity}`);
                spec.variant = maxComplexity;
                transformer = amazon_chime_sdk_js_1.VoiceFocusDeviceTransformer.create(spec, { logger }, undefined, this.joinInfo);
            }
            else {
                transformer = amazon_chime_sdk_js_1.VoiceFocusDeviceTransformer.create(spec, { logger }, config, this.joinInfo);
            }
            return this.voiceFocusTransformer = yield transformer;
        });
    }
    createVoiceFocusDevice(inner) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.supportsVoiceFocus) {
                return inner;
            }
            if (this.voiceFocusDevice) {
                // Dismantle the old one.
                return (this.voiceFocusDevice = yield this.voiceFocusDevice.chooseNewInnerDevice(inner));
            }
            try {
                const transformer = yield this.getVoiceFocusDeviceTransformer(MAX_VOICE_FOCUS_COMPLEXITY);
                const vf = yield transformer.createTransformDevice(inner);
                if (vf) {
                    yield vf.observeMeetingAudio(this.audioVideo);
                    return this.voiceFocusDevice = vf;
                }
            }
            catch (e) {
                // Fall through.
            }
            return inner;
        });
    }
    audioInputSelectionWithOptionalVoiceFocus(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isVoiceFocusEnabled()) {
                if (!this.voiceFocusDevice) {
                    return this.createVoiceFocusDevice(device);
                }
                // Switch out the inner if needed.
                // The reuse of the Voice Focus device is more efficient, particularly if
                // reselecting the same inner -- no need to modify the Web Audio graph.
                // Allowing the Voice Focus device to manage toggling Voice Focus on and off
                // also
                return (this.voiceFocusDevice = yield this.voiceFocusDevice.chooseNewInnerDevice(device));
            }
            return device;
        });
    }
    audioInputSelectionToDevice(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const inner = yield this.audioInputSelectionToIntrinsicDevice(value);
            return this.audioInputSelectionWithOptionalVoiceFocus(inner);
        });
    }
    videoInputSelectionToIntrinsicDevice(value) {
        if (value === 'Blue') {
            return SyntheticVideoDeviceFactory_1.default.create('blue');
        }
        if (value === 'SMPTE Color Bars') {
            return SyntheticVideoDeviceFactory_1.default.create('smpte');
        }
        return value;
    }
    videoFilterToProcessor(videoFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log(`Choosing video filter ${videoFilter}`);
            if (videoFilter === 'Emojify') {
                return new EmojifyVideoFrameProcessor_1.default('🚀');
            }
            if (videoFilter === 'CircularCut') {
                return new CircularCut_1.default();
            }
            if (videoFilter === 'NoOp') {
                return new amazon_chime_sdk_js_1.NoOpVideoFrameProcessor();
            }
            if (videoFilter === 'Segmentation') {
                return new SegmentationProcessor_1.default();
            }
            if (videoFilter === 'Resize (9/16)') {
                return new ResizeProcessor_1.default(0.5625); // 16/9 Aspect Ratio
            }
            if (BACKGROUND_BLUR_V1_LIST.includes(videoFilter)) {
                // In the event that frames start being dropped we should take some action to remove the background blur.
                this.blurObserver = {
                    filterFrameDurationHigh: event => {
                        this.log(`background filter duration high: framed dropped - ${event.framesDropped}, avg - ${event.avgFilterDurationMillis} ms, frame rate - ${event.framerate}, period - ${event.periodMillis} ms`);
                    },
                    filterCPUUtilizationHigh: event => {
                        this.log(`background filter CPU utilization high: ${event.cpuUtilization}%`);
                    },
                };
                const cpuUtilization = Number(videoFilter.match(/([0-9]{2})%/)[1]);
                this.blurProcessor = yield amazon_chime_sdk_js_1.BackgroundBlurVideoFrameProcessor.create(this.getBackgroundBlurSpec(), { filterCPUUtilization: cpuUtilization });
                this.blurProcessor.addObserver(this.blurObserver);
                return this.blurProcessor;
            }
            if (BACKGROUND_REPLACEMENT_V1_LIST.includes(videoFilter)) {
                // In the event that frames start being dropped we should take some action to remove the background replacement.
                this.replacementObserver = {
                    filterFrameDurationHigh: event => {
                        this.log(`background filter duration high: framed dropped - ${event.framesDropped}, avg - ${event.avgFilterDurationMillis} ms, frame rate - ${event.framerate}, period - ${event.periodMillis} ms`);
                    },
                };
                this.replacementProcessor = yield amazon_chime_sdk_js_1.BackgroundReplacementVideoFrameProcessor.create(this.getBackgroundBlurSpec(), yield this.getBackgroundReplacementOptions());
                this.replacementProcessor.addObserver(this.replacementObserver);
                return this.replacementProcessor;
            }
            // Create a VideoFxProcessor
            if (BACKGROUND_FILTER_V2_LIST.includes(videoFilter)) {
                const defaultBudgetPerFrame = 50;
                this.updateFxConfig(videoFilter);
                try {
                    this.videoFxProcessor = yield amazon_chime_sdk_js_1.VideoFxProcessor.create(this.meetingLogger, this.videoFxConfig, defaultBudgetPerFrame);
                    return this.videoFxProcessor;
                }
                catch (error) {
                    this.meetingLogger.warn(error.toString());
                    return new amazon_chime_sdk_js_1.NoOpVideoFrameProcessor();
                }
            }
            return null;
        });
    }
    /**
     * Update this.videoFxConfig to match the corresponding configuration specified by the videoFilter.
     * @param videoFilter
     */
    updateFxConfig(videoFilter) {
        this.videoFxConfig.backgroundBlur.isEnabled = (videoFilter === 'Background Blur 2.0 - Low' ||
            videoFilter === 'Background Blur 2.0 - Medium' ||
            videoFilter === 'Background Blur 2.0 - High');
        this.videoFxConfig.backgroundReplacement.isEnabled = (videoFilter === 'Background Replacement 2.0 - (Beach)' ||
            videoFilter === 'Background Replacement 2.0 - (Default)' ||
            videoFilter === 'Background Replacement 2.0 - (Blue)');
        switch (videoFilter) {
            case 'Background Blur 2.0 - Low':
                this.videoFxConfig.backgroundBlur.strength = 'low';
                break;
            case 'Background Blur 2.0 - Medium':
                this.videoFxConfig.backgroundBlur.strength = 'medium';
                break;
            case 'Background Blur 2.0 - High':
                this.videoFxConfig.backgroundBlur.strength = 'high';
                break;
            case 'Background Replacement 2.0 - (Beach)':
                this.videoFxConfig.backgroundReplacement.backgroundImageURL = BackgroundImage_1.BackgroundImageEncoding();
                this.videoFxConfig.backgroundReplacement.defaultColor = null;
                break;
            case 'Background Replacement 2.0 - (Default)':
                this.videoFxConfig.backgroundReplacement.backgroundImageURL = null;
                this.videoFxConfig.backgroundReplacement.defaultColor = '#000000';
                break;
            case 'Background Replacement 2.0 - (Blue)':
                this.videoFxConfig.backgroundReplacement.backgroundImageURL = null;
                this.videoFxConfig.backgroundReplacement.defaultColor = '#26A4FF';
                break;
        }
    }
    videoInputSelectionWithOptionalFilter(innerDevice) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.selectedVideoFilterItem === 'None') {
                return innerDevice;
            }
            // We have reselected our filter, don't need to make a new processor
            if (this.chosenVideoTransformDevice &&
                this.selectedVideoFilterItem === this.chosenVideoFilter) {
                // Our input device has changed, so swap it out for the new one
                if (this.chosenVideoTransformDevice.getInnerDevice() !== innerDevice) {
                    this.chosenVideoTransformDevice = this.chosenVideoTransformDevice.chooseNewInnerDevice(innerDevice);
                }
                return this.chosenVideoTransformDevice;
            }
            // A different filter is selected so we must modify our processor
            if (this.chosenVideoTransformDevice) {
                yield this.chosenVideoTransformDevice.stop();
            }
            const proc = yield this.videoFilterToProcessor(this.selectedVideoFilterItem);
            this.chosenVideoFilter = this.selectedVideoFilterItem;
            this.chosenVideoTransformDevice = new amazon_chime_sdk_js_1.DefaultVideoTransformDevice(this.meetingLogger, innerDevice, [proc]);
            return this.chosenVideoTransformDevice;
        });
    }
    videoInputSelectionToDevice(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRecorder() || this.isBroadcaster() || value === 'None' || value === null) {
                return null;
            }
            const intrinsicDevice = this.videoInputSelectionToIntrinsicDevice(value);
            return yield this.videoInputSelectionWithOptionalFilter(intrinsicDevice);
        });
    }
    isRecorder() {
        return new URL(window.location.href).searchParams.get('record') === 'true';
    }
    isBroadcaster() {
        return new URL(window.location.href).searchParams.get('broadcast') === 'true';
    }
    isAbortingOnReconnect() {
        return new URL(window.location.href).searchParams.get('abort-on-reconnect') === 'true';
    }
    authenticate() {
        return __awaiter(this, void 0, void 0, function* () {
            this.joinInfo = (yield this.sendJoinRequest(this.meeting, this.name, this.region, this.primaryExternalMeetingId, this.audioCapability, this.videoCapability, this.contentCapability)).JoinInfo;
            this.region = this.joinInfo.Meeting.Meeting.MediaRegion;
            const configuration = new amazon_chime_sdk_js_1.MeetingSessionConfiguration(this.joinInfo.Meeting, this.joinInfo.Attendee);
            yield this.initializeMeetingSession(configuration);
            this.primaryExternalMeetingId = this.joinInfo.PrimaryExternalMeetingId;
            const url = new URL(window.location.href);
            url.searchParams.set('m', this.meeting);
            history.replaceState({}, `${this.meeting}`, url.toString());
            return configuration.meetingId;
        });
    }
    initAttendeeCapabilityFeature() {
        return __awaiter(this, void 0, void 0, function* () {
            const rosterMenuContainer = document.getElementById('roster-menu-container');
            if (this.allowAttendeeCapabilities) {
                rosterMenuContainer.classList.remove('hidden');
                rosterMenuContainer.classList.add('d-flex');
                const attendeeCapabilitiesModal = document.getElementById('attendee-capabilities-modal');
                attendeeCapabilitiesModal.addEventListener('show.bs.modal', (event) => __awaiter(this, void 0, void 0, function* () {
                    const button = event.relatedTarget;
                    const type = button.getAttribute('data-bs-type');
                    const descriptionElement = document.getElementById('attendee-capabilities-modal-description');
                    const audioSelectElement = document.getElementById('attendee-capabilities-modal-audio-select');
                    const videoSelectElement = document.getElementById('attendee-capabilities-modal-video-select');
                    const contentSelectElement = document.getElementById('attendee-capabilities-modal-content-select');
                    audioSelectElement.value = '';
                    videoSelectElement.value = '';
                    contentSelectElement.value = '';
                    audioSelectElement.disabled = true;
                    videoSelectElement.disabled = true;
                    contentSelectElement.disabled = true;
                    // Clone the `selectedAttendeeSet` upon selecting the menu option to open a modal.
                    // Note that the `selectedAttendeeSet` may change when API calls are made.
                    const selectedAttendeeSet = new Set(this.roster.selectedAttendeeSet);
                    if (type === 'one-attendee') {
                        const [selectedAttendee] = selectedAttendeeSet;
                        descriptionElement.innerHTML = `Update <b>${selectedAttendee.name}</b>'s attendee capabilities.`;
                        // Load the selected attendee's capabilities.
                        const { Attendee } = yield this.getAttendee(selectedAttendee.id);
                        audioSelectElement.value = Attendee.Capabilities.Audio;
                        videoSelectElement.value = Attendee.Capabilities.Video;
                        contentSelectElement.value = Attendee.Capabilities.Content;
                    }
                    else {
                        if (this.roster.selectedAttendeeSet.size === 0) {
                            descriptionElement.innerHTML = `Update the capabilities of all attendees.`;
                        }
                        else {
                            descriptionElement.innerHTML = `Update the capabilities of all attendees, excluding:<ul> ${[
                                ...selectedAttendeeSet,
                            ]
                                .map(attendee => `<li><b>${attendee.name}</b></li>`)
                                .join('')}</ul>`;
                        }
                        audioSelectElement.value = 'SendReceive';
                        videoSelectElement.value = 'SendReceive';
                        contentSelectElement.value = 'SendReceive';
                    }
                    audioSelectElement.disabled = false;
                    videoSelectElement.disabled = false;
                    contentSelectElement.disabled = false;
                    const saveButton = document.getElementById('attendee-capabilities-save-button');
                    const onClickSaveButton = () => __awaiter(this, void 0, void 0, function* () {
                        saveButton.removeEventListener('click', onClickSaveButton);
                        bootstrap_1.Modal.getInstance(attendeeCapabilitiesModal).hide();
                        this.roster.unselectAll();
                        try {
                            if (type === 'one-attendee') {
                                const [selectedAttendee] = selectedAttendeeSet;
                                yield this.updateAttendeeCapabilities(selectedAttendee.id, audioSelectElement.value, videoSelectElement.value, contentSelectElement.value);
                            }
                            else {
                                yield this.updateAttendeeCapabilitiesExcept([...selectedAttendeeSet].map(attendee => attendee.id), audioSelectElement.value, videoSelectElement.value, contentSelectElement.value);
                            }
                        }
                        catch (error) {
                            console.error(error);
                            const toastContainer = document.getElementById('toast-container');
                            const toast = document.createElement('meeting-toast');
                            toastContainer.appendChild(toast);
                            toast.message = `Failed to update attendee capabilities. Please be aware that you can't set content capabilities to "SendReceive" or "Receive" unless you set video capabilities to "SendReceive" or "Receive". Refer to the Amazon Chime SDK guide and the console for additional information.`;
                            toast.delay = '15000';
                            toast.show();
                            const onHidden = () => {
                                toast.removeEventListener('hidden.bs.toast', onHidden);
                                toastContainer.removeChild(toast);
                            };
                            toast.addEventListener('hidden.bs.toast', onHidden);
                        }
                    });
                    saveButton.addEventListener('click', onClickSaveButton);
                    attendeeCapabilitiesModal.addEventListener('hide.bs.modal', () => __awaiter(this, void 0, void 0, function* () {
                        saveButton.removeEventListener('click', onClickSaveButton);
                    }));
                }));
            }
            else {
                rosterMenuContainer.classList.add('hidden');
                rosterMenuContainer.classList.remove('d-flex');
            }
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    log(str, ...args) {
        console.log.apply(console, [`[DEMO] ${str}`, ...args]);
    }
    audioVideoDidStartConnecting(reconnecting) {
        this.log(`session connecting. reconnecting: ${reconnecting}`);
        if (reconnecting && this.isAbortingOnReconnect()) {
            exports.fatal(Error('reconnect occured with abort-on-reconnect set to true'));
        }
    }
    audioVideoDidStart() {
        this.log('session started');
    }
    audioVideoDidStop(sessionStatus) {
        this.log(`session stopped from ${JSON.stringify(sessionStatus)}`);
        if (this.behaviorAfterLeave === 'nothing') {
            return;
        }
        this.log(`resetting stats`);
        this.resetStats();
        const returnToStart = () => {
            switch (this.behaviorAfterLeave) {
                case 'spa':
                    this.switchToFlow('flow-authenticate');
                    break;
                case 'reload':
                    window.location.href = window.location.pathname;
                    break;
                // This is useful for testing memory leaks.
                case 'halt': {
                    // Wait a moment to make sure cleanup is done.
                    setTimeout(() => {
                        // Kill all references to code and content.
                        // @ts-ignore
                        window.app = undefined;
                        // @ts-ignore
                        window.app_meetingV2 = undefined;
                        // @ts-ignore
                        window.webpackHotUpdateapp_meetingV2 = undefined;
                        document.getElementsByTagName('body')[0].innerHTML = '<b>Gone</b>';
                        this.removeFatalHandlers();
                    }, 2000);
                    break;
                }
            }
        };
        /**
         * This is approximately the inverse of the initialization method above.
         * This work only needs to be done if you want to continue using the page; if
         * your app navigates away or closes the tab when done, you can let the browser
         * clean up.
         */
        const cleanUpResources = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _f, _g, _h, _j, _k;
            // Clean up the timers for this.
            this.audioVideo.unsubscribeFromActiveSpeakerDetector(this.activeSpeakerHandler);
            // Stop listening to attendee presence.
            this.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(this.attendeeIdPresenceHandler);
            // Stop listening to transcript events.
            (_a = this.audioVideo.transcriptionController) === null || _a === void 0 ? void 0 : _a.unsubscribeFromTranscriptEvent(this.transcriptEventHandler);
            this.audioVideo.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(this.muteAndUnmuteLocalAudioHandler);
            this.audioVideo.realtimeUnsubscribeToSetCanUnmuteLocalAudio(this.canUnmuteLocalAudioHandler);
            this.audioVideo.realtimeUnsubscribeFromReceiveDataMessage(DemoMeetingApp.DATA_MESSAGE_TOPIC);
            // Stop watching device changes in the UI.
            this.audioVideo.removeDeviceChangeObserver(this);
            // Stop content share and local video.
            this.audioVideo.stopLocalVideoTile();
            yield this.contentShare.stop();
            // Drop the audio output.
            this.audioVideo.unbindAudioElement();
            yield this.deviceController.destroy();
            // remove blur event observer
            (_b = this.blurProcessor) === null || _b === void 0 ? void 0 : _b.removeObserver(this.blurObserver);
            // remove replacement event observer
            (_c = this.replacementProcessor) === null || _c === void 0 ? void 0 : _c.removeObserver(this.replacementObserver);
            // Stop any video processor.
            yield ((_d = this.chosenVideoTransformDevice) === null || _d === void 0 ? void 0 : _d.stop());
            // Stop Voice Focus.
            yield ((_f = this.voiceFocusDevice) === null || _f === void 0 ? void 0 : _f.stop());
            // Clean up the loggers so they don't keep their `onload` listeners around.
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                var _l, _m;
                yield ((_l = this.meetingEventPOSTLogger) === null || _l === void 0 ? void 0 : _l.destroy());
                yield ((_m = this.meetingSessionPOSTLogger) === null || _m === void 0 ? void 0 : _m.destroy());
            }), 500);
            if (amazon_chime_sdk_js_1.isDestroyable(this.eventReporter)) {
                (_g = this.eventReporter) === null || _g === void 0 ? void 0 : _g.destroy();
            }
            yield ((_h = this.blurProcessor) === null || _h === void 0 ? void 0 : _h.destroy());
            yield ((_j = this.replacementProcessor) === null || _j === void 0 ? void 0 : _j.destroy());
            this.audioVideo = undefined;
            this.voiceFocusDevice = undefined;
            this.meetingSession = undefined;
            this.activeSpeakerHandler = undefined;
            this.currentAudioInputDevice = undefined;
            this.eventReporter = undefined;
            this.blurProcessor = undefined;
            this.replacementProcessor = undefined;
            // Cleanup VideoFxProcessor
            (_k = this.videoFxProcessor) === null || _k === void 0 ? void 0 : _k.destroy();
            this.videoFxProcessor = undefined;
        });
        const onLeftMeeting = () => __awaiter(this, void 0, void 0, function* () {
            yield cleanUpResources();
            returnToStart();
        });
        if (sessionStatus.statusCode() === amazon_chime_sdk_js_1.MeetingSessionStatusCode.MeetingEnded) {
            this.log(`meeting ended`);
            onLeftMeeting();
            return;
        }
        if (sessionStatus.statusCode() === amazon_chime_sdk_js_1.MeetingSessionStatusCode.Left) {
            this.log('left meeting');
            onLeftMeeting();
            return;
        }
    }
    audioVideoWasDemotedFromPrimaryMeeting(status) {
        const message = `Was demoted from primary meeting with status ${status.toString()}`;
        this.log(message);
        this.updateUXForReplicaMeetingPromotionState('demoted');
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('meeting-toast');
        toastContainer.appendChild(toast);
        toast.message = message;
        toast.addButton('Retry Promotion', () => {
            this.promoteToPrimaryMeeting();
        });
        toast.show();
    }
    videoAvailabilityDidChange(availability) {
        const didChange = this.canStartLocalVideo !== availability.canStartLocalVideo;
        this.canStartLocalVideo = availability.canStartLocalVideo;
        this.log(`video availability changed: canStartLocalVideo  ${availability.canStartLocalVideo}`);
        if (didChange && !this.meetingSession.audioVideo.hasStartedLocalVideoTile()) {
            if (!this.canStartLocalVideo) {
                this.enableLocalVideoButton(false, 'Can no longer enable local video in conference.');
            }
            else {
                // Enable ability to press button again
                this.enableLocalVideoButton(true, 'You can now enable local video in conference.');
            }
        }
    }
    enableLocalVideoButton(enabled, warningMessage = '') {
        this.toggleButton('button-camera', enabled ? 'off' : 'disabled');
        if (warningMessage) {
            const toastContainer = document.getElementById('toast-container');
            const toast = document.createElement('meeting-toast');
            toastContainer.appendChild(toast);
            toast.message = warningMessage;
            toast.show();
        }
    }
    redirectFromAuthentication(quickjoin = false) {
        this.meeting = document.getElementById('inputMeeting').value;
        this.name = document.getElementById('inputName').value;
        this.region = document.getElementById('inputRegion').value;
        this.enableSimulcast = document.getElementById('simulcast').checked;
        this.enableEventReporting = document.getElementById('event-reporting').checked;
        this.deleteOwnAttendeeToLeave = document.getElementById('delete-attendee').checked;
        this.disablePeriodicKeyframeRequestOnContentSender = document.getElementById('disable-content-keyframe').checked;
        this.allowAttendeeCapabilities = document.getElementById('allow-attendee-capabilities').checked;
        this.enableWebAudio = document.getElementById('webaudio').checked;
        this.usePriorityBasedDownlinkPolicy = document.getElementById('priority-downlink-policy').checked;
        this.echoReductionCapability = document.getElementById('echo-reduction-capability').checked;
        this.primaryExternalMeetingId = document.getElementById('primary-meeting-external-id').value;
        const chosenLogLevel = document.getElementById('logLevelSelect').value;
        switch (chosenLogLevel) {
            case 'info':
                this.logLevel = amazon_chime_sdk_js_1.LogLevel.INFO;
                break;
            case 'debug':
                this.logLevel = amazon_chime_sdk_js_1.LogLevel.DEBUG;
                break;
            case 'warn':
                this.logLevel = amazon_chime_sdk_js_1.LogLevel.WARN;
                break;
            case 'error':
                this.logLevel = amazon_chime_sdk_js_1.LogLevel.ERROR;
                break;
            default:
                this.logLevel = amazon_chime_sdk_js_1.LogLevel.OFF;
                break;
        }
        const chosenVideoSendCodec = document.getElementById('videoCodecSelect')
            .value;
        switch (chosenVideoSendCodec) {
            case 'vp8':
                this.videoCodecPreferences = [amazon_chime_sdk_js_1.VideoCodecCapability.vp8()];
                break;
            case 'h264ConstrainedBaselineProfile':
                // If `h264ConstrainedBaselineProfile` is explicitly selected, include VP8 as fallback
                this.videoCodecPreferences = [
                    amazon_chime_sdk_js_1.VideoCodecCapability.h264ConstrainedBaselineProfile(),
                    amazon_chime_sdk_js_1.VideoCodecCapability.vp8(),
                ];
                break;
            default:
                // If left on 'Meeting Default', use the existing behavior when `setVideoCodecSendPreferences` is not called
                // which should be equivalent to `this.videoCodecPreferences = [VideoCodecCapability.h264ConstrainedBaselineProfile()]`
                break;
        }
        this.audioCapability = document.getElementById('audioCapabilitySelect').value;
        this.videoCapability = document.getElementById('videoCapabilitySelect').value;
        this.contentCapability = document.getElementById('contentCapabilitySelect').value;
        amazon_chime_sdk_js_1.AsyncScheduler.nextTick(() => __awaiter(this, void 0, void 0, function* () {
            let chimeMeetingId = '';
            this.showProgress('progress-authenticate');
            try {
                chimeMeetingId = yield this.authenticate();
            }
            catch (error) {
                console.error(error);
                const httpErrorMessage = 'UserMedia is not allowed in HTTP sites. Either use HTTPS or enable media capture on insecure sites.';
                document.getElementById('failed-meeting').innerText = `Meeting ID: ${this.meeting}`;
                document.getElementById('failed-meeting-error').innerText =
                    window.location.protocol === 'http:' ? httpErrorMessage : error.message;
                this.switchToFlow('flow-failed-meeting');
                return;
            }
            document.getElementById('meeting-id').innerText = `${this.meeting} (${this.region})`;
            document.getElementById('chime-meeting-id').innerText = `Meeting ID: ${chimeMeetingId}`;
            document.getElementById('mobile-chime-meeting-id').innerText = `Meeting ID: ${chimeMeetingId}`;
            document.getElementById('mobile-attendee-id').innerText = `Attendee ID: ${this.meetingSession.configuration.credentials.attendeeId}`;
            document.getElementById('desktop-attendee-id').innerText = `Attendee ID: ${this.meetingSession.configuration.credentials.attendeeId}`;
            document.getElementById('info-meeting').innerText = this.meeting;
            document.getElementById('info-name').innerText = this.name;
            if (this.isViewOnly) {
                this.updateUXForViewOnlyMode();
                yield this.skipDeviceSelection(false);
                return;
            }
            yield this.initVoiceFocus();
            yield this.initBackgroundBlur();
            yield this.initBackgroundReplacement();
            yield this.initAttendeeCapabilityFeature();
            yield this.resolveSupportsVideoFX();
            yield this.populateAllDeviceLists();
            yield this.populateVideoFilterInputList(false);
            yield this.populateVideoFilterInputList(true);
            if (this.enableSimulcast) {
                const videoInputQuality = document.getElementById('video-input-quality');
                videoInputQuality.value = '720p';
                this.audioVideo.chooseVideoInputQuality(1280, 720, 15);
                videoInputQuality.disabled = true;
            }
            // `this.primaryExternalMeetingId` may by the join request
            const buttonPromoteToPrimary = document.getElementById('button-promote-to-primary');
            if (!this.primaryExternalMeetingId) {
                buttonPromoteToPrimary.style.display = 'none';
            }
            else {
                this.setButtonVisibility('button-record-cloud', false);
                this.updateUXForReplicaMeetingPromotionState('demoted');
            }
            if (quickjoin) {
                yield this.skipDeviceSelection();
                this.displayButtonStates();
                return;
            }
            this.switchToFlow('flow-devices');
            yield this.openAudioInputFromSelectionAndPreview();
            try {
                yield this.openVideoInputFromSelection(document.getElementById('video-input').value, true);
            }
            catch (err) {
                exports.fatal(err);
            }
            yield this.openAudioOutputFromSelection();
            this.hideProgress('progress-authenticate');
            // Open the signaling connection while the user is checking their input devices.
            const preconnect = document.getElementById('preconnect');
            if (preconnect.checked) {
                if (this.joinMuted) {
                    this.audioVideo.realtimeMuteLocalAudio();
                }
                this.audioVideo.start({ signalingOnly: true });
            }
        }));
    }
    // to call from form-authenticate form
    skipDeviceSelection(autoSelectAudioInput = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (autoSelectAudioInput) {
                yield this.openAudioInputFromSelection();
            }
            yield this.openAudioOutputFromSelection();
            yield this.join();
            this.switchToFlow('flow-meeting');
            this.hideProgress('progress-authenticate');
        });
    }
    allowMaxContentShare() {
        const allowed = new URL(window.location.href).searchParams.get('max-content-share') === 'true';
        if (allowed) {
            return true;
        }
        return false;
    }
    connectionDidBecomePoor() {
        this.log('connection is poor');
    }
    connectionDidSuggestStopVideo() {
        this.log('suggest turning the video off');
    }
    connectionDidBecomeGood() {
        this.log('connection is good now');
    }
    videoSendDidBecomeUnavailable() {
        this.log('sending video is not available');
        this.enableLocalVideoButton(false, 'Cannot enable local video due to call being at capacity');
    }
    contentShareDidStart() {
        this.toggleButton('button-content-share', 'on');
    }
    contentShareDidStop() {
        this.toggleButton('button-content-share', 'off');
    }
    encodingSimulcastLayersDidChange(simulcastLayers) {
        this.log(`current active simulcast layers changed to: ${SimulcastLayerMapping[simulcastLayers]}`);
    }
    tileWillBePausedByDownlinkPolicy(tileId) {
        this.log(`Tile ${tileId} will be paused due to insufficient bandwidth`);
        this.videoTileCollection.bandwidthConstrainedTiles.add(tileId);
    }
    tileWillBeUnpausedByDownlinkPolicy(tileId) {
        this.log(`Tile ${tileId} will be resumed due to sufficient bandwidth`);
        this.videoTileCollection.bandwidthConstrainedTiles.delete(tileId);
    }
}
exports.DemoMeetingApp = DemoMeetingApp;
DemoMeetingApp.DID = '+17035550122';
DemoMeetingApp.BASE_URL = [
    location.protocol,
    '//',
    location.host,
    location.pathname.replace(/\/*$/, '/').replace('/v2', ''),
].join('');
DemoMeetingApp.testVideo = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.360p.vp9.webm';
DemoMeetingApp.MAX_MEETING_HISTORY_MS = 5 * 60 * 1000;
DemoMeetingApp.DATA_MESSAGE_TOPIC = 'chat';
DemoMeetingApp.DATA_MESSAGE_LIFETIME_MS = 300000;
window.addEventListener('load', () => {
    new DemoMeetingApp();
});
window.addEventListener('click', event => {
    const liveTranscriptionModal = document.getElementById('live-transcription-modal');
    if (event.target === liveTranscriptionModal) {
        liveTranscriptionModal.style.display = 'none';
    }
});
const defaultQuizAttempt = {
    _id: "",
    quiz_id: "",
    timestamp: new Date().toISOString(),
    user_id: localStorage.getItem('user_id') || "",
    score: 0,
    correct: [],
    incorrect: [], // Similarly, this asserts that 'incorrect' is an array of strings.
};
// *****************
// DREW FUNCTIONS
// FUNCTION 1 - SUBMIT QUIZ ATTEMPTS
function submitQuizAttempts() {
    const url = "https://app.larq.ai/api/MakeQuizAttempt";
    const storedData = localStorage.getItem('QuizAttempts');
    const QuizAttempts = storedData ? JSON.parse(storedData) : defaultQuizAttempt;
    console.log("QuizAttempts to sent to larq API:", QuizAttempts);
    const totalQuestions = QuizAttempts.correct.length + QuizAttempts.incorrect.length;
    QuizAttempts.score = QuizAttempts.correct.length / totalQuestions;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(QuizAttempts)
    }).then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Server responded with status ${response.status}: ${text}`);
            });
        }
        console.log("Quiz attempt submitted successfully.");
    });
}
// DREW FUNCTION VARIABLES
const userId = localStorage.getItem('user_id') || '';
const existingAttempts = localStorage.getItem('QuizAttempts');
const QuizAttempts = existingAttempts
    ? JSON.parse(existingAttempts)
    : {
        quiz_id: '',
        timestamp: new Date().toISOString(),
        user_id: userId,
        score: 0,
        correct: [],
        incorrect: []
    };
// FUNCTION 1 - CLEAR PREVIOUS QUESTIONS
function clearPreviousQuestions() {
    const questionBlock = document.getElementById("quiz-taker-question");
    const answerBlock = document.getElementById("quiz-taker-answers");
    if (questionBlock && answerBlock) {
        questionBlock.innerHTML = "";
        answerBlock.innerHTML = "";
    }
}
// FUNCTION 2 - DISPLAY QUESTIONS IN QUIZ HANDLER
function displayQuestion(index, data) {
    clearPreviousQuestions(); // Clear previous question and answers
    const question = data.fields[index];
    if (question.type === "dropdown") {
        document.getElementById("quiz-taker-question").textContent = question.label;
        const answersContainer = document.getElementById("quiz-taker-answers");
        question.options.forEach((option, optionIndex) => {
            const radioDiv = document.createElement("div");
            radioDiv.className = "form-check form-check-inline radioBox";
            const input = document.createElement("input");
            input.type = "radio";
            input.id = `answer_${index}_${optionIndex}`;
            input.name = `question_${index}`;
            input.addEventListener("change", () => {
                const correctAnswer = question.correct_answer;
                if (option === correctAnswer) {
                    // push correct answer to QuizAttempts, unless it's already there
                    if (!QuizAttempts.correct.includes(index)) {
                        QuizAttempts.correct.push(index);
                    }
                    radioDiv.className = "form-check form-check-inline radioBox correct-answer"; // Highlight correct answer with green outline
                }
                else {
                    if (!QuizAttempts.incorrect.includes(index)) {
                        QuizAttempts.incorrect.push(index);
                    }
                }
            });
            const label = document.createElement("label");
            label.className = "form-check-label";
            label.setAttribute("for", input.id);
            label.textContent = option;
            radioDiv.appendChild(input);
            radioDiv.appendChild(label);
            answersContainer.appendChild(radioDiv);
        });
    }
}
// FUNCTION 3 - POPULATE THE QUIZ HANDLER
function populateQuiz(dataString) {
    const data = JSON.parse(dataString);
    document.getElementById("quiz-form-title").textContent = data.title;
    document.getElementById("quiz-taker-title").textContent = data.title;
    // Clear previous question
    const questionBlock = document.getElementById("quiz-taker-question");
    const answerBlock = document.getElementById("quiz-taker-answers");
    answerBlock.innerHTML = "";
    if (questionBlock && answerBlock) {
        questionBlock.innerHTML = "";
        answerBlock.innerHTML = "";
    }
    data.fields.forEach((field, index) => {
        var _a;
        if (field.type === "dropdown") {
            const question = document.createElement("div");
            question.className = "quiz-title";
            question.style.fontSize = "24px";
            question.textContent = field.label;
            questionBlock === null || questionBlock === void 0 ? void 0 : questionBlock.appendChild(question);
            let answerSelected = false; // New variable to track if an answer has been selected for this question
            (_a = field.options) === null || _a === void 0 ? void 0 : _a.forEach((option, optionIndex) => {
                const answerOption = document.createElement("div");
                answerOption.className = "form-check form-check-inline radioBox btn-outline-primary"; // Added btn-outline-primary here
                const input = document.createElement("input");
                input.type = "checkbox";
                input.id = `answer-${index}-${optionIndex}`;
                input.name = `question-${index}`;
                input.value = option;
                console.log("populating field ", option);
                input.className = "btn btn-outline-primary";
                input.addEventListener("click", () => {
                    var _a;
                    if (!answerSelected) {
                        answerSelected = true; // Mark that an answer has been selected
                        const correctAnswer = field.correct_answer;
                        if (option === correctAnswer) {
                            if (!QuizAttempts.correct.includes(index)) {
                                QuizAttempts.correct.push(index);
                            }
                            answerOption.classList.add('correct-answer'); // Instead of green outline, add .correct-answer
                        }
                        else {
                            answerOption.classList.add('incorrect-answer'); // Instead of green outline, add .correct-answer
                            // push incorrect answer to QuizAttempts, unles it's already there
                            if (!QuizAttempts.incorrect.includes(index)) {
                                QuizAttempts.incorrect.push(index);
                            }
                        }
                        // Disable all other options for this question
                        (_a = field.options) === null || _a === void 0 ? void 0 : _a.forEach((_, otherOptionIndex) => {
                            if (optionIndex !== otherOptionIndex) {
                                document.getElementById(`answer-${index}-${otherOptionIndex}`).disabled = true;
                            }
                        });
                    }
                });
                const label = document.createElement("label");
                label.className = "form-check-label";
                label.htmlFor = input.id;
                label.textContent = option;
                answerOption.appendChild(input);
                answerOption.appendChild(label);
                answerBlock === null || answerBlock === void 0 ? void 0 : answerBlock.appendChild(answerOption);
            });
        }
    });
    let currentQuestionIndex = 0; // To track which question is currently displayed
    // When the next button is clicked
    document.getElementById("quiz-taker-next").addEventListener("click", () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < data.fields.length) {
            displayQuestion(currentQuestionIndex, data);
        }
        else {
            QuizAttempts.score = QuizAttempts.correct.length; // Update the score when the quiz is completed
            // You can redirect or show results here when all questions are done.
            alert("Quiz completed!");
            localStorage.setItem('QuizAttempts', JSON.stringify(QuizAttempts));
            submitQuizAttempts();
        }
    });
    displayQuestion(currentQuestionIndex, data); // Display the first question initially
}
function sendQuizForumQuestion(question) {
    console.log('QuizForum Question:', question);
    // Send the formData as a stringified JSON
    this.audioVideo.realtimeSendDataMessage('quizForumQuestion', question, DemoMeetingApp.DATA_MESSAGE_LIFETIME_MS);
    this.dataMessageHandler(new amazon_chime_sdk_js_1.DataMessage(Date.now(), 'question', new TextEncoder().encode(question), this.meetingSession.configuration.credentials.attendeeId, this.meetingSession.configuration.credentials.externalUserId));
}
console.log("Bottom part of script loaded");
// FUNCTION TO ADD LISTENER TO QUIZFORUM QUESTION
// Get the textarea and messaging container elements
const textarea = document.getElementById('forumContainer');
const messagingContainer = document.querySelector('.messagingContainer');
if (!textarea || !messagingContainer) {
    console.error("Required elements not found.");
}
// Listen for the 'keydown' event on the textarea
textarea.addEventListener('keydown', function (event) {
    const keyboardEvent = event;
    const key = keyboardEvent.keyCode || keyboardEvent.which; // Handle both keyCode and which
    console.log("event keycode", keyboardEvent.keyCode);
    // Check if the 'Enter' key was pressed
    if (key === 13 && !keyboardEvent.shiftKey) {
        event.preventDefault(); // Prevent newline from being added in textarea
        // Call the sendQuizForumQuestion function with the content of the textarea
        sendQuizForumQuestion(textarea.value); // <-- Use the asserted textarea here
        // Create a new message row with the content and timestamp
        const currentTime = new Date();
        const formattedTime = currentTime.getHours() + ':' + String(currentTime.getMinutes()).padStart(2, '0') + ' PM'; // Format time as HH:mm PM
        const messageRow = `
            <div class="send-message">
                <h4 class="message-heading">You<span>${formattedTime}</span></h4>
                <p class="message-details">${textarea.value}</p>  // <-- Use the asserted textarea here
            </div>
        `;
        // Append the new message row to the messaging container
        messagingContainer.innerHTML += messageRow;
        // Clear the textarea
        textarea.value = ''; // <-- Use the asserted textarea here
    }
});
//# sourceMappingURL=meetingV2.js.map