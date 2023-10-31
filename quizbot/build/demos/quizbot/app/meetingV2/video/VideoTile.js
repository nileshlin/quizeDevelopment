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
exports.DemoVideoTile = void 0;
class DemoVideoTile extends HTMLElement {
    constructor() {
        super(...arguments);
        this.innerHTMLToInject = `
  <video class="video-tile-video"></video>
  <div class="video-tile-attendee-id"></div>
  <div class="video-tile-nameplate"></div>
  <div class="video-tile-pause-state"></div>
  <div class="button-video-tile-config" role="group">
    <button type="button" class="btn btn-success dropdown-toggle button-video-tile-config-drop" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Video Tile Settings"><%= require('../../../node_modules/open-iconic/svg/cog.svg') %></button>
    <div class="dropdown-menu dropdown-menu-end dropdown-video-tile-config" aria-labelledby="button-video-tile-config-drop" style="position: absolute; transform: translate3d(0px, 38px, 0px); top: 0px; left: 0px; will-change: transform;">
      <a class="dropdown-item video-tile-pause">Pause</a>
      <div class="dropdown-divider"></div>
      <h6 class="dropdown-header target-resolution-header">Target Resolution</h6>
      <form class="btn-group video-tile-config-toggle target-resolution-toggle" role="group">
        <input type="radio" class="btn-check" name="level" value="low" id="resolution-low">
        <label class="btn btn-secondary" id="resolution-low-label" title="low" for="low">Low</label>
        <input type="radio" class="btn-check" name="level" value="medium" id="resolution-medium">
        <label class="btn btn-secondary" id="resolution-medium-label" title="medium" for="medium">Medium</label>
        <input type="radio" class="btn-check" name="level" value="high" id="resolution-high" checked>
        <label class="btn btn-secondary" id="resolution-high-label" title="high" for="high">High</label>
        <input type="radio" class="btn-check" name="level" value="max" id="resolution-max" checked>
        <label class="btn btn-secondary" id="resolution-max-label" title="max" for="max">Max</label>
      </form>
      <h6 class="dropdown-header video-priority-header">Video Priority</h6>
      <form class="btn-group video-tile-config-toggle video-priority-toggle">
        <input type="radio" class="btn-check" name="level" value="low" id="priority-low">
        <label class="btn btn-secondary" id="priority-low-label" title="low" for="low">Low</label>
        <input type="radio" class="btn-check" name="level" value="medium" id="priority-medium" checked>
        <label class="btn btn-secondary" id="priority-medium-label" title="medium" for="medium">Medium</label>
        <input type="radio" class="btn-check" name="level" value="high" id="priority-high">
        <label class="btn btn-secondary" id="priority-high-label" title="high" for="high">High</label>
        <input type="radio" class="btn-check" name="level" value="max" id="priority-max">
        <label class="btn btn-secondary" id="priority-max-label" title="max" for="max">Max</label>
      </form>
    </div>
  </div>
`;
        // Attendee ID is meant to be used as a unique identifier, hence we have a getter here as well
        this._attendeeId = "";
    }
    set tileIndex(tileIndex) {
        // Update IDs for integration tests which need them
        this.querySelector('.video-tile-nameplate').id = `nameplate-${tileIndex}`;
        this.querySelector('.video-tile-video').id = `video-${tileIndex}`;
        // Bootstrap is not easy to get working with shadow DOMs, and also requires the use of IDs for radio buttons
        // (putting the input within the label doesn't work in Bootstrap 5), so we manually update these IDs to make them
        // unique
        const nonUniqueInputAndLabelIdPrefixes = [
            'priority-low', 'priority-medium', 'priority-high', 'priority-max', 'resolution-low', 'resolution-medium', 'resolution-high', 'resolution-max'
        ];
        for (const prefix of nonUniqueInputAndLabelIdPrefixes) {
            this.querySelector(`#${prefix}`).id = `${prefix}-${tileIndex}`;
            this.querySelector(`#${prefix}-label`).setAttribute('for', `${prefix}-${tileIndex}`);
            this.querySelector(`#${prefix}-label`).id = `${prefix}-label-${tileIndex}`;
        }
    }
    set showConfigDropdown(shouldShow) {
        const display = shouldShow ? 'block' : 'none';
        this.querySelector('.button-video-tile-config-drop').style.display = display;
        this.querySelector('.video-tile-pause').style.display = display;
    }
    set showRemoteVideoPreferences(shouldShow) {
        const display = shouldShow ? 'block' : 'none';
        this.querySelector('.target-resolution-header').style.display = display;
        this.querySelector('.target-resolution-toggle').style.display = display;
        this.querySelector('.video-priority-header').style.display = display;
        this.querySelector('.video-priority-toggle').style.display = display;
    }
    show(isContent) {
        this.classList.add('active');
        if (isContent) {
            this.classList.add('content');
        }
    }
    set featured(featured) {
        if (featured) {
            this.classList.add('featured');
        }
        else {
            this.classList.remove('featured');
        }
    }
    hide() {
        this.classList.remove('active', 'featured', 'content');
    }
    showVideoStats(keyStatstoShow, metricsData, streamDirection) {
        const streams = metricsData ? Object.keys(metricsData) : [];
        if (streams.length === 0) {
            return;
        }
        let statsInfo = this.querySelector('#stats-info');
        if (!statsInfo) {
            statsInfo = document.createElement('div');
            statsInfo.setAttribute('id', 'stats-info');
            statsInfo.setAttribute('class', 'stats-info');
        }
        let statsInfoTable = this.querySelector('#stats-table');
        if (statsInfoTable) {
            statsInfo.removeChild(statsInfoTable);
        }
        statsInfoTable = document.createElement('table');
        statsInfoTable.setAttribute('id', 'stats-table');
        statsInfoTable.setAttribute('class', 'stats-table');
        statsInfo.appendChild(statsInfoTable);
        this.videoElement.insertAdjacentElement('afterend', statsInfo);
        const header = statsInfoTable.insertRow(-1);
        let cell = header.insertCell(-1);
        cell.innerHTML = 'Video statistics';
        for (let cnt = 0; cnt < streams.length; cnt++) {
            cell = header.insertCell(-1);
            cell.innerHTML = `${streamDirection} ${cnt + 1}`;
        }
        for (const ssrc of streams) {
            for (const [metricName, value] of Object.entries(metricsData[ssrc])) {
                if (keyStatstoShow[metricName]) {
                    const row = statsInfoTable.insertRow(-1);
                    row.setAttribute('id', `${metricName}`);
                    cell = row.insertCell(-1);
                    cell.innerHTML = keyStatstoShow[metricName];
                    cell = row.insertCell(-1);
                    cell.innerHTML = `${value}`;
                }
            }
        }
    }
    ;
    get videoElement() {
        return this.querySelector('.video-tile-video');
    }
    set nameplate(nameplate) {
        const nameplateElement = this.querySelector('.video-tile-nameplate');
        console.log(`setting nameplate to ${nameplate}`);
        nameplateElement.innerText = nameplate;
    }
    set attendeeId(attendeeId) {
        console.log(`setting attendeeId to ${attendeeId}`);
        this._attendeeId = attendeeId;
        const attendeeIdElement = this.querySelector('.video-tile-attendee-id');
        attendeeIdElement.innerText = this._attendeeId;
    }
    get attendeeId() {
        return this._attendeeId;
    }
    set pauseState(state) {
        const pauseState = this.querySelector('.video-tile-pause-state');
        pauseState.innerText = state;
    }
    get pauseButtonElement() {
        return this.querySelector('.video-tile-pause');
    }
    get targetResolutionRadioElement() {
        return this.querySelector('.target-resolution-toggle');
    }
    get videoPriorityRadioElement() {
        return this.querySelector('.video-priority-toggle');
    }
    connectedCallback() {
        return __awaiter(this, void 0, void 0, function* () {
            this.innerHTML = this.innerHTMLToInject;
            this.querySelector('.button-video-tile-config-drop').innerHTML = require('../../../node_modules/open-iconic/svg/cog.svg');
            this.className = 'video-tile';
        });
    }
}
exports.DemoVideoTile = DemoVideoTile;
customElements.define('video-tile', DemoVideoTile);
//# sourceMappingURL=VideoTile.js.map