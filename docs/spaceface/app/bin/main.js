import { eventBus } from '../../system/bin/EventBus.js';

const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');

// Add specific events to log
const eventsToLog = [
  // 'partial:loaded', // Logs all partial loaded events
  // 'partials:allLoaded', // Logs when all partials are loaded
  // 'user:active', // Logs all events (wildcard)
  // 'user:inactive', // Logs all events (wildcard)
  '*', // Logs all events (wildcard)
];

if (isDev) {
  eventsToLog.forEach(eventName => {
    eventBus.on(eventName, (payload) => {
      console.log(`████████ [ any ×͜× listener ] Event: ${eventName}`, payload ?? '(no payload)');
    });
  });
}



// Now import and init your main app class (Spaceface or similar)
import { Spaceface } from './Spaceface.js';

const app = new Spaceface({
  features: {
    partialLoader: true,
    slideplayer: {
      interval: 5000,
      includePicture: false
    },
    screensaver: {
      delay: 4500,
      partialUrl: '/content/feature/screensaver/index.html'
    },
    serviceWorker: true,
  }
});

app.init();

// Setup SPX
// const domReady = app.setupSPX();
