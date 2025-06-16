import { eventBus } from '../../bin/EventBus.js';

// for future event logs
export function logMessage(level = 'info', ...args) {
  eventBus.emit('log', { level, ...args });
}
