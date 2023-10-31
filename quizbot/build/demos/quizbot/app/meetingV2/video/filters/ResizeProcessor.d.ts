import { VideoFrameBuffer, VideoFrameProcessor } from 'amazon-chime-sdk-js';
/**
 * [[ResizeProcessor]] updates the input {@link VideoFrameBuffer} and resize given the display aspect ratio.
 */
export default class ResizeProcessor implements VideoFrameProcessor {
    private displayAspectRatio;
    private targetCanvas;
    private targetCanvasCtx;
    private canvasVideoFrameBuffer;
    private renderWidth;
    private renderHeight;
    private sourceWidth;
    private sourceHeight;
    private dx;
    constructor(displayAspectRatio: number);
    destroy(): Promise<void>;
    process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]>;
}
