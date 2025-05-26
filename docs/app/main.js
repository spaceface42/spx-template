import DomReadyPromise from './resources/42/DomReadyPromise.js';
import spx from './resources/spx/index.js'
// import PartialLoader from './resources/42/PartialLoader.js';
import { default as PartialLoader } from './resources/42/PartialLoader.js';

import ScreensaverOverlay from './ui/screensaver/ScreensaverOverlay.js';

(async () => {
    await DomReadyPromise.ready(); // Wait for DOMContentLoaded
    console.log('DOM is ready');
      // Basic usage

      // With custom configuration
      const screensaver = new ScreensaverOverlay({
        selector: '.screensaver',
        defaultDelay: 3000, // 3 seconds between layout changes
        defaultInactivityDelay: 60000, // 1 minute of inactivity
        apiEndpoint: 'api/screensaver-layouts'
      });

      // Public methods
      screensaver.forceShow(); // Show immediately
      screensaver.forceHide(); // Hide and restart timer
      screensaver.isScreensaverActive(); // Check if active
      screensaver.destroy(); // Clean up when done
      
})();










// This is the main entry point for your app
const domReady = spx({
  fragments: [
    'main',  // #menu is dynamic and will morph
    'footer'   // #main is dynamic and will morph
  ],
  logLevel: 3,
  cache: true,
  style: ['link[href*="main.css"]'],
  scripts: ['script[src*="main.js"]'],
});

// This is the main entry point for your app
export default domReady(function(session) {
  // You initialize third party js in this callback

  console.log(session);

})


  // const { default: PartialLoader } = await import('./resources/42/PartialLoader.js');

const loader = new PartialLoader();

/*
  const loader = new PartialLoader({
    baseUrl: '/partials',
    timeout: 5000,
    cacheEnabled: true
  });
*/
  // Load all partials in document
  await loader.init();












