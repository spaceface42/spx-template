import DomReadyPromise from './resources/42/DomReadyPromise.js';
import spx from './resources/spx/index.js'

(async () => {
    await DomReadyPromise.ready(); // Wait for DOMContentLoaded
    console.log('DOM is ready');
    // do stuff
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
