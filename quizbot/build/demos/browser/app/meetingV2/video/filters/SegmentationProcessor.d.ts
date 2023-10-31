import { VideoFrameBuffer, VideoFrameProcessor } from 'amazon-chime-sdk-js';
/**
 * [[SegmentationProcessors]] loads Tensorflow BodyPix model to perform image segmentation.
 * Please refer to https://www.npmjs.com/package/@tensorflow-models/body-pix/v/2.0.5.
 */
export default class SegmentationProcessor implements VideoFrameProcessor {
    private targetCanvas;
    private canvasVideoFrameBuffer;
    private sourceWidth;
    private sourceHeight;
    static FOREGROUND_COLOR: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    static BACKGROUND_COLOR: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    private mask;
    private model;
    constructor();
    process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]>;
    destroy(): Promise<void>;
}
