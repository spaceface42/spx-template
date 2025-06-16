export class EventBus {
  constructor() {
    this.listeners = {};
    this.wildcardListeners = [];
  }

  // Register a listener for a specific event or '*' for all events
  on(event, callback) {
    if (event === '*') {
      this.wildcardListeners.push(callback);
    } else {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    }
    // console.log(`Listener registered for event: ${event}`, this.listeners);
  }

  // Register a listener that will only be called once
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  // Remove a listener for a specific event or '*' for all events
  off(event, callback) {
    if (event === '*') {
      this.wildcardListeners = this.wildcardListeners.filter(fn => fn !== callback);
    } else {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(fn => fn !== callback);
    }
  }

  // Remove all listeners for a specific event
  removeAllListeners(event) {
    if (event === '*') {
      this.wildcardListeners = [];
    } else if (event) {
      delete this.listeners[event];
    } else {
      // If no event specified, remove all listeners
      this.listeners = {};
      this.wildcardListeners = [];
    }
  }

  // Get the number of listeners for a specific event
  listenerCount(event) {
    if (event === '*') {
      return this.wildcardListeners.length;
    }
    return (this.listeners[event] || []).length;
  }

  // Get all event names that have listeners
  eventNames() {
    const names = Object.keys(this.listeners).filter(name => this.listeners[name].length > 0);
    if (this.wildcardListeners.length > 0) {
      names.push('*');
    }
    return names;
  }

  // Emit event with optional payload
  emit(event, payload) {
    // Call listeners for this event
    (this.listeners[event] || []).forEach(fn => {
      try {
        fn(payload);
      } catch (err) {
        this._handleError(`Error in event listener for "${event}":`, err);
      }
    });

    // Call wildcard listeners with (event, payload)
    this.wildcardListeners.forEach(fn => {
      try {
        fn(event, payload);
      } catch (err) {
        this._handleError('Error in wildcard event listener:', err);
      }
    });
  }

  // Check if there are any listeners for a specific event
  hasListeners(event) {
    if (event === '*') {
      return this.wildcardListeners.length > 0;
    }
    return (this.listeners[event] || []).length > 0;
  }

  // Get a snapshot of all listeners (useful for debugging)
  getListeners(event) {
    if (event === '*') {
      return [...this.wildcardListeners];
    }
    return [...(this.listeners[event] || [])];
  }

  // Centralized error handling
  _handleError(message, error) {
    console.error(message, error);
    // Optional: You could also dispatch a custom event here
    // window.dispatchEvent(new CustomEvent('eventbus.error', { detail: { message, error } }));
  }
}

export const eventBus = new EventBus();
