import { throttle } from '../usr/bin/timing.js';

export class MouseTracker {
  static #instance = null;

  #x = 0;
  #y = 0;
  #isTracking = false;
  #boundHandler = null;
  #listeners = new Map(); // Map<callback, throttled version>

  constructor() {
    if (MouseTracker.#instance) return MouseTracker.#instance;
    this.#boundHandler = this.#handleMove.bind(this);
    MouseTracker.#instance = this;
  }

  static getInstance() {
    return MouseTracker.#instance ??= new MouseTracker();
  }

  #handleMove(e) {
    if (e.touches?.length) {
      this.#x = e.touches[0].clientX;
      this.#y = e.touches[0].clientY;
    } else if (typeof e.clientX === 'number') {
      this.#x = e.clientX;
      this.#y = e.clientY;
    }

    for (const handler of this.#listeners.values()) {
      handler(this.#x, this.#y, e);
    }
  }

  #startTracking() {
    if (!this.#isTracking) {
      const type = window.PointerEvent ? 'pointermove' : null;
      if (type) {
        document.addEventListener(type, this.#boundHandler, { passive: true });
      } else {
        document.addEventListener('mousemove', this.#boundHandler, { passive: true });
        document.addEventListener('touchmove', this.#boundHandler, { passive: true });
      }
      this.#isTracking = true;
    }
  }

  #stopTracking() {
    if (this.#isTracking && !this.#listeners.size) {
      const type = window.PointerEvent ? 'pointermove' : null;
      if (type) {
        document.removeEventListener(type, this.#boundHandler);
      } else {
        document.removeEventListener('mousemove', this.#boundHandler);
        document.removeEventListener('touchmove', this.#boundHandler);
      }
      this.#isTracking = false;
    }
  }

  get x() { return this.#x; }
  get y() { return this.#y; }
  get position() {
    return { x: this.#x, y: this.#y };
  }

  /**
   * Subscribe to pointer movement
   * @param {Function} callback
   * @param {Object} options - { throttleMs?: number }
   */
  subscribe(callback, { throttleMs = 0 } = {}) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    const wrapped = throttleMs > 0 ? throttle(callback, throttleMs) : callback;
    this.#listeners.set(callback, wrapped);
    this.#startTracking();

    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.#listeners.delete(callback);
    this.#stopTracking();
  }

  getRelativePosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: this.#x - rect.left,
      y: this.#y - rect.top
    };
  }

  isWithinElement(element) {
    const rect = element.getBoundingClientRect();
    return this.#x >= rect.left && this.#x <= rect.right &&
           this.#y >= rect.top && this.#y <= rect.bottom;
  }

  destroy() {
    this.#listeners.clear();
    this.#stopTracking();
    MouseTracker.#instance = null;
  }
}
