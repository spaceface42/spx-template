import { eventBus } from './EventBus.js';

export class EventBinder {
  constructor(debug = false) {
    this._busBindings = [];
    this._domBindings = [];
    this._debug = debug;
  }

  // EventBus binding
  bindBus(event, handler) {
    eventBus.on(event, handler);
    this._busBindings.push({ event, handler });

    if (this._debug) {
      console.log(`EventBinder: Bound bus event "${event}"`);
    }
  }

  // DOM binding with normalized options and AbortController
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

      if (this._debug) {
        console.log(`EventBinder: Bound DOM event "${event}" to`, target);
      }
    } catch (err) {
      console.error('EventBinder: Failed to bind event:', err);
    }
  }

  // Remove all tracked bindings
  unbindAll() {
    if (this._debug) {
      console.log(`EventBinder: Unbinding ${this._busBindings.length} bus events and ${this._domBindings.length} DOM events`);
    }

    // Clean up EventBus bindings
    this._busBindings.forEach(({ event, handler }) => {
      try {
        eventBus.off(event, handler);
        if (this._debug) {
          console.log(`EventBinder: Unbound bus event "${event}"`);
        }
      } catch (error) {
        console.error(`EventBinder: Error unbinding bus event "${event}":`, error);
      }
    });
    this._busBindings = [];

    // Abort DOM event controllers
    this._domBindings.forEach(({ controller, event, target }) => {
      try {
        controller?.abort();
        if (this._debug) {
          console.log(`EventBinder: Aborted DOM event "${event}" from`, target);
        }
      } catch (error) {
        console.error(`EventBinder: Error aborting DOM event "${event}":`, error);
      }
    });
    this._domBindings = [];
  }

  // Get stats about bound events
  getStats() {
    return {
      busEvents: this._busBindings.length,
      domEvents: this._domBindings.length,
      totalEvents: this._busBindings.length + this._domBindings.length
    };
  }

  // Check if any events are bound
  hasBindings() {
    return this._busBindings.length > 0 || this._domBindings.length > 0;
  }

  // Enable/disable debug logging
_debugLog(level, ...args) {
  if (!this._debug) return;

  const message = {
    source: 'EventBinder',
    level,
    time: new Date(),
    args,
  };

  // Optional: forward to your global logger if available
  if (typeof window !== 'undefined' && window.dispatchEvent && typeof CustomEvent === 'function') {
    window.dispatchEvent(new CustomEvent('*', { detail: message }));
  }

  // Also log to the console for convenience
  const prefix = '[EventBinder]';
  const timestamp = message.time.toISOString();

  switch (level) {
    case 'log':
      console.log(prefix, timestamp, ...args);
      break;
    case 'warn':
      console.warn(prefix, timestamp, ...args);
      break;
    case 'error':
      console.error(prefix, timestamp, ...args);
      break;
  }
}

}
