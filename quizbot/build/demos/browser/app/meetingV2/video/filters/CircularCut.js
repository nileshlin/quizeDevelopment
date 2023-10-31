"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
/**
 * [[CircularCut]] is an implementation of {@link VideoFrameProcessor} for demonstration purpose.
 * It updates the first {@link VideoFrameBuffer} from the input array and clip the whole frame to a circle.
 */
class CircularCut {
    /**
     * Construct a circular cut processor
     * @param radius - radius of the outputted circle in pixels
     */
    constructor(radius = 150) {
        this.radius = radius;
        this.targetCanvas = document.createElement('canvas');
        this.targetCanvasCtx = this.targetCanvas.getContext('2d');
        this.canvasVideoFrameBuffer = new amazon_chime_sdk_js_1.CanvasVideoFrameBuffer(this.targetCanvas);
        this.sourceWidth = 0;
        this.sourceHeight = 0;
    }
    destroy() {
        this.targetCanvasCtx = null;
        this.targetCanvas = null;
        this.canvasVideoFrameBuffer.destroy();
        return;
    }
    process(buffers) {
        // assuming one video stream
        const canvas = buffers[0].asCanvasElement();
        const frameWidth = canvas.width;
        const frameHeight = canvas.height;
        if (frameWidth === 0 || frameHeight === 0) {
            return Promise.resolve(buffers);
        }
        if (this.sourceWidth !== frameWidth || this.sourceHeight !== frameHeight) {
            this.sourceWidth = frameWidth;
            this.sourceHeight = frameHeight;
            // update target canvas size to match the frame size
            this.targetCanvas.width = this.sourceWidth;
            this.targetCanvas.height = this.sourceHeight;
            this.targetCanvasCtx.beginPath();
            // circle in the center
            this.targetCanvasCtx.arc(this.sourceWidth / 2, this.sourceHeight / 2, this.radius, 0, 2 * Math.PI);
            this.targetCanvasCtx.clip();
            this.targetCanvasCtx.stroke();
            this.targetCanvasCtx.closePath();
        }
        this.targetCanvasCtx.drawImage(canvas, 0, 0);
        buffers[0] = this.canvasVideoFrameBuffer;
        return Promise.resolve(buffers);
    }
}
exports.default = CircularCut;
//# sourceMappingURL=CircularCut.js.map