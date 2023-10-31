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
exports.platformCanSupportBodyPixWithoutDegradation = exports.loadBodyPixDependency = void 0;
const detect_browser_1 = require("detect-browser");
const SEGMENTATION_DEPENDENCIES = [
    {
        src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.7.0/dist/tf.min.js',
        integrity: 'sha384-uI1PW0SEa/QzAUuRQ6Bz5teBONsa9D0ZbVxMcM8mu4IjJ5msHyM7RRtZtL8LnSf3',
        crossOrigin: 'anonymous',
    },
    {
        src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@2.7.0/dist/tf-core.min.js',
        integrity: 'sha384-DlI/SVdTGUBY5hi4h0p+nmC6V8i0FW5Nya/gYElz0L68HrSiXsBh+rqWcoZx3SXY',
        crossOrigin: 'anonymous',
    },
    {
        src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@2.7.0/dist/tf-backend-webgl.min.js',
        integrity: 'sha384-21TV9Kpzn8SF68G1U6nYN3qPZnb97F06JuW4v0FDDBzW+CUwv8GcKMR+BjnE7Vmm',
        crossOrigin: 'anonymous',
    },
    {
        src: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.0.5/dist/body-pix.min.js',
        integrity: 'sha384-dPJ/sICXCqdh39bsuGLVFcOiRyeL/XcFrwiFrJq9oh7k1TCtsUKhX6UV2X4UuKU4',
        crossOrigin: 'anonymous',
    },
];
function loadBodyPixDependency(timeoutMs) {
    return __awaiter(this, void 0, void 0, function* () {
        // the tf library loading order must be followed
        for (const { src, integrity, crossOrigin } of SEGMENTATION_DEPENDENCIES) {
            yield new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const timer = setTimeout(() => {
                    reject(new Error(`Loading script ${src} takes longer than ${timeoutMs}`));
                }, timeoutMs);
                script.onload = function (_ev) {
                    clearTimeout(timer);
                    resolve();
                };
                script.onerror = function (_ev) {
                    clearTimeout(timer);
                    reject(new Error(`Failed to load ${src}`));
                };
                script.integrity = integrity;
                script.crossOrigin = crossOrigin;
                script.src = src;
                document.body.appendChild(script);
            });
        }
    });
}
exports.loadBodyPixDependency = loadBodyPixDependency;
function platformCanSupportBodyPixWithoutDegradation() {
    // https://blog.tensorflow.org/2019/11/updated-bodypix-2.html for more detail on performance
    // https://github.com/tensorflow/tfjs/issues/3319 which results in firefox memory leak
    const browser = detect_browser_1.detect();
    return browser.name === 'chrome' && /(android)/i.test(navigator.userAgent) === false;
}
exports.platformCanSupportBodyPixWithoutDegradation = platformCanSupportBodyPixWithoutDegradation;
//# sourceMappingURL=SegmentationUtil.js.map