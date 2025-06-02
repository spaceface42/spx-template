/**
 * Watches for user inactivity and triggers callbacks when inactivity starts or ends.
 * Usage:
 *   import InactivityWatcher from './InactivityWatcher.js';
 *   const watcher = new InactivityWatcher({
 *     inactivityDelay: 30000, // ms
 *     onInactivity: () => { /* start your slideshow class here *\/ },
 *     onActivity: () => { /* stop your slideshow class here *\/ }
 *   });
 */
export class InactivityWatcher {
    constructor({ inactivityDelay = 30000, onInactivity, onActivity }) {
        this.inactivityDelay = inactivityDelay;
        this.onInactivity = onInactivity;
        this.onActivity = onActivity;
        this.inactivityTimer = null;
        this.isInactive = false;
        this._destroyed = false;

        this.handleUserActivity = this.handleUserActivity.bind(this);

        this.activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        this.activityEvents.forEach(event =>
            document.addEventListener(event, this.handleUserActivity, { passive: true })
        );

        this.startInactivityTimer();
    }

    startInactivityTimer() {
        if (this._destroyed) return;
        
        this.clearInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
            if (!this._destroyed) {
                this.isInactive = true;
                if (typeof this.onInactivity === 'function') {
                    this.onInactivity();
                }
            }
        }, this.inactivityDelay);
    }

    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    handleUserActivity() {
        if (this._destroyed) return;
        
        if (this.isInactive) {
            this.isInactive = false;
            if (typeof this.onActivity === 'function') {
                this.onActivity();
            }
        }
        this.startInactivityTimer();
    }

    destroy() {
        this._destroyed = true;
        this.clearInactivityTimer();
        this.activityEvents.forEach(event =>
            document.removeEventListener(event, this.handleUserActivity)
        );
        // Clear references
        this.onInactivity = null;
        this.onActivity = null;
    }
}