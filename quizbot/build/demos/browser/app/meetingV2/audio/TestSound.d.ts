import { Logger } from 'amazon-chime-sdk-js';
export default class TestSound {
    private logger;
    private sinkId;
    private frequency;
    private durationSec;
    private rampSec;
    private maxGainValue;
    static testAudioElement: HTMLAudioElement;
    constructor(logger: Logger, sinkId: string | null, frequency?: number, durationSec?: number, rampSec?: number, maxGainValue?: number);
    init(): Promise<void>;
}
