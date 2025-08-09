import { eventBus } from "../bin/EventBus.js";
import { throttle } from "../bin/timing.js";
import { BaseWatcher } from "./BaseWatcher.js";
export class InactivityWatcher extends BaseWatcher {
    static instance = null;
    inactivityDelay;
    inactivityTimer = null;
    isInactive = false;
    activityEvents = [
        "mousemove",
        "mousedown",
        "keydown",
        "keyup",
        "keypress",
        "touchstart",
        "scroll",
    ];
    handleUserActivity;
    constructor({ inactivityDelay = 30000, target = document, debug = false, } = {}) {
        super(target, debug);
        this.inactivityDelay = Math.max(1000, inactivityDelay);
        this.handleUserActivity = throttle(this.handleActivity.bind(this), 100);
        this.addEventListeners();
        this.startInactivityTimer();
    }
    static getInstance(options = {}) {
        if (!this.instance) {
            this.instance = new InactivityWatcher(options);
        }
        return this.instance;
    }
    addEventListeners() {
        if (this.listening)
            return;
        this.log("Attaching event listeners...");
        this.activityEvents.forEach(event => this.target.addEventListener(event, this.handleUserActivity, { passive: true }));
        this.listening = true;
    }
    removeEventListeners() {
        if (!this.listening)
            return;
        this.log("Removing event listeners...");
        this.activityEvents.forEach(event => this.target.removeEventListener(event, this.handleUserActivity));
        this.listening = false;
    }
    startInactivityTimer() {
        this.clearInactivityTimer();
        this.log(`Starting inactivity timer: ${this.inactivityDelay}ms`);
        this.inactivityTimer = setTimeout(() => {
            this.isInactive = true;
            this.log("User inactive");
            eventBus.emit("user:inactive", { duration: this.inactivityDelay });
        }, this.inactivityDelay);
    }
    clearInactivityTimer() {
        if (this.inactivityTimer) {
            this.log("Clearing inactivity timer");
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }
    handleActivity() {
        this.log("User activity detected");
        if (this.isInactive) {
            this.isInactive = false;
            this.log("User became active again");
            eventBus.emit("user:active", { duration: this.inactivityDelay });
        }
        this.startInactivityTimer();
    }
    setInactivityDelay(delay) {
        this.inactivityDelay = Math.max(1000, delay);
        this.log(`Inactivity delay updated: ${this.inactivityDelay}ms`);
        this.startInactivityTimer();
    }
    get isInactiveUser() {
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
        super.destroy();
        this.clearInactivityTimer();
        InactivityWatcher.instance = null;
    }
}
