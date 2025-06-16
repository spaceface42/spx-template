import { InactivityWatcher } from './InactivityWatcher.js';

let instance = null;

export class InactivityService extends InactivityWatcher {
  constructor(options = {}) {
    if (instance) return instance; // Return existing instance if already created
    super(options);
    instance = this;
  }
}
