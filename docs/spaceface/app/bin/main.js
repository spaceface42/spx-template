import { eventBus } from '../../system/bin/EventBus.js';

// const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');

const eventsToLog = [
  '*',
];

// if (isDev) {
  eventsToLog.forEach(eventName => {
    eventBus.on(eventName, (eventName, payload) => {
      console.log(`████████ [ any ×͜× listener ] Event: ${eventName}`, payload ?? '(no payload)');
    });
  });
// }

/*
// v3
// Listen to all events:
eventBus.on('*', (eventName, payload) => {
  console.log(`████████ [ any ×͜× listener ] Event: ${eventName}`, payload ?? '(no payload)');
});
*/




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
      delay: 6500,
      partialUrl: '/content/feature/screensaver/index.html'
    },
    serviceWorker: true,
  }
});

app.init();
