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
  /**
   * @param {Object} options
   * @param {number} [options.inactivityDelay=30000] - Delay in ms before considering the user inactive.
   * @param {Function} options.onInactivity - Called when inactivity is detected.
   * @param {Function} options.onActivity - Called when user becomes active again.
   */
  constructor({ inactivityDelay = 30000, onInactivity, onActivity }) {
    this.inactivityDelay = inactivityDelay;
    this.onInactivity = onInactivity;
    this.onActivity = onActivity;
    this.inactivityTimer = null;
    this.isInactive = false;

    this.handleUserActivity = this.handleUserActivity.bind(this);

    this.activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    this.activityEvents.forEach(event =>
      document.addEventListener(event, this.handleUserActivity, { passive: true })
    );

    this.startInactivityTimer();
  }

  startInactivityTimer() {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      this.isInactive = true;
      if (typeof this.onInactivity === 'function') {
        this.onInactivity();
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
    if (this.isInactive) {
      this.isInactive = false;
      if (typeof this.onActivity === 'function') {
        this.onActivity();
      }
    }
    this.startInactivityTimer();
  }

  destroy() {
    this.clearInactivityTimer();
    this.activityEvents.forEach(event =>
      document.removeEventListener(event, this.handleUserActivity)
    );
  }
}