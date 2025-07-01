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
  #handleUserActivity;
  #target;
  #listening = false;
  #debug = false;

  /**
   * @param {Object} options
   * @param {number} [options.inactivityDelay=30000] - Delay in ms before user is considered inactive.
   * @param {EventTarget} [options.target=document] - Target to listen on (e.g. document, shadowRoot).
   * @param {boolean} [options.debug=false] - Enable debug logging.
   */
  constructor({ inactivityDelay = 30000, target = document, debug = false } = {}) {
    this.#inactivityDelay = Math.max(1000, inactivityDelay);
    this.#target = target;
    this.#debug = debug;
    this.#handleUserActivity = throttle(this.#handleActivity.bind(this), 100);
    this.#addEventListeners();
    this.#startInactivityTimer();
  }

  #log(message) {
    if (this.#debug) {
      console.log(`[InactivityWatcher] ${message}`);
    }
  }

  #addEventListeners() {
    if (this.#listening) return;
    this.#log('Attaching event listeners...');
    this.#activityEvents.forEach(event =>
      this.#target.addEventListener(event, this.#handleUserActivity, {
        passive: true,
        capture: false
      })
    );
    this.#listening = true;
  }

  #removeEventListeners() {
    if (!this.#listening) return;
    this.#log('Removing event listeners...');
    this.#activityEvents.forEach(event =>
      this.#target.removeEventListener(event, this.#handleUserActivity, { capture: false })
    );
    this.#listening = false;
  }

  #startInactivityTimer() {
    this.#clearInactivityTimer();
    this.#log(`Starting inactivity timer: ${this.#inactivityDelay}ms`);
    this.#inactivityTimer = setTimeout(() => {
      this.#isInactive = true;
      this.#log('User inactive');
      eventBus.emit('user:inactive', { duration: this.#inactivityDelay });
    }, this.#inactivityDelay);
  }

  #clearInactivityTimer() {
    if (this.#inactivityTimer) {
      this.#log('Clearing inactivity timer');
      clearTimeout(this.#inactivityTimer);
      this.#inactivityTimer = null;
    }
  }

  #handleActivity() {
    this.#log('User activity detected');
    if (this.#isInactive) {
      this.#isInactive = false;
      this.#log('User became active again');
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
    this.#log(`Inactivity delay updated: ${this.#inactivityDelay}ms`);
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
    this.#log('Manual activity triggered');
    this.#handleActivity();
  }

  /**
   * Temporarily stops the inactivity watcher.
   */
  pause() {
    this.#log('Pausing watcher');
    this.#clearInactivityTimer();
    this.#removeEventListeners();
  }

  /**
   * Resumes monitoring user activity.
   */
  resume() {
    this.#log('Resuming watcher');
    this.#addEventListeners();
    this.#startInactivityTimer();
  }

  /**
   * Fully stops and cleans up the watcher.
   */
  destroy() {
    this.#log('Destroying watcher');
    this.#clearInactivityTimer();
    this.#removeEventListeners();
  }
}
