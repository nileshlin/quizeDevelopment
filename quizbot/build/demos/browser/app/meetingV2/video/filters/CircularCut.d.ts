import { VideoFrameBuffer, VideoFrameProcessor } from 'amazon-chime-sdk-js';
/**
 * [[CircularCut]] is an implementation of {@link VideoFrameProcessor} for demonstration purpose.
 * It updates the first {@link VideoFrameBuffer} from the input array and clip the whole frame to a circle.
 */
export default class CircularCut implements VideoFrameProcessor {
    private radius;
    private targetCanvas;
    private targetCanvasCtx;
    private canvasVideoFrameBuffer;
    private sourceWidth;
    private sourceHeight;
    /**
     * Construct a circular cut processor
     * @param radius - radius of the outputted circle in pixels
     */
    constructor(radius?: number);
    destroy(): Promise<void>;
    process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]>;
}
