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
// This logic should be eventually moved to its own utilities class
const meetingV2_1 = require("../meetingV2");
class TestSound {
    constructor(logger, sinkId, frequency = 440, durationSec = 1, rampSec = 0.1, maxGainValue = 0.1) {
        this.logger = logger;
        this.sinkId = sinkId;
        this.frequency = frequency;
        this.durationSec = durationSec;
        this.rampSec = rampSec;
        this.maxGainValue = maxGainValue;
    }
    init() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0;
            const oscillatorNode = audioContext.createOscillator();
            oscillatorNode.frequency.value = this.frequency;
            oscillatorNode.connect(gainNode);
            const destinationStream = audioContext.createMediaStreamDestination();
            gainNode.connect(destinationStream);
            const currentTime = audioContext.currentTime;
            const startTime = currentTime + 0.1;
            gainNode.gain.linearRampToValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.maxGainValue, startTime + this.rampSec);
            gainNode.gain.linearRampToValueAtTime(this.maxGainValue, startTime + this.rampSec + this.durationSec);
            gainNode.gain.linearRampToValueAtTime(0, startTime + this.rampSec * 2 + this.durationSec);
            oscillatorNode.start();
            const audioMixController = new amazon_chime_sdk_js_1.DefaultAudioMixController(this.logger);
            if (new amazon_chime_sdk_js_1.DefaultBrowserBehavior().supportsSetSinkId()) {
                try {
                    // @ts-ignore
                    yield audioMixController.bindAudioDevice({ deviceId: this.sinkId });
                }
                catch (e) {
                    meetingV2_1.fatal(e);
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.error(`Failed to bind audio device: ${e}`);
                }
            }
            try {
                yield audioMixController.bindAudioElement(TestSound.testAudioElement);
            }
            catch (e) {
                meetingV2_1.fatal(e);
                (_b = this.logger) === null || _b === void 0 ? void 0 : _b.error(`Failed to bind audio element: ${e}`);
            }
            yield audioMixController.bindAudioStream(destinationStream.stream);
            new amazon_chime_sdk_js_1.TimeoutScheduler((this.rampSec * 2 + this.durationSec + 1) * 1000).start(() => {
                audioContext.close();
            });
        });
    }
}
exports.default = TestSound;
TestSound.testAudioElement = new Audio();
//# sourceMappingURL=TestSound.js.map