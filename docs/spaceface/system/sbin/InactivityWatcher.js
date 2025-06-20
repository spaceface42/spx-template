import { eventBus } from '../bin/EventBus.js';
import { throttle } from '../usr/bin/timing.js';

/**
 * Emits inactivity and activity events based on user input.
 * Events emitted:
 *   - 'user:inactive'
 *   - 'user:active'
 *
 * Example usage:
 *   eventBus.on('user:inactive', (data) => startScreensaver(data.duration));
 *   eventBus.on('user:active', () => stopScreensaver());
 */
export class InactivityWatcher {
  #inactivityDelay;
  #inactivityTimer = null;
  #isInactive = false;
  #activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
  #handleUserActivity = throttle(this.#handleActivity.bind(this), 100);

  /**
   * @param {Object} options
   * @param {number} [options.inactivityDelay=30000] - Delay in ms before user is considered inactive.
   */
  constructor({ inactivityDelay = 30000 } = {}) {
    this.#inactivityDelay = Math.max(1000, inactivityDelay); // Minimum 1 second
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
      eventBus.emit('user:inactive', { duration: this.#inactivityDelay });
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
      eventBus.emit('user:active');
    }
    this.#startInactivityTimer();
  }

  /**
   * Update the inactivity delay.
   * @param {number} delay - New delay in milliseconds.
   */
  setInactivityDelay(delay) {
    this.#inactivityDelay = Math.max(1000, delay);
    this.#startInactivityTimer();
  }

  /**
   * Returns true if user is currently considered inactive.
   * @returns {boolean}
   */
  get isInactive() {
    return this.#isInactive;
  }

  /**
   * Manually simulate user activity (useful for custom triggers).
   */
  triggerActivity() {
    this.#handleActivity();
  }

  /**
   * Temporarily stops the inactivity watcher.
   */
  pause() {
    this.#clearInactivityTimer();
    this.#removeEventListeners();
  }

  /**
   * Resumes monitoring user activity.
   */
  resume() {
    this.#addEventListeners();
    this.#startInactivityTimer();
  }

  /**
   * Fully stops and cleans up the watcher.
   */
  destroy() {
    this.#clearInactivityTimer();
    this.#removeEventListeners();
  }
}
