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
exports.DemoMessagingSessionApp = void 0;
// @ts-nocheck
require("../../style.scss");
require("bootstrap");
const amazon_chime_sdk_js_1 = require("amazon-chime-sdk-js");
const client_chime_sdk_messaging_1 = require("@aws-sdk/client-chime-sdk-messaging");
class DemoMessagingSessionApp {
    constructor() {
        this.prefetchOn = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        global.app = this;
        document.getElementById('sdk-version').innerText =
            'amazon-chime-sdk-js@' + amazon_chime_sdk_js_1.Versioning.sdkVersion;
        document.getElementById('userArn').focus();
        this.initEventListeners();
        this.initParameters();
        this.switchToFlow('flow-connect');
    }
    initParameters() {
        this.logger = new amazon_chime_sdk_js_1.ConsoleLogger('SDK', amazon_chime_sdk_js_1.LogLevel.INFO);
    }
    initEventListeners() {
        document.getElementById('connect').addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.fetchCredentials();
                const chime = new client_chime_sdk_messaging_1.ChimeSDKMessagingClient({ region: 'us-east-1', credentials: response });
                this.userArn = document.getElementById('userArn').value;
                this.sessionId = document.getElementById('sessionId').value;
                this.prefetchSortByUnread = document.getElementById('prefetchSortByUnread').checked;
                this.prefetchSortByLastMessageTimestamp = document.getElementById('prefetchSortByLastMessageTimestamp').checked;
                this.configuration = new amazon_chime_sdk_js_1.MessagingSessionConfiguration(this.userArn, this.sessionId, undefined, chime);
                if (this.prefetchSortByUnread) {
                    this.configuration.prefetchOn = amazon_chime_sdk_js_1.PrefetchOn.Connect;
                    this.configuration.prefetchSortBy = amazon_chime_sdk_js_1.PrefetchSortBy.Unread;
                }
                else if (this.prefetchSortByLastMessageTimestamp) {
                    this.configuration.prefetchOn = amazon_chime_sdk_js_1.PrefetchOn.Connect;
                    this.configuration.prefetchSortBy = amazon_chime_sdk_js_1.PrefetchSortBy.LastMessageTimestamp;
                }
                this.session = new amazon_chime_sdk_js_1.DefaultMessagingSession(this.configuration, this.logger);
                this.session.addObserver(this);
                yield this.session.start();
            }
            catch (error) {
                console.error(error);
                console.error(`Failed to start a session: ${error.reason}`);
            }
        }));
        document.getElementById('disconnect').addEventListener('click', () => {
            var _a;
            (_a = this.session) === null || _a === void 0 ? void 0 : _a.stop();
        });
        document.getElementById('clear').addEventListener('click', () => {
            this.clearMessages();
        });
    }
    messagingSessionDidStart() {
        console.log('Session started');
        this.switchToFlow('flow-message');
    }
    messagingSessionDidStartConnecting(reconnecting) {
        if (reconnecting) {
            console.log('Start reconnecting');
        }
        else {
            console.log('Start connecting');
        }
    }
    messagingSessionDidStop(event) {
        console.log(`Closed: ${event.code} ${event.reason}`);
        // @ts-ignore
        window.location = window.location.pathname;
        this.clearMessages();
        this.switchToFlow('flow-connect');
    }
    messagingSessionDidReceiveMessage(message) {
        const messagesDiv = document.getElementById('messages');
        const messageTypeDiv = document.createElement('div');
        messageTypeDiv.classList.add('font-weight-bold');
        messageTypeDiv.innerText = message.type;
        messagesDiv.appendChild(messageTypeDiv);
        if (message.headers) {
            this.appendMessage('headers:', message.headers);
        }
        if (message.payload) {
            this.appendMessage('payload:', message.payload);
        }
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    appendMessage(headingTitle, content) {
        const messagesDiv = document.getElementById('messages');
        const newMessageDiv = document.createElement('div');
        const newMessageHeadingDiv = document.createElement('div');
        newMessageHeadingDiv.innerText = headingTitle;
        newMessageDiv.appendChild(newMessageHeadingDiv);
        const newMessageContentPre = document.createElement('pre');
        newMessageContentPre.innerText = JSON.stringify(content, null, 4);
        this.updateProperty(newMessageContentPre.style, 'overflow', 'unset');
        newMessageDiv.appendChild(newMessageContentPre);
        messagesDiv.appendChild(newMessageDiv);
    }
    switchToFlow(flow) {
        Array.from(document.getElementsByClassName('flow')).map(e => (e.style.display = 'none'));
        document.getElementById(flow).style.display = 'block';
    }
    clearMessages() {
        document.getElementById('messages').innerText = '';
    }
    // eslint-disable-next-line
    fetchCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${DemoMessagingSessionApp.BASE_URL}fetch_credentials`, {
                method: 'GET',
            });
            const json = yield response.json();
            if (json.error) {
                throw new Error(`Server error: ${json.error}`);
            }
            return json;
        });
    }
    updateProperty(obj, key, value) {
        if (value !== undefined && obj[key] !== value) {
            obj[key] = value;
        }
    }
}
exports.DemoMessagingSessionApp = DemoMessagingSessionApp;
DemoMessagingSessionApp.BASE_URL = [
    location.protocol,
    '//',
    location.host,
    location.pathname.replace(/\/*$/, '/'),
].join('');
window.addEventListener('load', () => {
    new DemoMessagingSessionApp();
});
//# sourceMappingURL=messagingSession.js.map