"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPOSTLogger = void 0;
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
function getPOSTLogger(meetingSessionConfiguration, appName, url, logLevel) {
    const options = {
        url,
        logLevel,
        metadata: {
            appName,
            meetingId: meetingSessionConfiguration.meetingId,
            attendeeId: meetingSessionConfiguration.credentials.attendeeId,
        },
    };
    return new amazon_chime_sdk_js_1.POSTLogger(options);
}
exports.getPOSTLogger = getPOSTLogger;
//# sourceMappingURL=MeetingLogger.js.map