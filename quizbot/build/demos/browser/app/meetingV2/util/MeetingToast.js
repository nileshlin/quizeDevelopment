"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const bootstrap_1 = require("bootstrap");
class MeetingToast extends HTMLElement {
    constructor() {
        super(...arguments);
        this.innerHTMLToInject = `
    <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="10000">
      <div class="toast-body">
        <p class="toast-message"></p>
        <div class="mt-2 pt-2 border-top button-container">
          <button type="button" class="close-button btn btn-secondary btn-sm">Close</button>
        </div>
      </div>
    </div>
  `;
    }
    set message(message) {
        this.querySelector('.toast-message').innerHTML = message;
    }
    set delay(delay) {
        this.querySelector('.toast').setAttribute("data-bs-delay", delay);
    }
    addButton(label, action) {
        let newButton = document.createElement('button');
        newButton.classList.add('btn');
        newButton.classList.add('btn-primary');
        newButton.classList.add('btn-sm');
        newButton.innerHTML = label;
        newButton.addEventListener('click', action);
        const buttonContainer = this.querySelector('.button-container');
        buttonContainer.appendChild(newButton);
    }
    show() {
        const toastElement = this.querySelector('.toast');
        const toast = new bootstrap_1.Toast(toastElement);
        toast.show();
    }
    hide() {
        const toastElement = this.querySelector('.toast');
        const toast = new bootstrap_1.Toast(toastElement);
        toast.hide();
    }
    connectedCallback() {
        this.innerHTML = this.innerHTMLToInject;
        this.className = 'meeting-toast';
        this.querySelector('.close-button').addEventListener('click', () => {
            this.hide();
        });
    }
}
exports.default = MeetingToast;
customElements.define('meeting-toast', MeetingToast);
//# sourceMappingURL=MeetingToast.js.map