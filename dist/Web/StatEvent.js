export class StatEvent {
    /**
     *
     * @param eventCategory This describes the type of events you want to track. For example, Link Clicks, Videos, Outbound Links, and Form Events.
     * @param eventAction This is the specific action that is taken. For example, with the Video category, you might have a Play, Pause and Complete action.
     * @param eventName This is usually the title of the element that is being interacted with, to aid with analysis. For example, it could be the name of a Video that was played or the specific form that is being submitted.
     * @param eventValue This is a numeric value and is often added dynamically. It could be the cost of a product that is added to a cart, or the completion percentage of a video.
     * @returns
     */
    static createEvent(eventCategory, eventAction, eventName = null, eventValue = null) {
        return new CustomEvent(StatEvent.eventName, {
            detail: eventValue !== null
                ? ["trackEvent", eventCategory, eventAction, eventName, eventValue]
                : ["trackEvent", eventCategory, eventAction, eventName].filter((c) => c !== null),
        });
    }
}
StatEvent.eventName = "stat-event";
