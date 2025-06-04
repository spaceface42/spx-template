/**
 * Watches for user inactivity and triggers callbacks when inactivity starts or ends.
 * Also pauses inactivity detection when the page is hidden (using the Page Visibility API).
 *
 * @example
 * import { InactivityWatcher } from './InactivityWatcher.js';
 * const watcher = new InactivityWatcher({
 *   inactivityDelay: 30000, // ms
 *   onInactivity: () => { /* start your slideshow class here *\/ },
 *   onActivity: () => { /* stop your slideshow class here *\/ }
 * });
 */
export class InactivityWatcher {
    /**
     * @param {Object} options
     * @param {number} [options.inactivityDelay=30000] - Delay in ms before considering the user inactive.
     * @param {function} [options.onInactivity] - Callback when inactivity is detected.
     * @param {function} [options.onActivity] - Callback when activity resumes after inactivity.
     */
    constructor({ inactivityDelay = 30000, onInactivity, onActivity }) {
        this.inactivityDelay = inactivityDelay;
        this.onInactivity = onInactivity;
        this.onActivity = onActivity;
        this.inactivityTimer = null;
        this.isInactive = false;
        this._destroyed = false;
        this._paused = false;

        this.handleUserActivity = this.handleUserActivity.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

        this.activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        this.activityEvents.forEach(event =>
            document.addEventListener(event, this.handleUserActivity, { passive: true })
        );

        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        this.startInactivityTimer();
    }

    /**
     * Starts or restarts the inactivity timer.
     */
    startInactivityTimer() {
        if (this._destroyed || this._paused) return;

        this.clearInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
            if (!this._destroyed && !this._paused) {
                this.isInactive = true;
                if (typeof this.onInactivity === 'function') {
                    this.onInactivity();
                }
            }
        }, this.inactivityDelay);
    }

    /**
     * Clears the inactivity timer.
     */
    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    /**
     * Handles user activity events.
     */
    handleUserActivity() {
        if (this._destroyed || this._paused) return;

        if (this.isInactive) {
            this.isInactive = false;
            if (typeof this.onActivity === 'function') {
                this.onActivity();
            }
        }
        this.startInactivityTimer();
    }

    /**
     * Handles page visibility changes (pauses/resumes inactivity detection).
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this._paused = true;
            this.clearInactivityTimer();
        } else {
            this._paused = false;
            this.startInactivityTimer();
        }
    }

    /**
     * Cleans up event listeners and timers.
     */
    destroy() {
        this._destroyed = true;
        this.clearInactivityTimer();
        this.activityEvents.forEach(event =>
            document.removeEventListener(event, this.handleUserActivity)
        );
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        // Clear references
        this.onInactivity = null;
        this.onActivity = null;
    }
}
