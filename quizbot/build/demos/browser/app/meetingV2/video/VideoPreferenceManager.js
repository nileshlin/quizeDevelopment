"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
class VideoPreferenceManager {
    constructor(logger, downlinkPolicy) {
        this.logger = logger;
        this.downlinkPolicy = downlinkPolicy;
        this.attendeeIdToVideoPreference = new Map();
        this.priorityBasedDownlinkPolicy = null;
        this._visibleAttendees = new Array();
    }
    set visibleAttendees(value) {
        this._visibleAttendees = value;
        this.updateDownlinkPreference();
    }
    ensureDefaultPreferences(videoSources) {
        this.logger.info(`Available remote video sources changed: ${JSON.stringify(videoSources)}`);
        for (const source of videoSources) {
            if (!this.attendeeIdToVideoPreference.has(source.attendee.attendeeId)) {
                this.attendeeIdToVideoPreference.set(source.attendee.attendeeId, new amazon_chime_sdk_js_1.VideoPreference(source.attendee.attendeeId, VideoPreferenceManager.DefaultVideoTilePriority, VideoPreferenceManager.DefaultVideoTileTargetDisplaySize));
            }
        }
    }
    setAttendeeTargetDisplaySize(attendeeId, targetDisplaySize) {
        if (this.attendeeIdToVideoPreference.has(attendeeId)) {
            this.attendeeIdToVideoPreference.get(attendeeId).targetSize = targetDisplaySize;
        }
        else {
            this.attendeeIdToVideoPreference.set(attendeeId, new amazon_chime_sdk_js_1.VideoPreference(attendeeId, VideoPreferenceManager.DefaultVideoTilePriority, targetDisplaySize));
        }
        this.updateDownlinkPreference();
    }
    setAttendeePriority(attendeeId, priority) {
        if (this.attendeeIdToVideoPreference.has(attendeeId)) {
            this.attendeeIdToVideoPreference.get(attendeeId).priority = priority;
        }
        else {
            this.attendeeIdToVideoPreference.set(attendeeId, new amazon_chime_sdk_js_1.VideoPreference(attendeeId, priority, VideoPreferenceManager.DefaultVideoTileTargetDisplaySize));
        }
        this.updateDownlinkPreference();
    }
    updateDownlinkPreference() {
        if (this.attendeeIdToVideoPreference.size === 0) {
            // Preserve default behavior if no preferences have been set yet
            this.logger.info('No video preferences set yet, not updating');
            return;
        }
        const videoPreferences = amazon_chime_sdk_js_1.VideoPreferences.prepare();
        for (const [attendeeId, preference] of this.attendeeIdToVideoPreference.entries()) {
            if (this._visibleAttendees.includes(attendeeId)) {
                videoPreferences.add(preference);
            }
        }
        this.downlinkPolicy.chooseRemoteVideoSources(videoPreferences.build());
    }
}
exports.default = VideoPreferenceManager;
VideoPreferenceManager.DefaultVideoTilePriority = 5;
VideoPreferenceManager.DefaultVideoTileTargetDisplaySize = amazon_chime_sdk_js_1.TargetDisplaySize.High;
//# sourceMappingURL=VideoPreferenceManager.js.map