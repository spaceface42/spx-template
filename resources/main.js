  import spx from '/resources/spx/index.js';

  const domReady = spx({
    fragments: [
      'main',  // #menu is dynamic and will morph
      'footer'   // #main is dynamic and will morph
    ],
    logLevel: 3,
    style: ['link[href*="main.css"]'],
  });
  export default domReady(function(session) {
    // You initialize third party js in this callback
    console.log(session);
  })