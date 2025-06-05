import { eventBus } from '../../system/bin/EventBus.js'; // adjust path if needed
import { logMessage } from '../../system/usr/bin/logging.js'; // your existing logger

// Set up event logging right away
const eventsToLog = [
  'screensaver:initialized',
  'theme:randomLoaded',
  'debug:enabled',
  'serviceWorker:registered',
  'partialLoader:initialized',
  'page:homeInit',
  'page:appInit',
  'app:initComplete',
  'app:initError',
  'feature:initFailed',
];

// Register listeners for these events to log them
eventsToLog.forEach(eventName => {
  eventBus.on(eventName, (...args) => {
    logMessage('info', `[eventBus] Event: ${eventName}`, ...args);
  });
});

// Optionally, listen to all events if your event bus supports `onAny`
// eventBus.onAny((eventName, ...args) => {
//   logMessage('info', `[eventBus] Event emitted: ${eventName}`, ...args);
// });

// Now import and init your main app class (Spaceface or similar)
import { Spaceface } from './Spaceface.js';

const app = new Spaceface({
  features: {
    screensaver: { delay: 5000 },
    serviceWorker: true,
    partialLoader: true,
  }
});

app.init();
