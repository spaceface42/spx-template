/**
 * main.js - Optimized version
 */

// Critical imports first (hoisted)
import spx from './system/spx/index.js';
import { logMessage, generateId } from './system/42/utils.js';
import { DomReadyPromise } from './system/42/DomReadyPromise.js';

// Non-critical imports - can be lazy loaded
let PartialLoader, InspectorXray, ScreensaverController, RandomThemeLoader, ServiceWorkerManager;

// Lazy import function
const lazyImport = async (modulePath) => {
    try {
        return await import(modulePath);
    } catch (error) {
        console.warn(`Failed to load module: ${modulePath}`, error);
        return null;
    }
};

// Optimized debug function with lazy loading
async function debug(config) {
    if (config.production) return;
    
    if (!InspectorXray) {
        const module = await lazyImport('./system/42/InspectorXray.js');
        InspectorXray = module?.InspectorXray;
    }
    
    if (InspectorXray) {
        new InspectorXray();
    }
}

// Optimized screensaver initialization
const initScreensaver = async (config) => {
    try {
        if (!ScreensaverController) {
            const module = await lazyImport('./app/features/FloatingImages/ScreensaverController.js');
            ScreensaverController = module?.ScreensaverController;
        }
        
        if (!ScreensaverController) return;

        const uniqueId = generateId('screensaver', 9);
        
        // More efficient element creation
        const screensaverDiv = document.createElement('div');
        screensaverDiv.id = uniqueId;
        screensaverDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1;
            display: none;
        `;
        
        document.body.appendChild(screensaverDiv);

        const controller = new ScreensaverController({
            partialUrl: '/content/screensaver/screensaver.html',
            targetSelector: `#${uniqueId}`,
            inactivityDelay: 3000
        });

        if (typeof controller.init === 'function') {
            await controller.init();
        }

        // Optimized image preloading with timeout
        const container = document.getElementById(uniqueId);
        if (container) {
            const images = container.querySelectorAll('img');
            const imagePromises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                
                return new Promise(resolve => {
                    const timeout = setTimeout(() => resolve(), 5000); // 5s timeout
                    
                    const cleanup = () => {
                        clearTimeout(timeout);
                        resolve();
                    };
                    
                    img.onload = cleanup;
                    img.onerror = cleanup;
                });
            });
            
            await Promise.allSettled(imagePromises); // Use allSettled to not fail on single image errors
        }

        logMessage('info', 'Screensaver initialized:', uniqueId, config);
    } catch (error) {
        console.warn('Screensaver initialization failed:', error);
    }
};

// Optimized random CSS loader
const initRandomTheme = async (config) => {
    try {
        if (!RandomThemeLoader) {
            const module = await lazyImport('./app/features/RandomTheme/RandomThemeLoader.js');
            RandomThemeLoader = module?.RandomThemeLoader;
        }
        
        if (!RandomThemeLoader) return;

        const loader = new RandomThemeLoader([
            '/spaceface.app/spacesuit/random/one.css',
            '/spaceface.app/spacesuit/random/two.css',
            '/spaceface.app/spacesuit/random/three.css'
        ]);
        
        await loader.loadRandomTheme();
        logMessage('info', 'Random theme loaded', config);
    } catch (error) {
        console.warn('Random theme loading failed:', error);
    }
};

// Service Worker initialization
const initServiceWorker = async () => {
    try {
        if (!ServiceWorkerManager) {
            const module = await lazyImport('./app/ServiceWorker.js');
            ServiceWorkerManager = module?.default;
        }
        
        if (!ServiceWorkerManager) return;

        const swManager = new ServiceWorkerManager('/sw.js');
        await swManager.register();
        
        // Optional: Clear cache on development
        // await swManager.postMessage({ type: 'CLEAR_CACHE' });
        
        logMessage('info', 'Service Worker registered');
    } catch (error) {
        console.warn('Service Worker registration failed:', error);
    }
};

// Main initialization function
(async () => {
    const startTime = performance.now();
    
    try {
        const config = { 
            production: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
        };

        logMessage('info', 'App initialization started', config);

        // Wait for DOM to be ready
        await DomReadyPromise.ready();
        logMessage('info', 'DOM ready', config);

        // Initialize PartialLoader early as it might be critical
        if (!PartialLoader) {
            const module = await lazyImport('./system/42/PartialLoader.js');
            PartialLoader = module?.PartialLoader;
        }
        
        if (PartialLoader) {
            const loader = new PartialLoader();
            await loader.init();
            logMessage('info', 'PartialLoader initialized', config);
        }

        // Parallel initialization of non-critical features
        const initPromises = [
            initScreensaver(config),
            initRandomTheme(config),
            debug(config),
            initServiceWorker()
        ];

        // Wait for all with timeout and error handling
        const results = await Promise.allSettled(initPromises);
        
        // Log any failures
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const features = ['screensaver', 'theme', 'debug', 'service-worker'];
                console.warn(`${features[index]} initialization failed:`, result.reason);
            }
        });

        // Remove splash screen after everything is loaded
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            splashScreen.style.transition = 'opacity 300ms ease-out';
            setTimeout(() => splashScreen.remove(), 300);
        }

        const endTime = performance.now();
        logMessage('info', `App initialization completed in ${(endTime - startTime).toFixed(2)}ms`, config);
        
    } catch (error) {
        console.error('Critical app initialization error:', error);
        
        // Ensure splash screen is removed even on error
        document.getElementById('splash-screen')?.remove();
    }
})();

// SPX setup - can be initialized immediately
const domReady = spx({
    fragments: ['main', 'footer'],
    logLevel: 0,
    cache: true,
    style: ['link[href*="main.css"]'],
    scripts: ['script[src*="main.js"]'],
});

// Export for potential external access
export { initScreensaver, initRandomTheme, initServiceWorker };