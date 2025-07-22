import { eventBus } from "../bin/EventBus";
import { throttle } from "../bin/timing";

type InactivityWatcherOptions = {
    inactivityDelay?: number;
    target?: EventTarget;
    debug?: boolean;
};

export class InactivityWatcher {
    private inactivityDelay: number;
    private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    private isInactive = false;
    private activityEvents = [
        "mousemove",
        "mousedown",
        "keydown",
        "keyup",
        "keypress",
        "touchstart",
        "scroll",
    ];
    private target: EventTarget;
    private listening = false;
    private debug = false;
    private handleUserActivity: (event: Event) => void;

    constructor({
        inactivityDelay = 30000,
        target = document,
        debug = false,
    }: InactivityWatcherOptions = {}) {
        this.inactivityDelay = Math.max(1000, inactivityDelay);
        this.target = target;
        this.debug = debug;
        this.handleUserActivity = throttle(this.handleActivity.bind(this), 100);
        this.addEventListeners();
        this.startInactivityTimer();
    }

    private log(message: string) {
        if (this.debug) {
            console.log(`[InactivityWatcher] ${message}`);
        }
    }

    private addEventListeners() {
        if (this.listening) return;
        this.log("Attaching event listeners...");
        this.activityEvents.forEach((event) =>
            this.target.addEventListener(event, this.handleUserActivity, {
                passive: true,
                capture: false,
            })
        );
        this.listening = true;
    }

    private removeEventListeners() {
        if (!this.listening) return;
        this.log("Removing event listeners...");
        this.activityEvents.forEach((event) =>
            this.target.removeEventListener(event, this.handleUserActivity, {
                capture: false,
            })
        );
        this.listening = false;
    }

    private startInactivityTimer() {
        this.clearInactivityTimer();
        this.log(`Starting inactivity timer: ${this.inactivityDelay}ms`);
        this.inactivityTimer = setTimeout(() => {
            this.isInactive = true;
            this.log("User inactive");
            eventBus.emit("user:inactive", { duration: this.inactivityDelay });
        }, this.inactivityDelay);
    }

    private clearInactivityTimer() {
        if (this.inactivityTimer) {
            this.log("Clearing inactivity timer");
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    private handleActivity() {
        this.log("User activity detected");
        if (this.isInactive) {
            this.isInactive = false;
            this.log("User became active again");
            eventBus.emit("user:active", { duration: this.inactivityDelay });
        }
        this.startInactivityTimer();
    }

    /**
     * Update the inactivity delay.
     * @param delay - New delay in milliseconds.
     */
    setInactivityDelay(delay: number) {
        this.inactivityDelay = Math.max(1000, delay);
        this.log(`Inactivity delay updated: ${this.inactivityDelay}ms`);
        this.startInactivityTimer();
    }

    /**
     * Returns true if user is currently considered inactive.
     */
    get isInactiveUser(): boolean {
        return this.isInactive;
    }

    /**
     * Manually simulate user activity (useful for custom triggers).
     */
    triggerActivity() {
        this.log("Manual activity triggered");
        this.handleActivity();
    }

    /**
     * Temporarily stops the inactivity watcher.
     */
    pause() {
        this.log("Pausing watcher");
        this.clearInactivityTimer();
        this.removeEventListeners();
    }

    /**
     * Resumes monitoring user activity.
     */
    resume() {
        this.log("Resuming watcher");
        this.addEventListeners();
        this.startInactivityTimer();
    }

    /**
     * Fully stops and cleans up the watcher.
     */
    destroy() {
        this.log("Destroying watcher");
        this.clearInactivityTimer();
        this.removeEventListeners();
    }
}
