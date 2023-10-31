import './styleV2.scss';
import './dbfunctions';
import { Attendee, AudioInputDevice, AudioVideoFacade, AudioVideoObserver, BackgroundBlurProcessor, BackgroundBlurVideoFrameProcessorObserver, BackgroundReplacementProcessor, BackgroundReplacementVideoFrameProcessorObserver, BackgroundReplacementOptions, ClientMetricReport, ContentShareObserver, DataMessage, DefaultBrowserBehavior, DefaultDeviceController, DefaultVideoTransformDevice, DeviceChangeObserver, EventAttributes, EventName, EventReporter, LogLevel, Logger, MeetingSession, MeetingSessionConfiguration, MeetingSessionStatus, VideoFxProcessor, MeetingSessionVideoAvailability, VideoFxConfig, RemovableAnalyserNode, SimulcastLayers, TranscriptEvent, TranscriptionStatus, TranscriptResult, VideoDownlinkObserver, VideoPriorityBasedPolicy, VideoPriorityBasedPolicyConfig, VoiceFocusDeviceTransformer, VoiceFocusTransformDevice, MeetingSessionCredentials, POSTLogger, VideoCodecCapability } from 'amazon-chime-sdk-js';
import VideoTileCollection from './video/VideoTileCollection';
import VideoPreferenceManager from './video/VideoPreferenceManager';
import Roster from './component/Roster';
import ContentShareManager from './component/ContentShareManager';
export declare let fatal: (e: Error) => void;
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}
declare type VideoFilterName = 'Emojify' | 'NoOp' | 'Segmentation' | 'Resize (9/16)' | 'CircularCut' | 'Background Blur 10% CPU' | 'Background Blur 20% CPU' | 'Background Blur 30% CPU' | 'Background Blur 40% CPU' | 'Background Replacement' | 'None' | 'Background Blur 2.0 - Low' | 'Background Blur 2.0 - Medium' | 'Background Blur 2.0 - High' | 'Background Replacement 2.0 - (Beach)' | 'Background Replacement 2.0 - (Blue)' | 'Background Replacement 2.0 - (Default)';
declare type ButtonState = 'on' | 'off' | 'disabled';
interface Toggle {
    name: string;
    oncreate: (elem: HTMLElement) => void;
    action: () => void;
}
interface TranscriptSegment {
    contentSpan: HTMLSpanElement;
    attendee: Attendee;
    startTimeMs: number;
    endTimeMs: number;
}
export declare class DemoMeetingApp implements AudioVideoObserver, DeviceChangeObserver, ContentShareObserver, VideoDownlinkObserver {
    static readonly DID: string;
    static readonly BASE_URL: string;
    static testVideo: string;
    static readonly MAX_MEETING_HISTORY_MS: number;
    static readonly DATA_MESSAGE_TOPIC: string;
    static readonly DATA_MESSAGE_LIFETIME_MS: number;
    loadingBodyPixDependencyTimeoutMs: number;
    loadingBodyPixDependencyPromise: undefined | Promise<void>;
    attendeeIdPresenceHandler: undefined | ((attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => void);
    activeSpeakerHandler: undefined | ((attendeeIds: string[]) => void);
    volumeIndicatorHandler: undefined | ((attendeeId: string, volume: number, muted: boolean, signalStrength: number) => void);
    canUnmuteLocalAudioHandler: undefined | ((canUnmute: boolean) => void);
    muteAndUnmuteLocalAudioHandler: undefined | ((muted: boolean) => void);
    blurObserver: undefined | BackgroundBlurVideoFrameProcessorObserver;
    replacementObserver: undefined | BackgroundReplacementVideoFrameProcessorObserver;
    showActiveSpeakerScores: boolean;
    meeting: string | null;
    name: string | null;
    voiceConnectorId: string | null;
    sipURI: string | null;
    region: string | null;
    primaryExternalMeetingId: string | undefined;
    primaryMeetingSessionCredentials: MeetingSessionCredentials | undefined;
    meetingSession: MeetingSession | null;
    priorityBasedDownlinkPolicy: VideoPriorityBasedPolicy | null;
    audioVideo: AudioVideoFacade | null;
    deviceController: DefaultDeviceController | undefined;
    canStartLocalVideo: boolean;
    defaultBrowserBehavior: DefaultBrowserBehavior;
    videoTileCollection: VideoTileCollection | undefined;
    videoPreferenceManager: VideoPreferenceManager | undefined;
    roster: Roster;
    contentShare: ContentShareManager | undefined;
    cameraDeviceIds: string[];
    microphoneDeviceIds: string[];
    currentAudioInputDevice: AudioInputDevice | undefined;
    buttonStates: {
        [key: string]: ButtonState;
    };
    isViewOnly: boolean;
    enableWebAudio: boolean;
    logLevel: LogLevel;
    videoCodecPreferences: VideoCodecCapability[] | undefined;
    audioCapability: string;
    videoCapability: string;
    contentCapability: string;
    enableSimulcast: boolean;
    usePriorityBasedDownlinkPolicy: boolean;
    videoPriorityBasedPolicyConfig: VideoPriorityBasedPolicyConfig;
    enablePin: boolean;
    echoReductionCapability: boolean;
    usingStereoMusicAudioProfile: boolean;
    supportsVoiceFocus: boolean;
    enableVoiceFocus: boolean;
    joinMuted: boolean;
    voiceFocusIsActive: boolean;
    supportsBackgroundBlur: boolean;
    supportsBackgroundReplacement: boolean;
    supportsVideoFx: boolean;
    enableLiveTranscription: boolean;
    noWordSeparatorForTranscription: boolean;
    markdown: any;
    lastMessageSender: string | null;
    lastReceivedMessageTimestamp: number;
    lastPacketsSent: number;
    lastTotalAudioPacketsExpected: number;
    lastTotalAudioPacketsLost: number;
    lastTotalAudioPacketsRecoveredRed: number;
    lastTotalAudioPacketsRecoveredFec: number;
    lastRedRecoveryMetricsReceived: number;
    meetingSessionPOSTLogger: POSTLogger;
    meetingEventPOSTLogger: POSTLogger;
    hasChromiumWebRTC: boolean;
    voiceFocusTransformer: VoiceFocusDeviceTransformer | undefined;
    voiceFocusDevice: VoiceFocusTransformDevice | undefined;
    joinInfo: any | undefined;
    deleteOwnAttendeeToLeave: boolean;
    disablePeriodicKeyframeRequestOnContentSender: boolean;
    allowAttendeeCapabilities: boolean;
    blurProcessor: BackgroundBlurProcessor | undefined;
    replacementProcessor: BackgroundReplacementProcessor | undefined;
    replacementOptions: BackgroundReplacementOptions | undefined;
    voiceFocusDisplayables: HTMLElement[];
    analyserNode: RemovableAnalyserNode;
    liveTranscriptionDisplayables: HTMLElement[];
    chosenVideoTransformDevice: DefaultVideoTransformDevice;
    chosenVideoFilter: VideoFilterName;
    selectedVideoFilterItem: VideoFilterName;
    DEFAULT_VIDEO_FX_CONFIG: VideoFxConfig;
    videoFxProcessor: VideoFxProcessor | undefined;
    videoFxConfig: VideoFxConfig;
    meetingLogger: Logger | undefined;
    behaviorAfterLeave: 'spa' | 'reload' | 'halt' | 'nothing';
    videoMetricReport: {
        [id: string]: {
            [id: string]: {};
        };
    };
    removeFatalHandlers: () => void;
    transcriptContainerDiv: HTMLDivElement;
    partialTranscriptDiv: HTMLDivElement | undefined;
    partialTranscriptResultTimeMap: Map<string, number>;
    partialTranscriptResultMap: Map<string, TranscriptResult>;
    transcriptEntitySet: Set<string>;
    addFatalHandlers(): void;
    eventReporter: EventReporter | undefined;
    enableEventReporting: boolean;
    constructor();
    /**
     * We want to make it abundantly clear at development and testing time
     * when an unexpected error occurs.
     * If we're running locally, or we passed a `fatal=1` query parameter, fail hard.
     */
    fatal(e: Error | string): void;
    initParameters(): void;
    initVoiceFocus(): Promise<void>;
    initBackgroundBlur(): Promise<void>;
    /**
     * Determine if the videoFxProcessor is supported in current environment
     */
    resolveSupportsVideoFX(): Promise<void>;
    createReplacementImageBlob(startColor: string, endColor: string): Promise<Blob>;
    /**
     * The image blob in this demo is created by generating an image
     * from a canvas, but another common scenario would be to provide
     * an image blob from fetching a URL.
     *   const image = await fetch('https://someimage.jpeg');
     *   const imageBlob = await image.blob();
     */
    getBackgroundReplacementOptions(): Promise<BackgroundReplacementOptions>;
    initBackgroundReplacement(): Promise<void>;
    private onVoiceFocusSettingChanged;
    initEventListeners(): void;
    logAudioStreamPPS(clientMetricReport: ClientMetricReport): void;
    logRedRecoveryPercent(clientMetricReport: ClientMetricReport): void;
    getSupportedMediaRegions(): string[];
    getNearestMediaRegion(): Promise<string>;
    setMediaRegion(): void;
    promoteToPrimaryMeeting(): Promise<void>;
    private getPrimaryMeetingCredentials;
    updateUXForViewOnlyMode(): void;
    updateUXForReplicaMeetingPromotionState(promotedState: 'promoted' | 'demoted'): void;
    setButtonVisibility(button: string, visible: boolean, state?: ButtonState): void;
    toggleButton(button: string, state?: ButtonState): ButtonState;
    isButtonOn(button: string): boolean;
    updateButtonVideoRecordingDrop(): void;
    displayButtonStates(): void;
    showProgress(id: string): void;
    hideProgress(id: string): void;
    switchToFlow(flow: string): void;
    onAudioInputsChanged(freshDevices: MediaDeviceInfo[]): Promise<void>;
    audioInputMuteStateChanged(device: string | MediaStream, muted: boolean): void;
    audioInputsChanged(freshAudioInputDeviceList: MediaDeviceInfo[]): void;
    videoInputsChanged(_freshVideoInputDeviceList: MediaDeviceInfo[]): void;
    audioOutputsChanged(_freshAudioOutputDeviceList: MediaDeviceInfo[]): void;
    audioInputStreamEnded(deviceId: string): void;
    videoInputStreamEnded(deviceId: string): void;
    metricsDidReceive(clientMetricReport: ClientMetricReport): void;
    displayEstimatedUplinkBandwidth(bitrate: number): void;
    displayEstimatedDownlinkBandwidth(bitrate: number): void;
    resetStats: () => void;
    getRelayProtocol(): Promise<void>;
    createLogStream(configuration: MeetingSessionConfiguration, pathname: string): Promise<void>;
    eventDidReceive(name: EventName, attributes: EventAttributes): void;
    initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<void>;
    setupEventReporter(configuration: MeetingSessionConfiguration): Promise<EventReporter>;
    private isLocalHost;
    join(): Promise<void>;
    leave(): Promise<void>;
    setupMuteHandler(): void;
    setupCanUnmuteHandler(): void;
    updateProperty(obj: any, key: string, value: string): void;
    setupSubscribeToAttendeeIdPresenceHandler(): void;
    dataMessageHandler(dataMessage: DataMessage): void;
    setupDataMessage(): void;
    setupDataFormMessage(): void;
    setupDataQuestionForumMessage(): void;
    transcriptEventHandler: (transcriptEvent: TranscriptEvent) => void;
    renderPartialTranscriptResults: () => void;
    updatePartialTranscriptDiv: () => void;
    populatePartialTranscriptSegmentsFromResult: (segments: TranscriptSegment[], result: TranscriptResult) => void;
    createSpaceSpan(): HTMLSpanElement;
    appendNewSpeakerTranscriptDiv: (segment: TranscriptSegment, speakerToTranscriptSpanMap: Map<string, HTMLSpanElement>) => void;
    appendStatusDiv: (status: TranscriptionStatus) => void;
    setupLiveTranscription: () => void;
    sendJoinRequest(meeting: string, name: string, region: string, primaryExternalMeetingId?: string, audioCapability?: string, videoCapability?: string, contentCapability?: string): Promise<any>;
    deleteAttendee(meeting: string, attendeeId: string): Promise<void>;
    startMediaCapture(): Promise<any>;
    stopMediaCapture(): Promise<any>;
    startLiveConnector(): Promise<any>;
    stopLiveConnector(): Promise<any>;
    endMeeting(): Promise<any>;
    getAttendee(attendeeId: string): Promise<any>;
    updateAttendeeCapabilities(attendeeId: string, audioCapability: string, videoCapability: string, contentCapability: string): Promise<void>;
    updateAttendeeCapabilitiesExcept(attendees: string[], audioCapability: string, videoCapability: string, contentCapability: string): Promise<void>;
    setupDeviceLabelTrigger(): void;
    populateDeviceList(elementId: string, genericName: string, devices: MediaDeviceInfo[], additionalOptions: string[]): void;
    populateVideoPreviewFilterList(elementId: string, genericName: string, filters: VideoFilterName[]): void;
    populateInMeetingDeviceList(elementId: string, genericName: string, devices: MediaDeviceInfo[], additionalOptions: string[], additionalToggles: Toggle[] | undefined, callback: (name: string) => void): void;
    createDropdownMenuItem(menu: HTMLDivElement, title: string, clickHandler: () => void, id?: string): HTMLButtonElement;
    populateAllDeviceLists(): Promise<void>;
    private selectVideoFilterByName;
    private stopVideoProcessor;
    private getBackgroundBlurSpec;
    private populateVideoFilterInputList;
    private populateFilterList;
    populateAudioInputList(): Promise<void>;
    private areVideoFiltersSupported;
    private isVoiceFocusActive;
    private updateVoiceFocusDisplayState;
    showQuiz(): void;
    private isVoiceFocusEnabled;
    private reselectAudioInputDevice;
    private toggleVoiceFocusInMeeting;
    private updateLiveTranscriptionDisplayState;
    private toggleLiveTranscription;
    populateVideoInputList(): Promise<void>;
    populateAudioOutputList(): Promise<void>;
    private chooseAudioOutput;
    private analyserNodeCallback;
    selectedAudioInput(): Promise<AudioInputDevice>;
    selectAudioInputDevice(device: AudioInputDevice): Promise<void>;
    selectAudioInputDeviceByName(name: string): Promise<void>;
    openAudioInputFromSelection(): Promise<void>;
    openAudioInputFromSelectionAndPreview(): Promise<void>;
    setAudioPreviewPercent(percent: number): void;
    stopAudioPreview(): Promise<void>;
    startAudioPreview(): void;
    openAudioOutputFromSelection(): Promise<void>;
    private selectedVideoInput;
    openVideoInputFromSelection(selection: string | null, showPreview: boolean): Promise<void>;
    private audioInputSelectionToIntrinsicDevice;
    private getVoiceFocusDeviceTransformer;
    private createVoiceFocusDevice;
    private audioInputSelectionWithOptionalVoiceFocus;
    private audioInputSelectionToDevice;
    private videoInputSelectionToIntrinsicDevice;
    private videoFilterToProcessor;
    /**
     * Update this.videoFxConfig to match the corresponding configuration specified by the videoFilter.
     * @param videoFilter
     */
    private updateFxConfig;
    private videoInputSelectionWithOptionalFilter;
    private videoInputSelectionToDevice;
    isRecorder(): boolean;
    isBroadcaster(): boolean;
    isAbortingOnReconnect(): boolean;
    authenticate(): Promise<string>;
    initAttendeeCapabilityFeature(): Promise<void>;
    log(str: string, ...args: any[]): void;
    audioVideoDidStartConnecting(reconnecting: boolean): void;
    audioVideoDidStart(): void;
    audioVideoDidStop(sessionStatus: MeetingSessionStatus): void;
    audioVideoWasDemotedFromPrimaryMeeting(status: any): void;
    videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void;
    private enableLocalVideoButton;
    private redirectFromAuthentication;
    private skipDeviceSelection;
    allowMaxContentShare(): boolean;
    connectionDidBecomePoor(): void;
    connectionDidSuggestStopVideo(): void;
    connectionDidBecomeGood(): void;
    videoSendDidBecomeUnavailable(): void;
    contentShareDidStart(): void;
    contentShareDidStop(): void;
    encodingSimulcastLayersDidChange(simulcastLayers: SimulcastLayers): void;
    tileWillBePausedByDownlinkPolicy(tileId: number): void;
    tileWillBeUnpausedByDownlinkPolicy(tileId: number): void;
}
export {};
