import { VideoFrameBuffer, VideoFrameProcessor } from 'amazon-chime-sdk-js';
/**
 * [[EmojifyVideoFrameProcessor]] is an implementation of {@link VideoFrameProcessor}.
 * It draws an emoji to all the input buffers.
 */
export default class EmojifyVideoFrameProcessor implements VideoFrameProcessor {
    private emoji;
    private x;
    private y;
    constructor(emoji: string);
    destroy(): Promise<void>;
    process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]>;
}
