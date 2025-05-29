/**
 * main.js
 */

// spx
import spx from './resources/spx/index.js'

// 42
import { DomReadyPromise } from './resources/_42/DomReadyPromise.js';
import { PartialLoader } from './resources/_42/PartialLoader.js';




(async () => {
    await DomReadyPromise.ready(); // Wait for DOMContentLoaded
    console.log('DOM is ready');
    screensaver();
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



// load partials if any are defined in the document
const loader = new PartialLoader();
/*
const loader = new PartialLoader({
  baseUrl: '/partials',
  timeout: 5000,
  cacheEnabled: true
});
*/
await loader.init();





/**
 * utils
 */
function generateId(prefix = 'id', length = 9) {
  return `${prefix}-${Math.random().toString(36).slice(2, 2 + length)}`;
}



// Initialize the screensaver controller
import { ScreensaverController } from './resources/features/FloatingImages/ScreensaverController.js';

/**
 * screensaver feature
 * This feature creates a fullscreen div that acts as a screensaver.
 * It is shown after a period of inactivity.
 */
function screensaver() {

  // Generate a unique ID
  const uniqueId = generateId('screensaver', 9);

  // Create the screensaver div
  const screensaverDiv = Object.assign(document.createElement('div'), {
    id: uniqueId
  });

  // Apply styles
  Object.assign(screensaverDiv.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '1',
    display: 'none' // hidden by default, let JS controller show it
  });

  document.body.appendChild(screensaverDiv);

  const controller = new ScreensaverController({
    partialUrl: '/content/screensaver/screensaver.html',
    targetSelector: `#${uniqueId}`,
    inactivityDelay: 6000
  });

  console.log('Screensaver controller initialized id = ', uniqueId);

}






