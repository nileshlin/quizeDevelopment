import { Logger, TargetDisplaySize, VideoPreference, VideoPriorityBasedPolicy, VideoSource } from 'amazon-chime-sdk-js';
export default class VideoPreferenceManager {
    private logger;
    private downlinkPolicy;
    static readonly DefaultVideoTilePriority: number;
    static readonly DefaultVideoTileTargetDisplaySize: TargetDisplaySize;
    attendeeIdToVideoPreference: Map<string, VideoPreference>;
    priorityBasedDownlinkPolicy: VideoPriorityBasedPolicy | null;
    _visibleAttendees: string[];
    set visibleAttendees(value: Array<string>);
    constructor(logger: Logger, downlinkPolicy: VideoPriorityBasedPolicy);
    ensureDefaultPreferences(videoSources: VideoSource[]): void;
    setAttendeeTargetDisplaySize(attendeeId: string, targetDisplaySize: TargetDisplaySize): void;
    setAttendeePriority(attendeeId: string, priority: number): void;
    private updateDownlinkPreference;
}
