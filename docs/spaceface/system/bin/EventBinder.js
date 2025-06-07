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

  // DOM binding
  bindDOM(target, event, handler, options = false) {
    if (!target || typeof target.addEventListener !== 'function') {
      console.error('EventBinder: Invalid target for DOM binding', target);
      return;
    }

    target.addEventListener(event, handler, options);
    this._domBindings.push({ target, event, handler, options });
    
    if (this._debug) {
      console.log(`EventBinder: Bound DOM event "${event}" to`, target);
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

    // Clean up DOM bindings
    this._domBindings.forEach(({ target, event, handler, options }) => {
      try {
        if (target && typeof target.removeEventListener === 'function') {
          target.removeEventListener(event, handler, options);
          if (this._debug) {
            console.log(`EventBinder: Unbound DOM event "${event}" from`, target);
          }
        } else {
          console.warn('EventBinder: Target no longer valid for event removal', target);
        }
      } catch (error) {
        console.error(`EventBinder: Error unbinding DOM event "${event}":`, error);
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
  setDebug(enabled) {
    this._debug = enabled;
  }
}