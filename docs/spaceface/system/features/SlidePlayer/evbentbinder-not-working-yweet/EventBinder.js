import { eventBus } from '../../../bin/EventBus.js';

export class EventBinder {
  constructor() {
    this._busBindings = [];
    this._domBindings = [];
  }

  // EventBus binding
  bindBus(event, handler) {
    eventBus.on(event, handler);
    this._busBindings.push([event, handler]);
  }

  // DOM binding
  bindDOM(target, event, handler, options = false) {
    target.addEventListener(event, handler, options);
    this._domBindings.push([target, event, handler, options]);
  }

  // Remove all tracked bindings
  unbindAll() {

    console.log('unbindAll called');

    
    this._busBindings.forEach(([event, handler]) => {
      eventBus.off(event, handler);
      console.log('_busBindings', event, handler);
    });
    this._busBindings = [];

    this._domBindings.forEach(([target, event, handler, options]) => {
      console.log('removeEventListener', event, handler, options);
      target.removeEventListener(event, handler, options);
    });
    this._domBindings = [];
  }
}
