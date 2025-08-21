import { eventBus } from "../bin/EventBus.js";
import { throttle } from "../bin/timing.js";
import { EventBinder } from "../bin/EventBinder.js";
import { BaseWatcher } from "./BaseWatcher.js";

/**
 * InactivityWatcher (Advanced Refactor)
 * -------------------------------------
 * A robust, configurable inactivity detector that emits `user:inactive` and
 * `user:active` events via the eventBus, with optional singleton mode,
 * visibility awareness, throttled activity handling, and full lifecycle control.
 *
 * Major improvements:
 * - Optional singleton (default true) **or** multiple instances via `.create()` / `new`.
 * - Uses EventBinder for clean listener management and bulletproof cleanup.
 * - Visibility-aware: pauses timer when tab is hidden (configurable).
 * - Timestamp-based state (`lastActiveAt`, `inactiveAt`) with helpers to compute durations.
 * - Strongly-typed event payloads and configurable watched events.
 * - Safer lifecycle: `pause()`, `resume()`, `destroy()` are idempotent and race-safe.
 */

export interface InactivityWatcherOptions {
  /** Delay (ms) before considering the user inactive. Min 1000ms. Default: 30000 */
  inactivityDelay?: number;
  /** Target to listen on. Default: document */
  target?: Document | HTMLElement | Window;
  /** Log debug messages */
  debug?: boolean;
  /** If true (default), `getInstance()` will return/reuse a singleton. */
  singleton?: boolean;
  /** Events to treat as activity. Default: sensible desktop/mobile set. */
  events?: string[];
  /** Throttle interval (ms) for activity handler. Default: 100 */
  throttleMs?: number;
  /** Add passive listeners when supported. Default: true */
  passive?: boolean;
  /** Pause timers when document is hidden (visibility API). Default: true */
  pauseOnHidden?: boolean;
  /** Emit an initial `user:active` on construction/resume. Default: false */
  emitLeadingActive?: boolean;
}

export interface InactivityEventPayload {
  inactivityDelay: number;      // ms threshold
  lastActiveAt: number;         // performance.now()
  inactiveAt?: number | null;   // set for inactive event
  visible: boolean;             // document.visibilityState === 'visible'
}

export class InactivityWatcher extends BaseWatcher {
  private static _instance: InactivityWatcher | null = null;

  // Options
  private inactivityDelay: number;
  private readonly singleton: boolean;
  private readonly passive: boolean;
  private readonly pauseOnHidden: boolean;
  private readonly emitLeadingActive: boolean;
  private readonly throttleMs: number;
  private readonly activityEvents: string[];

  // Infra
  private readonly binder = new EventBinder(true);

  // Timers / state
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private isInactive = false;
  private lastActiveAt = performance.now();
  private inactiveAt: number | null = null;

  /**
   * Use `InactivityWatcher.getInstance(opts)` to use singleton (default),
   * or `new InactivityWatcher(opts)` / `InactivityWatcher.create(opts)` to create standalone instances.
   */
  constructor({
    inactivityDelay = 30000,
    target = document,
    debug = false,
    singleton = false, // explicit when using `new`; `getInstance` forces true
    events,
    throttleMs = 100,
    passive = true,
    pauseOnHidden = true,
    emitLeadingActive = false,
  }: InactivityWatcherOptions = {}) {
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
  static create(opts: InactivityWatcherOptions = {}) {
    return new InactivityWatcher({ ...opts, singleton: false });
  }

  /** Singleton accessor. If `options.singleton === false`, returns a new instance instead. */
  static getInstance(options: InactivityWatcherOptions = {}): InactivityWatcher {
    if (options.singleton === false) return InactivityWatcher.create(options);
    if (!this._instance) {
      this._instance = new InactivityWatcher({ ...options, singleton: true });
    }
    return this._instance;
  }

  // ---------------------------------------------------------------------------
  // Event wiring
  protected override addEventListeners() {
    if (this.listening) return;
    this.log("Attaching event listeners...");

    const handleActivity = throttle(() => this.onActivity(), this.throttleMs);

    // Activity events on target
    for (const evt of this.activityEvents) {
      this.binder.bindDOM(this.target as any, evt, handleActivity as EventListener, { passive: this.passive } as AddEventListenerOptions);
    }

    // Visibility handling
    if (this.pauseOnHidden && typeof document !== "undefined" && "visibilityState" in document) {
      this.binder.bindDOM(document, "visibilitychange", () => this.onVisibilityChange());
    }

    this.listening = true;
  }

  protected override removeEventListeners() {
    if (!this.listening) return;
    this.log("Removing event listeners...");
    this.binder.unbindAll();
    this.listening = false;
  }

  // ---------------------------------------------------------------------------
  // Core logic
  private onVisibilityChange() {
    const visible = document.visibilityState === "visible";
    if (!this.pauseOnHidden) return;

    if (visible) {
      // Consider visibility a form of activity
      this.log("Tab became visible → resuming timer");
      this.onActivity();
    } else {
      this.log("Tab hidden → pausing timer");
      this.clearInactivityTimer();
    }
  }

  private onActivity() {
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

  private startInactivityTimer() {
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

  private clearInactivityTimer() {
    if (this.inactivityTimer) {
      this.log("Clearing inactivity timer");
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  private emitInactive() {
    const payload: InactivityEventPayload = {
      inactivityDelay: this.inactivityDelay,
      lastActiveAt: this.lastActiveAt,
      inactiveAt: this.inactiveAt,
      visible: typeof document === "undefined" ? true : document.visibilityState === "visible",
    };
    eventBus.emit("user:inactive", payload);
  }

  private emitActive() {
    const payload: InactivityEventPayload = {
      inactivityDelay: this.inactivityDelay,
      lastActiveAt: this.lastActiveAt,
      inactiveAt: null,
      visible: typeof document === "undefined" ? true : document.visibilityState === "visible",
    };
    eventBus.emit("user:active", payload);
  }

  // ---------------------------------------------------------------------------
  // Public API
  setInactivityDelay(delay: number) {
    this.inactivityDelay = Math.max(1000, delay);
    this.log(`Inactivity delay updated: ${this.inactivityDelay}ms`);
    // Restart timer based on new delay
    this.startInactivityTimer();
  }

  setEvents(events: string[]) {
    this.log("Updating watched events");
    this.activityEvents.splice(0, this.activityEvents.length, ...events);
    // Rebind listeners to reflect new events
    this.removeEventListeners();
    this.addEventListeners();
    this.startInactivityTimer();
  }

  get isInactiveUser(): boolean {
    return this.isInactive;
  }

  /** Milliseconds since last user activity (resets on any activity) */
  get timeSinceLastActiveMs(): number {
    return Math.max(0, performance.now() - this.lastActiveAt);
  }

  /** If inactive, how long has the user been inactive (ms). Otherwise 0. */
  get inactiveDurationMs(): number {
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
  resume({ emitActive }: { emitActive?: boolean } = {}) {
    this.log("Resuming watcher");
    this.addEventListeners();
    this.startInactivityTimer();
    if (emitActive || this.emitLeadingActive) {
      this.emitActive();
    }
  }

  public override destroy() {
    super.destroy();
    this.clearInactivityTimer();
    this.removeEventListeners();
    if (this.singleton && InactivityWatcher._instance === this) {
      InactivityWatcher._instance = null;
    }
  }
}
