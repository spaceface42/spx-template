import { eventBus } from '../../bin/EventBus.js';
// for future event logs
export function logMessage(level = 'info', message, details = {}) {
    eventBus.emit('log', { level, message, details, timestamp: new Date().toISOString() });
}
