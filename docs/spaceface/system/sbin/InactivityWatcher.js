import { eventBus } from "../bin/EventBus.js";
import { throttle } from "../bin/timing.js";
import { EventBinder } from "../bin/EventBinder.js";
import { BaseWatcher } from "./BaseWatcher.js";
export class InactivityWatcher extends BaseWatcher {
    static _instance = null;
    // Options
    inactivityDelay;
    singleton;
    passive;
    pauseOnHidden;
    emitLeadingActive;
    throttleMs;
    activityEvents;
    // Infra
    binder = new EventBinder(true);
    // Timers / state
    inactivityTimer = null;
    isInactive = false;
    lastActiveAt = performance.now();
    inactiveAt = null;
    /**
     * Use `InactivityWatcher.getInstance(opts)` to use singleton (default),
     * or `new InactivityWatcher(opts)` / `InactivityWatcher.create(opts)` to create standalone instances.
     */
    constructor({ inactivityDelay = 30000, target = document, debug = false, singleton = false, // explicit when using `new`; `getInstance` forces true
    events, throttleMs = 100, passive = true, pauseOnHidden = true, emitLeadingActive = false, } = {}) {
        super(target, debug);
        this.inactivityDelay = Math.max(1000, inactivityDelay);
        this.singleton = !!singleton;
        this.throttleMs = Math.max(0, throttleMs);
        this.passive = !!passive;
        this.pauseOnHidden = !!pauseOnHidden;
        this.emitLeadingActive = !!emitLeadingActive;
        this.activityEvents = events ?? [
            "mousemove",
            "mousedown",
            "keydown",
            "keyup",
            "touchstart",
            "scroll",
            "wheel",
            "pointerdown",
            "pointermove",
        ];
        // Bind listeners & start watching
        this.addEventListeners();
        this.startInactivityTimer();
        if (this.emitLeadingActive) {
            this.emitActive();
        }
    }
    /** Preferred for multi-instance usage without singleton side-effects */
    static create(opts = {}) {
        return new InactivityWatcher({ ...opts, singleton: false });
    }
    /** Singleton accessor. If `options.singleton === false`, returns a new instance instead. */
    static getInstance(options = {}) {
        if (options.singleton === false)
            return InactivityWatcher.create(options);
        if (!this._instance) {
            this._instance = new InactivityWatcher({ ...options, singleton: true });
        }
        return this._instance;
    }
    // ---------------------------------------------------------------------------
    // Event wiring
    addEventListeners() {
        if (this.listening)
            return;
        this.log("Attaching event listeners...");
        const handleActivity = throttle(() => this.onActivity(), this.throttleMs);
        // Activity events on target
        for (const evt of this.activityEvents) {
            this.binder.bindDOM(this.target, evt, handleActivity, { passive: this.passive });
        }
        // Visibility handling
        if (this.pauseOnHidden && typeof document !== "undefined" && "visibilityState" in document) {
            this.binder.bindDOM(document, "visibilitychange", () => this.onVisibilityChange());
        }
        this.listening = true;
    }
    removeEventListeners() {
        if (!this.listening)
            return;
        this.log("Removing event listeners...");
        this.binder.unbindAll();
        this.listening = false;
    }
    // ---------------------------------------------------------------------------
    // Core logic
    onVisibilityChange() {
        const visible = document.visibilityState === "visible";
        if (!this.pauseOnHidden)
            return;
        if (visible) {
            // Consider visibility a form of activity
            this.log("Tab became visible → resuming timer");
            this.onActivity();
        }
        else {
            this.log("Tab hidden → pausing timer");
            this.clearInactivityTimer();
        }
    }
    onActivity() {
        this.log("User activity detected");
        const now = performance.now();
        this.lastActiveAt = now;
        if (this.isInactive) {
            // Transition from inactive → active
            this.isInactive = false;
            this.inactiveAt = null;
            this.emitActive();
        }
        // Always restart timer on any activity while visible
        if (!this.pauseOnHidden || (typeof document === "undefined" || document.visibilityState === "visible")) {
            this.startInactivityTimer();
        }
    }
    startInactivityTimer() {
        this.clearInactivityTimer();
        this.log(`Starting inactivity timer: ${this.inactivityDelay}ms`);
        this.inactivityTimer = setTimeout(() => {
            // If hidden and pauseOnHidden, do not mark inactive here
            if (this.pauseOnHidden && typeof document !== "undefined" && document.visibilityState !== "visible") {
                this.log("Timer fired while hidden → ignoring (paused)");
                return;
            }
            this.isInactive = true;
            this.inactiveAt = performance.now();
            this.log("User inactive");
            this.emitInactive();
        }, this.inactivityDelay);
    }
    clearInactivityTimer() {
        if (this.inactivityTimer) {
            this.log("Clearing inactivity timer");
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }
    emitInactive() {
        const payload = {
            inactivityDelay: this.inactivityDelay,
            lastActiveAt: this.lastActiveAt,
            inactiveAt: this.inactiveAt,
            visible: typeof document === "undefined" ? true : document.visibilityState === "visible",
        };
        eventBus.emit("user:inactive", payload);
    }
    emitActive() {
        const payload = {
            inactivityDelay: this.inactivityDelay,
            lastActiveAt: this.lastActiveAt,
            inactiveAt: null,
            visible: typeof document === "undefined" ? true : document.visibilityState === "visible",
        };
        eventBus.emit("user:active", payload);
    }
    // ---------------------------------------------------------------------------
    // Public API
    setInactivityDelay(delay) {
        this.inactivityDelay = Math.max(1000, delay);
        this.log(`Inactivity delay updated: ${this.inactivityDelay}ms`);
        // Restart timer based on new delay
        this.startInactivityTimer();
    }
    setEvents(events) {
        this.log("Updating watched events");
        this.activityEvents.splice(0, this.activityEvents.length, ...events);
        // Rebind listeners to reflect new events
        this.removeEventListeners();
        this.addEventListeners();
        this.startInactivityTimer();
    }
    get isInactiveUser() {
        return this.isInactive;
    }
    /** Milliseconds since last user activity (resets on any activity) */
    get timeSinceLastActiveMs() {
        return Math.max(0, performance.now() - this.lastActiveAt);
    }
    /** If inactive, how long has the user been inactive (ms). Otherwise 0. */
    get inactiveDurationMs() {
        return this.isInactive && this.inactiveAt != null
            ? Math.max(0, performance.now() - this.inactiveAt)
            : 0;
    }
    /** Manually signal an activity burst (e.g., programmatic focus) */
    triggerActivity() {
        this.log("Manual activity triggered");
        this.onActivity();
    }
    /** Temporarily stops detection; does not change `isInactive` flag. */
    pause() {
        this.log("Pausing watcher");
        this.clearInactivityTimer();
        this.removeEventListeners();
    }
    /** Resumes detection and restarts the inactivity timer; emits active optionally */
    resume({ emitActive } = {}) {
        this.log("Resuming watcher");
        this.addEventListeners();
        this.startInactivityTimer();
        if (emitActive || this.emitLeadingActive) {
            this.emitActive();
        }
    }
    destroy() {
        super.destroy();
        this.clearInactivityTimer();
        this.removeEventListeners();
        if (this.singleton && InactivityWatcher._instance === this) {
            InactivityWatcher._instance = null;
        }
    }
}
