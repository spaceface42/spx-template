// import DomReadyPromise from './42/DomReadyPromise.js';
import spx from '/resources/spx/index.js';

/*
(async () => {
    await DomReadyPromise.ready(); // Wait for DOMContentLoaded
    // do stuff
})();
*/

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

export default domReady(function(session) {
  // You initialize third party js in this callback
  console.log(session);
})
