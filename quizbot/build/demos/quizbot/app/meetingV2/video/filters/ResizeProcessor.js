"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
/**
 * [[ResizeProcessor]] updates the input {@link VideoFrameBuffer} and resize given the display aspect ratio.
 */
class ResizeProcessor {
    constructor(displayAspectRatio) {
        this.displayAspectRatio = displayAspectRatio;
        this.targetCanvas = document.createElement('canvas');
        this.targetCanvasCtx = this.targetCanvas.getContext('2d');
        this.canvasVideoFrameBuffer = new amazon_chime_sdk_js_1.CanvasVideoFrameBuffer(this.targetCanvas);
        this.renderWidth = 0;
        this.renderHeight = 0;
        this.sourceWidth = 0;
        this.sourceHeight = 0;
        this.dx = 0;
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
            this.renderWidth = Math.floor(this.sourceHeight * this.displayAspectRatio);
            this.renderHeight = this.sourceHeight;
            this.dx = Math.max(0, Math.floor((frameWidth - this.renderWidth) / 2));
            this.targetCanvas.width = this.renderWidth;
            this.targetCanvas.height = this.renderHeight;
        }
        this.targetCanvasCtx.drawImage(canvas, this.dx, 0, this.renderWidth, this.renderHeight, 0, 0, this.renderWidth, this.renderHeight);
        buffers[0] = this.canvasVideoFrameBuffer;
        return Promise.resolve(buffers);
    }
}
exports.default = ResizeProcessor;
//# sourceMappingURL=ResizeProcessor.js.map