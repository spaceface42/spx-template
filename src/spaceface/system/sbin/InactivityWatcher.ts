import { eventBus } from "../bin/EventBus.js";
import { throttle } from "../bin/timing.js";

type InactivityWatcherOptions = {
    inactivityDelay?: number;
    target?: EventTarget;
    debug?: boolean;
};

export class InactivityWatcher {
    private static instance: InactivityWatcher | null = null;

    private inactivityDelay: number;
    private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    private isInactive = false;
    private readonly activityEvents = [
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
    private readonly handleUserActivity: (event: Event) => void;

    private constructor({
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

    static getInstance(options: InactivityWatcherOptions = {}): InactivityWatcher {
        if (!this.instance) {
            this.instance = new InactivityWatcher(options);
        }
        return this.instance;
    }

    private log(message: string) {
        if (this.debug) console.log(`[InactivityWatcher] ${message}`);
    }

    private addEventListeners() {
        if (this.listening) return;
        this.log("Attaching event listeners...");
        this.activityEvents.forEach(event =>
            this.target.addEventListener(event, this.handleUserActivity, { passive: true })
        );
        this.listening = true;
    }

    private removeEventListeners() {
        if (!this.listening) return;
        this.log("Removing event listeners...");
        this.activityEvents.forEach(event =>
            this.target.removeEventListener(event, this.handleUserActivity)
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
        InactivityWatcher.instance = null;
    }
}
