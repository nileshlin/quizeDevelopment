import { AudioVideoFacade, ContentShareObserver, Logger } from 'amazon-chime-sdk-js';
/**
 * Class to allow handling the UI interactions and display associated with content share.
 */
export default class ContentShareManager implements ContentShareObserver {
    private logger;
    private audioVideo;
    private usingStereoMusicAudioProfile;
    static TestVideo: string;
    static SourceOptionElementIds: string[];
    private started;
    private pendingLocalFileStart;
    private paused;
    private streamProvider;
    private frameRate;
    private enableCirculeCut;
    private enableVolumeReduction;
    constructor(logger: Logger, audioVideo: AudioVideoFacade, usingStereoMusicAudioProfile: boolean);
    start(): Promise<void>;
    stop(): Promise<void>;
    private initContentShareUI;
    private updateContentShareUX;
    contentShareDidStart(): void;
    contentShareDidStop(): void;
    contentShareDidPause(): void;
    contentShareDidUnpause(): void;
}
