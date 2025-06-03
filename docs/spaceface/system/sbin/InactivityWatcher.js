/**
 * Watches for user inactivity and triggers callbacks when inactivity starts or ends.
 * Usage:
 *   import InactivityWatcher from './InactivityWatcher.js';
 *   const watcher = new InactivityWatcher({
 *     inactivityDelay: 30000, // ms
 *     onInactivity: () => { /* start your slideshow class here */ },
 *     onActivity: () => { /* stop your slideshow class here */ }
 *   });
 */
export class InactivityWatcher {
  #inactivityDelay;
  #onInactivity;
  #onActivity;
  #inactivityTimer = null;
  #isInactive = false;
  #activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  #handleUserActivity = this.#handleActivity.bind(this);

  /**
   * @param {Object} options
   * @param {number} [options.inactivityDelay=30000] - Delay in ms before considering the user inactive.
   * @param {Function} options.onInactivity - Called when inactivity is detected.
   * @param {Function} options.onActivity - Called when user becomes active again.
   */
  constructor({ inactivityDelay = 30000, onInactivity, onActivity }) {
    if (typeof onInactivity !== 'function' || typeof onActivity !== 'function') {
      throw new Error('onInactivity and onActivity must be functions');
    }

    this.#inactivityDelay = Math.max(1000, inactivityDelay); // Minimum 1 second
    this.#onInactivity = onInactivity;
    this.#onActivity = onActivity;

    this.#addEventListeners();
    this.#startInactivityTimer();
  }

  #addEventListeners() {
    this.#activityEvents.forEach(event =>
      document.addEventListener(event, this.#handleUserActivity, { 
        passive: true,
        capture: false 
      })
    );
  }

  #removeEventListeners() {
    this.#activityEvents.forEach(event =>
      document.removeEventListener(event, this.#handleUserActivity, { capture: false })
    );
  }

  #startInactivityTimer() {
    this.#clearInactivityTimer();
    this.#inactivityTimer = setTimeout(() => {
      this.#isInactive = true;
      this.#onInactivity();
    }, this.#inactivityDelay);
  }

  #clearInactivityTimer() {
    if (this.#inactivityTimer) {
      clearTimeout(this.#inactivityTimer);
      this.#inactivityTimer = null;
    }
  }

  #handleActivity() {
    if (this.#isInactive) {
      this.#isInactive = false;
      this.#onActivity();
    }
    this.#startInactivityTimer();
  }

  /**
   * Updates the inactivity delay
   * @param {number} delay - New delay in milliseconds
   */
  setInactivityDelay(delay) {
    this.#inactivityDelay = Math.max(1000, delay);
    this.#startInactivityTimer(); // Restart timer with new delay
  }

  /**
   * Get current inactivity status
   * @returns {boolean} - True if currently inactive
   */
  get isInactive() {
    return this.#isInactive;
  }

  /**
   * Manually trigger activity (useful for custom events)
   */
  triggerActivity() {
    this.#handleActivity();
  }

  /**
   * Pause the inactivity watcher
   */
  pause() {
    this.#clearInactivityTimer();
    this.#removeEventListeners();
  }

  /**
   * Resume the inactivity watcher
   */
  resume() {
    this.#addEventListeners();
    this.#startInactivityTimer();
  }

  /**
   * Clean up event listeners and timers
   */
  destroy() {
    this.#clearInactivityTimer();
    this.#removeEventListeners();
  }
}