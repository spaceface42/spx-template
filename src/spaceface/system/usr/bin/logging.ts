import { eventBus } from '../../bin/EventBus.js';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | string;

interface LogDetails {
  [key: string]: any;
}

interface LogEvent {
  level: LogLevel;
  message: string;
  details: LogDetails;
  timestamp: string;
}

// for future event logs
export function logMessage(
  level: LogLevel = 'info',
  message: string,
  details: LogDetails = {}
): void {
  eventBus.emit('log', { level, message, details, timestamp: new Date().toISOString() } as LogEvent);
}
