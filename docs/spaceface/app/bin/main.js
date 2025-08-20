import { eventBus } from '../../system/bin/EventBus.js';
// import { AppConfig } from './AppConfig.js';

const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');

const eventsToLog = [
  // 'partial:loaded',
  // 'partials:allLoaded',
  // 'user:active',
  // 'user:inactive',
  '*', // Log all events
];

if (isDev) {
  eventsToLog.forEach(eventName => {
    if (eventName === '*') {
      eventBus.onAny((eventName, payload) => {
        if (!payload) {
          console.log(`[ main.js onAny ] Event: ${eventName} – no payload !`);
          return;
        }

        if (typeof payload === 'string') {
          console.log(`[ main.js onAny ] Event: ${eventName} [LOG]`, payload);
          return;
        }

        const { level, message, args, ...otherDetails } = payload;
        console.log(`[ main.js onAny ] Event: ${eventName} [${level?.toUpperCase() || 'LOG'}]`, message || args || otherDetails || '(no details)');
      });
    } else {
      eventBus.on(eventName, (payload) => {
        if (!payload) {
          console.log(`[ main.js listener ] Event: ${eventName} – (no payload)`);
          return;
        }

        if (typeof payload === 'string') {
          console.log(`[ main.js listener ] Event: ${eventName} [LOG]`, payload);
          return;
        }

        const { level, message, args, ...otherDetails } = payload;
        console.log(`[ main.js listener ] Event: ${eventName} [${level?.toUpperCase() || 'LOG'}]`, message || args || otherDetails || '(no details)');
      });
    }
  });
}




// Now import and init your main app class (Spaceface or similar)
import { Spaceface } from './Spaceface.js';

const app = new Spaceface({
  features: {
    partialLoader: true,
    slideplayer: {
      interval: 5000,
      includePicture: false,
      showDots: true, // 👈 new flag
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
