/**
 * main.js
 */

// pjax page loading stuff
import spx from './system/spx/index.js';

// system init / domready / partialloader / debug
import { logMessage, generateId } from './system/42/utils.js';
import { DomReadyPromise } from './system/42/DomReadyPromise.js';
import { PartialLoader } from './system/42/PartialLoader.js';
import { InspectorXray } from './system/42/InspectorXray.js';

// features
import { ScreensaverController } from './app/features/Screensaver/ScreensaverController.js';
import { RandomThemeLoader } from './app/features/RandomTheme/RandomThemeLoader.js';

/*
import { DeviceDetect } from './system/42/DeviceDetect.js';

const device = new DeviceDetect({
  onSwipe: direction => console.log(`Swiped ${direction}`),
  onResize: () => console.log('Resized or orientation changed'),
});
*/



function debug(config) {
    if (config.production) return;
    const xray = new InspectorXray();
}

(async () => {
    try {
        console.time('app-initialization');
        const config = { production: false };

        logMessage('info', 'App loaded', config);

        await DomReadyPromise.ready();
        logMessage('info', 'DOM is ready', config);

        // Initialize partial loader
        const loader = new PartialLoader();
        await loader.init();

        // Screensaver feature
        const screensaver = async () => {
            const uniqueId = generateId('screensaver', 9);
            const screensaverDiv = Object.assign(document.createElement('div'), { id: uniqueId });
            Object.assign(screensaverDiv.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                zIndex: '1',
                display: 'none'
            });
            document.body.appendChild(screensaverDiv);

            const controller = new ScreensaverController({
                partialUrl: '/content/screensaver/screensaver.html',
                targetSelector: `#${uniqueId}`,
                inactivityDelay: 3000
            });
            if (typeof controller.init === 'function') {
                await controller.init();
            }

            const container = document.getElementById(uniqueId);
            if (container) {
                const images = container.querySelectorAll('img');
                await Promise.all(Array.from(images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = img.onerror = resolve;
                    });
                }));
            }

            logMessage('info', 'screensaver id: ', uniqueId, config);
        };

        // Random CSS loader
        const randomcss = async () => {
            const loader = new RandomThemeLoader([
                './app/ui/spacesuit/random/one.css',
                './app/ui/spacesuit/random/two.css',
                './app/ui/spacesuit/random/three.css'
            ]);
            await loader.loadRandomTheme();
        };

        await screensaver();
        await randomcss();
        debug(config);

        console.timeEnd('app-initialization');
    } catch (error) {
        console.error('App initialization failed:', error);
    }
})();

// spx setup
const domReady = spx({
    fragments: ['main', 'footer'],
    logLevel: 0,
    cache: true,
    style: ['link[href*="main.css"]'],
    scripts: ['script[src*="main.js"]'],
});



