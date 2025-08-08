import { eventBus } from "../bin/EventBus.js";
import { throttle } from "../bin/timing.js";

type InactivityWatcherOptions = {
    inactivityDelay?: number;
    target?: EventTarget;
    debug?: boolean;
};

const ACTIVITY_EVENTS: readonly string[] = [
    "mousemove",
    "mousedown",
    "keydown",
    "keyup",
    "keypress",
    "touchstart",
    "scroll",
] as const;

const ADD_OPTS: AddEventListenerOptions = { passive: true, capture: false };
const REMOVE_OPTS: EventListenerOptions = { capture: false };

export class InactivityWatcher {
    private inactivityDelay: number;
    private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    private isInactive = false;
    private readonly target: EventTarget;
    private listening = false;
    private readonly debug: boolean;
    private readonly handleUserActivity: (event: Event) => void;

    constructor({
        inactivityDelay = 30000,
        target = document,
        debug = false,
    }: InactivityWatcherOptions = {}) {
        this.inactivityDelay = Math.max(1000, inactivityDelay);
        this.target = target;
        this.debug = debug;
        this.handleUserActivity = throttle(() => this.handleActivity(), 100);
        this.addEventListeners();
        this.startInactivityTimer();
    }

    private log(message: string) {
        if (this.debug) console.log(`[InactivityWatcher] ${message}`);
    }

    private addEventListeners() {
        if (this.listening) return;
        this.log("Attaching event listeners...");
        for (const event of ACTIVITY_EVENTS) {
            this.target.addEventListener(event, this.handleUserActivity, ADD_OPTS);
        }
        this.listening = true;
    }

    private removeEventListeners() {
        if (!this.listening) return;
        this.log("Removing event listeners...");
        for (const event of ACTIVITY_EVENTS) {
            this.target.removeEventListener(event, this.handleUserActivity, REMOVE_OPTS);
        }
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
        if (this.inactivityTimer !== null) {
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

    setInactivityDelay(delay: number) {
        this.inactivityDelay = Math.max(1000, delay);
        this.log(`Inactivity delay updated: ${this.inactivityDelay}ms`);
        this.startInactivityTimer();
    }

    get isInactiveUser(): boolean {
        return this.isInactive;
    }

    triggerActivity() {
        this.log("Manual activity triggered");
        this.handleActivity();
    }

    pause() {
        this.log("Pausing watcher");
        this.clearInactivityTimer();
        this.removeEventListeners();
    }

    resume() {
        this.log("Resuming watcher");
        this.addEventListeners();
        this.startInactivityTimer();
    }

    destroy() {
        this.log("Destroying watcher");
        this.clearInactivityTimer();
        this.removeEventListeners();
    }
}
