export declare class DemoVideoTile extends HTMLElement {
    innerHTMLToInject: string;
    set tileIndex(tileIndex: number);
    set showConfigDropdown(shouldShow: boolean);
    set showRemoteVideoPreferences(shouldShow: boolean);
    show(isContent: boolean): void;
    set featured(featured: boolean);
    hide(): void;
    showVideoStats(keyStatstoShow: {
        [key: string]: string;
    }, metricsData: {
        [id: string]: {
            [key: string]: number;
        };
    }, streamDirection: string): void;
    get videoElement(): HTMLVideoElement;
    set nameplate(nameplate: string);
    _attendeeId: string;
    set attendeeId(attendeeId: string);
    get attendeeId(): string;
    set pauseState(state: string);
    get pauseButtonElement(): HTMLButtonElement;
    get targetResolutionRadioElement(): HTMLFormElement;
    get videoPriorityRadioElement(): HTMLFormElement;
    connectedCallback(): Promise<void>;
}
