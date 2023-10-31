"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
const PaginationManager_1 = __importDefault(require("./PaginationManager"));
const VideoTile_1 = require("./VideoTile");
VideoTile_1.DemoVideoTile; // Make sure this file is included in webpack
const ConfigLevelToVideoPriority = {
    low: 200,
    medium: 100,
    high: 10,
    max: 1,
};
const ConfigLevelToTargetDisplaySize = {
    low: amazon_chime_sdk_js_1.TargetDisplaySize.Low,
    medium: amazon_chime_sdk_js_1.TargetDisplaySize.Medium,
    high: amazon_chime_sdk_js_1.TargetDisplaySize.High,
    max: amazon_chime_sdk_js_1.TargetDisplaySize.Maximum,
};
const VideoUpstreamMetricsKeyStats = {
    videoUpstreamFrameHeight: 'Frame Height',
    videoUpstreamFrameWidth: 'Frame Width',
    videoUpstreamBitrate: 'Bitrate (bps)',
    videoUpstreamPacketsSent: 'Packets Sent',
    videoUpstreamPacketLossPercent: 'Packet Loss (%)',
    videoUpstreamFramesEncodedPerSecond: 'Frame Rate',
};
const VideoDownstreamMetricsKeyStats = {
    videoDownstreamFrameHeight: 'Frame Height',
    videoDownstreamFrameWidth: 'Frame Width',
    videoDownstreamBitrate: 'Bitrate (bps)',
    videoDownstreamPacketLossPercent: 'Packet Loss (%)',
    videoDownstreamPacketsReceived: 'Packet Received',
    videoDownstreamFramesDecodedPerSecond: 'Frame Rate',
};
class TileOrganizer {
    constructor() {
        this.tiles = {};
        this.tileStates = {};
        this.remoteTileCount = 0;
    }
    acquireTileIndex(tileId) {
        for (let index = 0; index <= TileOrganizer.MaxTiles; index++) {
            if (this.tiles[index] === tileId) {
                return index;
            }
        }
        for (let index = 0; index <= TileOrganizer.MaxTiles; index++) {
            if (!(index in this.tiles)) {
                this.tiles[index] = tileId;
                this.remoteTileCount++;
                return index;
            }
        }
        throw new Error('no tiles are available');
    }
    releaseTileIndex(tileId) {
        for (let index = 0; index <= TileOrganizer.MaxTiles; index++) {
            if (this.tiles[index] === tileId) {
                this.remoteTileCount--;
                delete this.tiles[index];
                return index;
            }
        }
        return TileOrganizer.MaxTiles;
    }
}
// this is index instead of length
TileOrganizer.MaxTiles = 27;
class VideoTileCollection {
    constructor(videoTileController, logger, videoPreferenceManager, pageSize) {
        this.videoTileController = videoTileController;
        this.logger = logger;
        this.videoPreferenceManager = videoPreferenceManager;
        this.tileOrganizer = new TileOrganizer();
        this.tileIndexToTileId = {};
        this.tileIdToTileIndex = {};
        this.tileIdToAttendeeId = {};
        // Store these per-tile event listeners so we can avoid leaking them when tile is removed
        this.tileIndexToPauseEventListener = {};
        this.tileIndexToTargetResolutionEventListener = {};
        this.tileIndexToPriorityEventListener = {};
        this.tileArea = document.getElementById('tile-area');
        this.tileIndexToDemoVideoTile = new Map();
        this.bandwidthConstrainedTiles = new Set();
        this._activeSpeakerAttendeeId = "";
        this.setupVideoTiles();
        if (this.videoPreferenceManager === undefined) {
            // Don't show priority related configuration if we don't support it
            for (let i = 0; i <= TileOrganizer.MaxTiles; i++) {
                this.tileIndexToDemoVideoTile.get(i).showRemoteVideoPreferences = false;
            }
        }
        else {
            // Pagination is only possible with priority based policy
            this.pagination = new PaginationManager_1.default(pageSize);
            document.getElementById('video-paginate-left').addEventListener('click', (event) => { this.paginateLeft(); });
            document.getElementById('video-paginate-right').addEventListener('click', (event) => { this.paginateRight(); });
            this.updatePaginatedVisibleTiles();
        }
    }
    set activeSpeakerAttendeeId(id) {
        this.logger.info(`setting act spk to ${id}`);
        this._activeSpeakerAttendeeId = id;
        this.layoutFeaturedTile();
    }
    remoteVideoSourcesDidChange(videoSources) {
        if (this.videoPreferenceManager === undefined) {
            return;
        }
        // Add these sources to the pagination list
        for (const source of videoSources) {
            this.pagination.add(source.attendee.attendeeId);
        }
        this.pagination.removeIf((value) => {
            return !videoSources.some((source) => source.attendee.attendeeId === value);
        });
        // Update the preference manager explicitly as it needs to add default preferences
        this.videoPreferenceManager.ensureDefaultPreferences(videoSources);
        this.updatePaginatedVisibleTiles();
    }
    videoTileDidUpdate(tileState) {
        console.log(`video tile updated: ${JSON.stringify(tileState, null, '  ')}`);
        if (!tileState.boundAttendeeId) {
            return;
        }
        const tileIndex = tileState.localTile
            ? VideoTileCollection.LocalVideoTileIndex
            : this.tileOrganizer.acquireTileIndex(tileState.tileId);
        const demoVideoTile = this.tileIndexToDemoVideoTile.get(tileIndex);
        if (!tileState.localTile) { // Pausing local tile doesn't make sense
            demoVideoTile.pauseButtonElement.removeEventListener('click', this.tileIndexToPauseEventListener[tileIndex]);
            this.tileIndexToPauseEventListener[tileIndex] = this.createPauseResumeListener(tileState);
            demoVideoTile.pauseButtonElement.addEventListener('click', this.tileIndexToPauseEventListener[tileIndex]);
        }
        if (this.videoPreferenceManager !== undefined && !tileState.localTile) { // No current config possible on local tile
            this.logger.info('adding config listeners for tileIndex ' + tileIndex);
            demoVideoTile.targetResolutionRadioElement.removeEventListener('click', this.tileIndexToTargetResolutionEventListener[tileIndex]);
            this.tileIndexToTargetResolutionEventListener[tileIndex] = this.createTargetResolutionListener(tileState);
            demoVideoTile.targetResolutionRadioElement.addEventListener('click', this.tileIndexToTargetResolutionEventListener[tileIndex]);
            demoVideoTile.videoPriorityRadioElement.removeEventListener('click', this.tileIndexToPriorityEventListener[tileIndex]);
            this.tileIndexToPriorityEventListener[tileIndex] = this.createVideoPriorityListener(tileState);
            demoVideoTile.videoPriorityRadioElement.addEventListener('click', this.tileIndexToPriorityEventListener[tileIndex]);
        }
        const videoElement = demoVideoTile.videoElement;
        this.logger.info(`binding video tile ${tileState.tileId} to ${videoElement.id}`);
        this.videoTileController.bindVideoElement(tileState.tileId, this.tileIndexToDemoVideoTile.get(tileIndex).videoElement);
        this.tileIndexToTileId[tileIndex] = tileState.tileId;
        this.tileIdToTileIndex[tileState.tileId] = tileIndex;
        this.tileIdToAttendeeId[tileState.tileId] = tileState.boundAttendeeId;
        if (tileState.boundExternalUserId) {
            demoVideoTile.nameplate = tileState.boundExternalUserId.split('#').slice(-1)[0];
        }
        if (tileState.paused && this.bandwidthConstrainedTiles.has(tileState.tileId)) {
            demoVideoTile.pauseState = '⚡';
        }
        else {
            demoVideoTile.pauseState = '';
        }
        demoVideoTile.attendeeId = tileState.boundAttendeeId;
        if (tileState.boundVideoStream) {
            demoVideoTile.show(tileState.isContent);
        }
        else {
            // Hide non-active tiles that aren't just paused
            demoVideoTile.hide();
        }
        this.updateLayout();
        this.layoutFeaturedTile();
    }
    videoTileWasRemoved(tileId) {
        const tileIndex = this.tileOrganizer.releaseTileIndex(tileId);
        this.logger.info(`video tileId removed: ${tileId} from tile-${tileIndex}`);
        const demoVideoTile = this.tileIndexToDemoVideoTile.get(tileIndex);
        demoVideoTile.pauseButtonElement.removeEventListener('click', this.tileIndexToPauseEventListener[tileIndex]);
        if (true) {
            demoVideoTile.targetResolutionRadioElement.removeEventListener('click', this.tileIndexToTargetResolutionEventListener[tileIndex]);
            demoVideoTile.videoPriorityRadioElement.removeEventListener('click', this.tileIndexToPriorityEventListener[tileIndex]);
        }
        demoVideoTile.hide();
        // Clear values
        demoVideoTile.attendeeId = "";
        demoVideoTile.nameplate = "";
        demoVideoTile.pauseState = "";
        this.updateLayout();
    }
    showVideoWebRTCStats(videoMetricReport) {
        this.logger.info(`showing stats ${JSON.stringify(videoMetricReport)}`);
        const videoTiles = this.videoTileController.getAllVideoTiles();
        if (videoTiles.length === 0) {
            return;
        }
        for (const videoTile of videoTiles) {
            const tileState = videoTile.state();
            if (tileState.paused) {
                continue;
            }
            const tileId = videoTile.id();
            const tileIndex = this.tileIdToTileIndex[tileId];
            const demoVideoTile = this.tileIndexToDemoVideoTile.get(tileIndex);
            if (tileState.localTile) {
                this.logger.info(`showing stats ${JSON.stringify(videoMetricReport)}`);
                demoVideoTile.showVideoStats(VideoUpstreamMetricsKeyStats, videoMetricReport[tileState.boundAttendeeId], 'Upstream');
            }
            else {
                demoVideoTile.showVideoStats(VideoDownstreamMetricsKeyStats, videoMetricReport[tileState.boundAttendeeId], 'Downstream');
            }
        }
    }
    setupVideoTiles() {
        const tileArea = document.getElementById(`tile-area`);
        for (let i = 0; i <= TileOrganizer.MaxTiles; i++) {
            const tile = document.createElement('video-tile');
            // `DemoVideoTile` requires being added to DOM before calling any functions
            tileArea.appendChild(tile);
            tile.tileIndex = i;
            if (i === VideoTileCollection.LocalVideoTileIndex) {
                // Don't show config or pause on local video because they don't make sense there
                tile.showConfigDropdown = false;
                tile.showRemoteVideoPreferences = false;
            }
            this.tileIndexToDemoVideoTile.set(i, tile);
            // Setup tile element resizer
            const videoElem = tile.videoElement;
            videoElem.onresize = () => {
                if (videoElem.videoHeight > videoElem.videoWidth) {
                    // portrait mode
                    videoElem.style.objectFit = 'contain';
                    this.logger.info(`video-${i} changed to portrait mode resolution ${videoElem.videoWidth}x${videoElem.videoHeight}`);
                }
                else {
                    videoElem.style.objectFit = 'cover';
                }
            };
        }
    }
    tileIdForAttendeeId(attendeeId) {
        for (const tile of this.videoTileController.getAllVideoTiles()) {
            const state = tile.state();
            if (state.boundAttendeeId === attendeeId) {
                return state.tileId;
            }
        }
        return null;
    }
    findContentTileId() {
        for (const tile of this.videoTileController.getAllVideoTiles()) {
            const state = tile.state();
            if (state.isContent) {
                return state.tileId;
            }
        }
        return null;
    }
    activeTileId() {
        let contentTileId = this.findContentTileId();
        if (contentTileId !== null) {
            return contentTileId;
        }
        return this.tileIdForAttendeeId(this._activeSpeakerAttendeeId);
    }
    layoutFeaturedTile() {
        const tilesIndices = this.visibleTileIndices();
        const localTileId = this.localTileId();
        const activeTile = this.activeTileId();
        for (let i = 0; i < tilesIndices.length; i++) {
            const tileIndex = tilesIndices[i];
            const demoVideoTile = this.tileIndexToDemoVideoTile.get(tileIndex);
            const tileId = this.tileIndexToTileId[tileIndex];
            if (tileId === activeTile && tileId !== localTileId) {
                demoVideoTile.featured = true;
            }
            else {
                demoVideoTile.featured = false;
            }
        }
        this.updateLayout();
    }
    updateLayout() {
        this.tileArea.className = `v-grid size-${this.videoTileCount()}`;
        const localTileId = this.localTileId();
        const activeTile = this.activeTileId();
        if (activeTile && activeTile !== localTileId) {
            this.tileArea.classList.add('featured');
        }
        else {
            this.tileArea.classList.remove('featured');
        }
    }
    videoTileCount() {
        return (this.tileOrganizer.remoteTileCount + (this.videoTileController.hasStartedLocalVideoTile() ? 1 : 0));
    }
    localTileId() {
        return this.videoTileController.hasStartedLocalVideoTile()
            ? this.videoTileController.getLocalVideoTile().state().tileId
            : null;
    }
    visibleTileIndices() {
        const tileKeys = Object.keys(this.tileOrganizer.tiles);
        const tiles = tileKeys.map(tileId => parseInt(tileId));
        return tiles;
    }
    paginateLeft() {
        this.pagination.previousPage();
        this.updatePaginatedVisibleTiles();
    }
    paginateRight() {
        this.pagination.nextPage();
        this.updatePaginatedVisibleTiles();
    }
    updatePaginatedVisibleTiles() {
        // Refresh visible attendees incase ones have been added
        let attendeesToShow = this.pagination.currentPage();
        this.logger.info(`Showing current page ${JSON.stringify(attendeesToShow)}`);
        this.videoPreferenceManager.visibleAttendees = attendeesToShow;
        // We need to manually control visibility of paused tiles anyways so we just do
        // everything here, even though the preference manager adding/removing will
        // result in tile callbacks as well.
        for (let [index, videoTile] of this.tileIndexToDemoVideoTile.entries()) {
            if (attendeesToShow.includes(videoTile.attendeeId)) {
                videoTile.show(false);
            }
            else if (index !== VideoTileCollection.LocalVideoTileIndex
                && this.tileIndexToTileId[index] !== this.findContentTileId()) { // Always show local tile and content
                videoTile.hide();
            }
        }
        const display = (should) => { return should ? 'block' : 'none'; };
        document.getElementById('video-paginate-left').style.display = display(this.pagination.hasPreviousPage());
        document.getElementById('video-paginate-right').style.display = display(this.pagination.hasNextPage());
    }
    createTargetResolutionListener(tileState) {
        return (event) => {
            if (!(event.target instanceof HTMLInputElement)) {
                // Ignore the Label event which will have a stale value
                return;
            }
            const attendeeId = tileState.boundAttendeeId;
            const value = event.target.value;
            this.logger.info(`target resolution changed for: ${attendeeId} to ${value}`);
            const targetDisplaySize = ConfigLevelToTargetDisplaySize[value];
            this.videoPreferenceManager.setAttendeeTargetDisplaySize(attendeeId, targetDisplaySize);
        };
    }
    createVideoPriorityListener(tileState) {
        return (event) => {
            if (!(event.target instanceof HTMLInputElement)) {
                // Ignore the Label event which will have a stale value
                return;
            }
            const attendeeId = tileState.boundAttendeeId;
            const value = event.target.value;
            this.logger.info(`priority changed for: ${attendeeId} to ${value}`);
            const priority = ConfigLevelToVideoPriority[value];
            this.videoPreferenceManager.setAttendeePriority(attendeeId, priority);
        };
    }
    createPauseResumeListener(tileState) {
        return (event) => {
            if (!tileState.paused) {
                this.videoTileController.pauseVideoTile(tileState.tileId);
                event.target.innerText = 'Resume';
            }
            else {
                this.videoTileController.unpauseVideoTile(tileState.tileId);
                event.target.innerText = 'Pause';
            }
        };
    }
}
exports.default = VideoTileCollection;
// We reserve the last tile index for local video
VideoTileCollection.LocalVideoTileIndex = TileOrganizer.MaxTiles;
//# sourceMappingURL=VideoTileCollection.js.map