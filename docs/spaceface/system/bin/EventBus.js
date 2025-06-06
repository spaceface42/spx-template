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

  // Emit event with optional payload
  emit(event, payload) {
    // Call listeners for this event
    (this.listeners[event] || []).forEach(fn => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`Error in event listener for "${event}":`, err);
      }
    });

    // Call wildcard listeners with (event, payload)
    this.wildcardListeners.forEach(fn => {
      try {
        fn(event, payload);
      } catch (err) {
        console.error('Error in wildcard event listener:', err);
      }
    });
  }
}

export const eventBus = new EventBus();
