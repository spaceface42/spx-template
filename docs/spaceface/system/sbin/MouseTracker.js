/**
 * Pointer tracker with optional throttling per subscriber.
 * Singleton, supports mouse/touch/pointer.
 */
export class MouseTracker {
  static #instance = null;

  #x = 0;
  #y = 0;
  #isTracking = false;
  #boundHandler = null;
  #listeners = new Set();
  #throttleMap = new WeakMap();
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

  #handleMove(e) {
    if (e.touches?.length) {
      this.#x = e.touches[0].clientX;
      this.#y = e.touches[0].clientY;
    } else if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
      this.#x = e.clientX;
      this.#y = e.clientY;
    }

    for (const callback of this.#listeners) {
      const throttle = this.#throttleMap.get(callback);
      const now = performance.now();

      if (!throttle) {
        callback(this.#x, this.#y, e);
        continue;
      }

      const { lastCalled, wait } = throttle;
      if (now - lastCalled >= wait) {
        throttle.lastCalled = now;
        callback(this.#x, this.#y, e);
      }
    }
  }

  #startTracking() {
    if (!this.#isTracking) {
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

  get x() { return this.#x; }
  get y() { return this.#y; }
  get position() {
    return { x: this.#x, y: this.#y };
  }

  /**
   * Subscribe to pointer movement.
   * @param {Function} callback - Function(x, y, event)
   * @param {Object} [options] - Optional { throttleMs }
   * @returns {Function} unsubscribe
   */
  subscribe(callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    this.#listeners.add(callback);

    if (options.throttleMs > 0) {
      this.#throttleMap.set(callback, {
        wait: options.throttleMs,
        lastCalled: 0
      });
    }

    this.#startTracking();
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.#listeners.delete(callback);
    this.#throttleMap.delete(callback);
    this.#stopTracking();
  }

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

  destroy() {
    this.#listeners.clear();
    this.#throttleMap = new WeakMap();
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
