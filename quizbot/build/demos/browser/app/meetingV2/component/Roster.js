"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
class Attendee {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.signalStrength = 1;
        this.isContentAttendee = new amazon_chime_sdk_js_1.DefaultModality(id).hasModality(amazon_chime_sdk_js_1.DefaultModality.MODALITY_CONTENT);
    }
}
/**
 * Class to allow handling the UI interactions and display associated with the roster section.
 */
class Roster {
    constructor() {
        this.attendeeInfoMap = new Map();
        this.selectedAttendeeSet = new Set();
    }
    /**
     * Returns a boolean indicating if the attendeeId is part of the roster or not.
     */
    hasAttendee(attendeeId) {
        return this.attendeeInfoMap.has(attendeeId);
    }
    /**
     * Returns the list of all the attendees part of the roster.
     */
    getAllAttendeeIds() {
        let attendeeIds = [];
        const attendeeIterator = this.attendeeInfoMap.keys();
        for (let index = 0; index < this.attendeeInfoMap.size; index++) {
            attendeeIds.push(attendeeIterator.next().value);
        }
        return attendeeIds;
    }
    /**
     * Adds a new attendee to the roster
     * @param attendeeId - the id to be associated with the attendee
     * @param attendeeName - the name of the attendee
     */
    addAttendee(attendeeId, attendeeName, allowAttendeeCapabilities) {
        if (this.hasAttendee(attendeeId)) {
            return;
        }
        const attendee = new Attendee(attendeeId, attendeeName);
        this.attendeeInfoMap.set(attendeeId, attendee);
        // Construt a new attendee element
        const attendeeElement = document.createElement('li');
        const attendeeNameElement = document.createElement('span');
        const attendeeStatusElement = document.createElement('span');
        const attendeeCheckbox = document.createElement('input');
        // For the content attendee, set it to invisible to maintain the layout.
        attendeeCheckbox.className = 'roster-checkbox form-check-input m-0 flex-shrink-0 ' + (attendee.isContentAttendee ? ' invisible' : '');
        attendeeCheckbox.type = 'checkbox';
        attendeeCheckbox.value = '';
        attendeeCheckbox.addEventListener('change', () => {
            if (attendeeCheckbox.checked) {
                this.selectedAttendeeSet.add(attendee);
            }
            else {
                this.selectedAttendeeSet.delete(attendee);
            }
            this.updateRosterMenu();
        });
        attendeeNameElement.className = 'name flex-grow-1 text-truncate';
        attendeeNameElement.innerText = attendeeName;
        attendeeStatusElement.className = 'status';
        attendeeElement.className = 'list-group-item d-flex align-items-center gap-2';
        attendeeElement.id = Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId;
        if (allowAttendeeCapabilities) {
            attendeeElement.classList.add('ps-2');
            attendeeElement.appendChild(attendeeCheckbox);
        }
        attendeeElement.appendChild(attendeeNameElement);
        attendeeElement.appendChild(attendeeStatusElement);
        const containerElement = this.getContainerElement();
        containerElement.appendChild(attendeeElement);
    }
    /**
     * Remove the attendee from the roster
     * @param attendeeId
     * @returns
     * true - if we were able to remove an attendee successfully
     * false - if the attendeeId does not exist
     */
    removeAttendee(attendeeId) {
        if (!this.hasAttendee(attendeeId)) {
            return false;
        }
        // Remove from the element from the roster
        const containerElement = this.getContainerElement();
        const childToDelete = document.getElementById(Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId);
        containerElement.removeChild(childToDelete);
        this.selectedAttendeeSet.delete(this.attendeeInfoMap.get(attendeeId));
        this.updateRosterMenu();
        this.attendeeInfoMap.delete(attendeeId);
        return true;
    }
    /**
     * Sets the mute status of the attendee
     * @param attendeeId - the attendeeId for whom we intend to set the mute status.
     * @param status - boolean value indicating if the attendee is muted or not.
     */
    setMuteStatus(attendeeId, status) {
        if (!this.hasAttendee(attendeeId)) {
            return;
        }
        const attendee = this.attendeeInfoMap.get(attendeeId);
        attendee.muted = status;
        this.handleRosterStatusUpdate(attendeeId);
    }
    /**
     * Sets the audio signal strength of the attendee. This helps indicate the network connection of the attendee.
     * @param attendeeId - the attendeeId for whom we intend to set the audio signal strength.
     * @param signal - value indicating the signal strength.
     */
    setSignalStrength(attendeeId, signal) {
        if (!this.hasAttendee(attendeeId)) {
            return;
        }
        const attendee = this.attendeeInfoMap.get(attendeeId);
        attendee.signalStrength = signal;
        this.handleRosterStatusUpdate(attendeeId);
    }
    /**
     * Sets the speaking status of the attendee
     * @param attendeeId - the attendeeId for whom we intend to set the speaking status.
     * @param status - boolean value indicating if the attendee is speaking or not.
     */
    setAttendeeSpeakingStatus(attendeeId, status) {
        if (!this.hasAttendee(attendeeId)) {
            return;
        }
        const attendee = this.attendeeInfoMap.get(attendeeId);
        attendee.speaking = status;
        this.handleRosterStatusUpdate(attendeeId);
    }
    /**
     * Clears the roster state.
     */
    clear() {
        const container = this.getContainerElement();
        container.innerHTML = "";
        this.attendeeInfoMap.clear();
        this.unselectAll();
    }
    unselectAll() {
        this.selectedAttendeeSet.clear();
        this.updateRosterMenu();
        for (const checkboxElement of Array.from(document.getElementsByClassName('roster-checkbox'))) {
            checkboxElement.checked = false;
        }
    }
    getContainerElement() {
        return document.getElementById(Roster.CONTAINER_ID);
    }
    handleRosterStatusUpdate(attendeeId) {
        let statusText = '\xa0'; // &nbsp
        let statusClass = 'status badge rounded-pill ';
        const attendee = this.attendeeInfoMap.get(attendeeId);
        if (attendee.signalStrength < 1) {
            statusClass += 'bg-warning';
        }
        else if (attendee.signalStrength === 0) {
            statusClass = 'bg-danger';
        }
        else if (attendee.muted) {
            statusText = 'MUTED';
            statusClass += 'bg-secondary';
        }
        else if (attendee.speaking) {
            statusText = 'SPEAKING';
            statusClass += 'bg-success';
        }
        const attendeeElement = document.getElementById(Roster.ATTENDEE_ELEMENT_PREFIX + attendeeId);
        const attendeeStatusElement = attendeeElement.getElementsByClassName('status')[0];
        attendeeStatusElement.className = statusClass;
        attendeeStatusElement.innerText = statusText;
    }
    updateRosterMenu() {
        const instruction = document.getElementById('roster-menu-instruction');
        const rosterMenuOneAttendee = document.getElementById('roster-menu-one-attendee');
        const rosterMenuNoneSelected = document.getElementById('roster-menu-none-seleced');
        const rosterMenuAllAttendeesExcept = document.getElementById('roster-menu-all-attendees-except');
        const rosterMenuAllAttendeesExceptLabel = document.getElementById('roster-menu-all-attendees-except-label');
        const size = this.selectedAttendeeSet.size;
        if (size > 0) {
            instruction.innerText = `${size} selected`;
            rosterMenuNoneSelected.classList.add('hidden');
            rosterMenuAllAttendeesExceptLabel.innerText = `Update all attendees, except ${size} selected`;
            if (size === 1) {
                // If one attendee is selected, provide two options:
                // - Update one attendee only, using the update-attendee-capabilities API
                // - Update all attendees, except the selected one, using the batch-update-attendee-capabilities-except API
                rosterMenuOneAttendee.classList.remove('hidden');
                rosterMenuAllAttendeesExcept.classList.remove('hidden');
            }
            else if (size > 1) {
                // If multiple attendees are selected, provide the following option:
                // - Update all attendees, except the selected one, using the batch-update-attendee-capabilities-except API
                rosterMenuOneAttendee.classList.add('hidden');
                rosterMenuAllAttendeesExcept.classList.remove('hidden');
            }
        }
        else {
            instruction.innerText = '';
            rosterMenuAllAttendeesExceptLabel.innerText = `Update all attendees`;
            // If none are selected, show the instruction.
            rosterMenuNoneSelected.classList.remove('hidden');
            rosterMenuOneAttendee.classList.add('hidden');
            rosterMenuAllAttendeesExcept.classList.add('hidden');
        }
    }
}
exports.default = Roster;
Roster.ATTENDEE_ELEMENT_PREFIX = "roster-";
Roster.CONTAINER_ID = 'roster';
//# sourceMappingURL=Roster.js.map