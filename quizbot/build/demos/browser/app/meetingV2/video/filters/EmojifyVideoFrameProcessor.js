"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [[EmojifyVideoFrameProcessor]] is an implementation of {@link VideoFrameProcessor}.
 * It draws an emoji to all the input buffers.
 */
class EmojifyVideoFrameProcessor {
    constructor(emoji) {
        this.emoji = emoji;
        this.x = Math.floor(Math.random());
        this.y = 0;
    }
    destroy() {
        return;
    }
    process(buffers) {
        for (const buffer of buffers) {
            if (!buffer) {
                continue;
            }
            // drawing on the buffer directly
            const canvas = buffer.asCanvasElement();
            if (!canvas) {
                continue;
            }
            const ctx = canvas.getContext('2d');
            if (this.x > canvas.width) {
                this.x = Math.min(Math.floor(Math.random() * canvas.width), canvas.width);
            }
            else if (this.y > canvas.height) {
                this.x = Math.min(Math.floor(Math.random() * canvas.width), canvas.width);
                this.y = 0;
            }
            this.y += 5;
            ctx.font = '50px serif';
            ctx.fillStyle = 'rgba(0, 0, 255, 0.8)';
            ctx.fillText(this.emoji, this.x, this.y);
        }
        return Promise.resolve(buffers);
    }
}
exports.default = EmojifyVideoFrameProcessor;
//# sourceMappingURL=EmojifyVideoFrameProcessor.js.map