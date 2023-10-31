export default class MeetingToast extends HTMLElement {
    innerHTMLToInject: string;
    set message(message: string);
    set delay(delay: string);
    addButton(label: string, action: () => void): void;
    show(): void;
    hide(): void;
    connectedCallback(): void;
}
