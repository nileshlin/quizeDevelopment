declare class Attendee {
    name: string;
    id: string;
    muted: boolean;
    signalStrength: number;
    speaking: boolean;
    isContentAttendee: boolean;
    constructor(id: string, name: string);
}
/**
 * Class to allow handling the UI interactions and display associated with the roster section.
 */
export default class Roster {
    static readonly ATTENDEE_ELEMENT_PREFIX: string;
    static readonly CONTAINER_ID = "roster";
    attendeeInfoMap: Map<string, Attendee>;
    selectedAttendeeSet: Set<Attendee>;
    /**
     * Returns a boolean indicating if the attendeeId is part of the roster or not.
     */
    hasAttendee(attendeeId: string): boolean;
    /**
     * Returns the list of all the attendees part of the roster.
     */
    getAllAttendeeIds(): string[];
    /**
     * Adds a new attendee to the roster
     * @param attendeeId - the id to be associated with the attendee
     * @param attendeeName - the name of the attendee
     */
    addAttendee(attendeeId: string, attendeeName: string, allowAttendeeCapabilities: boolean): void;
    /**
     * Remove the attendee from the roster
     * @param attendeeId
     * @returns
     * true - if we were able to remove an attendee successfully
     * false - if the attendeeId does not exist
     */
    removeAttendee(attendeeId: string): boolean;
    /**
     * Sets the mute status of the attendee
     * @param attendeeId - the attendeeId for whom we intend to set the mute status.
     * @param status - boolean value indicating if the attendee is muted or not.
     */
    setMuteStatus(attendeeId: string, status: boolean): void;
    /**
     * Sets the audio signal strength of the attendee. This helps indicate the network connection of the attendee.
     * @param attendeeId - the attendeeId for whom we intend to set the audio signal strength.
     * @param signal - value indicating the signal strength.
     */
    setSignalStrength(attendeeId: string, signal: number): void;
    /**
     * Sets the speaking status of the attendee
     * @param attendeeId - the attendeeId for whom we intend to set the speaking status.
     * @param status - boolean value indicating if the attendee is speaking or not.
     */
    setAttendeeSpeakingStatus(attendeeId: string, status: boolean): void;
    /**
     * Clears the roster state.
     */
    clear(): void;
    unselectAll(): void;
    private getContainerElement;
    private handleRosterStatusUpdate;
    private updateRosterMenu;
}
export {};
