import { eventBus } from './EventBus.js';

export class EventBinder {
  constructor(debug = false) {
    this._busBindings = [];
    this._domBindings = [];
    this._debug = debug;
    this._domTargets = new WeakMap(); // Use WeakMap to store DOM targets
  }

  /**
   * Emit debug events via EventBus
   * @param {string} method - The method name
   * @param {Object} details - Additional details about the debug event
   */
  _emitDebug(method, details) {
    if (this._debug) {
      eventBus.emit(`debug:EventBinder`, {
        method,
        details,
      });
    }
  }

  /**
   * Bind an event to the EventBus
   * @param {string} event - The event name
   * @param {Function} handler - The event handler
   */
  bindBus(event, handler) {
    eventBus.on(event, handler);
    this._busBindings.push({ event, handler });

    this._emitDebug('bindBus', { event, handler });
  }

  /**
   * Bind a DOM event with normalized options and AbortController
   * @param {HTMLElement} target - The DOM element
   * @param {string} event - The event name
   * @param {Function} handler - The event handler
   * @param {Object|boolean} options - Event listener options
   */
  bindDOM(target, event, handler, options = false) {
    if (!target || typeof target.addEventListener !== 'function') {
      console.warn('EventBinder: Invalid target for DOM binding', target);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    // Normalize options to object form and include signal
    const normalizedOptions = typeof options === 'boolean'
      ? { capture: options, signal }
      : { ...options, signal };

    try {
      target.addEventListener(event, handler, normalizedOptions);
      this._domBindings.push({ target, event, handler, options: normalizedOptions, controller });
      this._domTargets.set(target, { event, handler, options: normalizedOptions, controller }); // Store target info

      this._emitDebug('bindDOM', { target, event, handler, options: normalizedOptions });
    } catch (err) {
      console.error('EventBinder: Failed to bind event:', err);
    }
  }

  /**
   * Remove all tracked bindings
   */
  unbindAll() {
    this._emitDebug('unbindAll', {
      busBindings: this._busBindings.length,
      domBindings: this._domBindings.length,
    });

    try {
      // Clean up EventBus bindings
      this._busBindings.forEach(({ event, handler }) => {
        try {
          eventBus.off(event, handler);
          this._emitDebug('unbindBus', { event, handler });
        } catch (error) {
          console.error(`EventBinder: Error unbinding bus event "${event}":`, error);
        }
      });

      // Abort DOM event controllers
      this._domBindings.forEach(({ controller, event, target }) => {
        try {
          controller?.abort();
          this._emitDebug('abortDOM', { event, target });
        } catch (error) {
          console.error(`EventBinder: Error aborting DOM event "${event}":`, error);
        }
      });

      // Clean up DOM event listeners using WeakMap
      this._domTargets.forEach(({ event, handler, options }, target) => {
        if (target) {
          try {
            target.removeEventListener(event, handler, options);
            this._emitDebug('removeDOM', { event, target });
          } catch (error) {
            console.error(`EventBinder: Error removing DOM event "${event}":`, error);
          }
        }
      });
    } finally {
      this._busBindings = [];
      this._domBindings = [];
      this._domTargets = new WeakMap(); // Clear the WeakMap
    }
  }

  /**
   * Get stats about bound events
   */
  getStats() {
    const stats = {
      busEvents: this._busBindings.length,
      domEvents: this._domBindings.length,
      totalEvents: this._busBindings.length + this._domBindings.length,
    };

    this._emitDebug('getStats', stats);
    return stats;
  }

  /**
   * Check if any events are bound
   */
  hasBindings() {
    const hasBindings = this._busBindings.length > 0 || this._domBindings.length > 0;
    this._emitDebug('hasBindings', { hasBindings });
    return hasBindings;
  }
}
