import { eventBus } from '../../system/bin/EventBus.js';



/*
// v1
const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');

if (isDev) {
  eventBus.on('log', ({ level = 'info', args = [] }) => {
    switch (level) {
      case 'error':
        console.error('[app] ', ...args);
        break;
      case 'warn':
        console.warn('[app] ', ...args);
        break;
      case 'info':
      default:
        console.log('[app] ', ...args);
        break;
    }
  });
}
*/

/*
// v2
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
*/






// Listen to all events:
eventBus.on('*', (eventName, payload) => {
  console.log(`████████ [ any ×͜× listener ] Event: ${eventName}`, payload ?? '(no payload)');
});





// Now import and init your main app class (Spaceface or similar)
import { Spaceface } from './Spaceface.js';

const app = new Spaceface({
  features: {
    partialLoader: true,
    slideplayer: {
      interval: 5000,
      includePicture: false
    },
    screensaver: { delay: 5000 },
    serviceWorker: true,
  }
});

app.init();
