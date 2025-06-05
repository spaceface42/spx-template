// EventBus.js
export class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    this.listeners[event] = (this.listeners[event] || []).filter(fn => fn !== callback);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach(fn => fn(payload));
  }
}

export const eventBus = new EventBus();
