"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
/**
 * [[SegmentationProcessors]] loads Tensorflow BodyPix model to perform image segmentation.
 * Please refer to https://www.npmjs.com/package/@tensorflow-models/body-pix/v/2.0.5.
 */
class SegmentationProcessor {
    constructor() {
        this.targetCanvas = document.createElement('canvas');
        this.canvasVideoFrameBuffer = new amazon_chime_sdk_js_1.CanvasVideoFrameBuffer(this.targetCanvas);
        this.sourceWidth = 0;
        this.sourceHeight = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.mask = undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.model = undefined;
    }
    process(buffers) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.model) {
                this.model = yield bodyPix.load();
            }
            const inputCanvas = buffers[0].asCanvasElement();
            if (!inputCanvas) {
                throw new Error('buffer is already destroyed');
            }
            const frameWidth = inputCanvas.width;
            const frameHeight = inputCanvas.height;
            if (frameWidth === 0 || frameHeight === 0) {
                return buffers;
            }
            if (this.sourceWidth !== frameWidth || this.sourceHeight !== frameHeight) {
                this.sourceWidth = frameWidth;
                this.sourceHeight = frameHeight;
                // update target canvas size to match the frame size
                this.targetCanvas.width = this.sourceWidth;
                this.targetCanvas.height = this.sourceHeight;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let predictions = yield this.model.segmentPerson(inputCanvas);
            if (predictions) {
                this.mask = bodyPix.toMask(predictions, SegmentationProcessor.FOREGROUND_COLOR, SegmentationProcessor.BACKGROUND_COLOR, true);
            }
            if (this.mask) {
                bodyPix.drawMask(this.targetCanvas, inputCanvas, this.mask);
                buffers[0] = this.canvasVideoFrameBuffer;
            }
            return buffers;
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.model) {
                this.model.dispose();
            }
            this.model = undefined;
        });
    }
}
exports.default = SegmentationProcessor;
SegmentationProcessor.FOREGROUND_COLOR = { r: 255, g: 255, b: 255, a: 255 };
SegmentationProcessor.BACKGROUND_COLOR = { r: 0, g: 0, b: 0, a: 255 };
//# sourceMappingURL=SegmentationProcessor.js.map