/**
 * Optimized pointer position tracker with singleton pattern.
 * Supports mouse and touch, minimal overhead, easy to use.
 */
export class MouseTracker {
  static #instance = null;

  #x = 0;
  #y = 0;
  #isTracking = false;
  #listeners = new Set();
  #boundHandler = null;
  #eventTypes = ['mousemove', 'touchmove', 'pointermove'];

  constructor() {
    if (MouseTracker.#instance) {
      return MouseTracker.#instance;
    }
    this.#boundHandler = this.#handleMove.bind(this);
    MouseTracker.#instance = this;
  }

  static getInstance() {
    return MouseTracker.#instance ??= new MouseTracker();
  }

  // Unified pointer/touch/mouse handler
  #handleMove(e) {
    if (e.touches && e.touches.length > 0) {
      this.#x = e.touches[0].clientX;
      this.#y = e.touches[0].clientY;
    } else if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
      this.#x = e.clientX;
      this.#y = e.clientY;
    }
    if (this.#listeners.size) {
      for (const callback of this.#listeners) {
        callback(this.#x, this.#y, e);
      }
    }
  }

  #startTracking() {
    if (!this.#isTracking) {
      // Prefer pointermove if available, else fallback to mouse/touch
      if (window.PointerEvent) {
        document.addEventListener('pointermove', this.#boundHandler, { passive: true });
      } else {
        document.addEventListener('mousemove', this.#boundHandler, { passive: true });
        document.addEventListener('touchmove', this.#boundHandler, { passive: true });
      }
      this.#isTracking = true;
    }
  }

  #stopTracking() {
    if (this.#isTracking && !this.#listeners.size) {
      if (window.PointerEvent) {
        document.removeEventListener('pointermove', this.#boundHandler);
      } else {
        document.removeEventListener('mousemove', this.#boundHandler);
        document.removeEventListener('touchmove', this.#boundHandler);
      }
      this.#isTracking = false;
    }
  }

  // Get current position as {x, y}
  get position() {
    return { x: this.#x, y: this.#y };
  }

  get x() { return this.#x; }
  get y() { return this.#y; }

  // Subscribe to position updates
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }
    this.#listeners.add(callback);
    this.#startTracking();
    // Return unsubscribe function
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.#listeners.delete(callback);
    this.#stopTracking();
  }

  // Get position relative to an element
  getRelativePosition(element) {
    if (!(element instanceof Element)) {
      throw new TypeError('Element must be a DOM element');
    }
    const rect = element.getBoundingClientRect();
    return {
      x: this.#x - rect.left,
      y: this.#y - rect.top
    };
  }

  // Check if pointer is within element bounds
  isWithinElement(element) {
    if (!(element instanceof Element)) {
      throw new TypeError('Element must be a DOM element');
    }
    const rect = element.getBoundingClientRect();
    return this.#x >= rect.left &&
           this.#x <= rect.right &&
           this.#y >= rect.top &&
           this.#y <= rect.bottom;
  }

  // Clean up all listeners (useful for SPA cleanup)
  destroy() {
    this.#listeners.clear();
    if (window.PointerEvent) {
      document.removeEventListener('pointermove', this.#boundHandler);
    } else {
      document.removeEventListener('mousemove', this.#boundHandler);
      document.removeEventListener('touchmove', this.#boundHandler);
    }
    this.#isTracking = false;
    MouseTracker.#instance = null;
  }
}
