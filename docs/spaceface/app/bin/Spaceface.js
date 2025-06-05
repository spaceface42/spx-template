import spx from '../../library/spx/index.js';

import { logMessage } from '../../system/usr/bin/logging.js';
import { generateId } from '../../system/usr/bin/id.js';

import { DomReadyPromise } from '../../system/sbin/DomReadyPromise.js';

export class Spaceface {
  constructor(options = {}) {
    this.config = {
      production: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
      features: options.features ?? {},
      ...options
    };

    this.pageType = this.detectPageType();
    this.startTime = performance.now();

    // Static map for feature modules keyed by feature name
    this.featureModules = {
      screensaver: () => import('../../system/features/Screensaver/ScreensaverController.js'),
      randomTheme: () => import('../RandomTheme/RandomThemeLoader.js'),
      // debug: () => import('../../system/sbin/InspectorXray.js'),
      serviceWorker: () => import('../ServiceWorkerManager.js'),
      partialLoader: () => import('../../system/sbin/PartialLoader.js'),
    };

    // Cache loaded modules to avoid multiple imports
    this.loadedModules = new Map();
  }

  detectPageType() {
    const path = window.location.pathname;
    const body = document.body;

    if (body.dataset.page) {
      return body.dataset.page;
    }
    if (path === '/') return 'home';
    if (path === '/app') return 'app';

    return 'default';
  }



  async loadFeatureModule(featureName) {
    if (!this.featureModules[featureName]) {
      return null;
    }
    if (!this.loadedModules.has(featureName)) {
      try {
        const module = await this.featureModules[featureName]();
        this.loadedModules.set(featureName, module);
      } catch (err) {
        console.warn(`Failed to load feature module "${featureName}":`, err);
        this.loadedModules.set(featureName, null);
      }
    }
    return this.loadedModules.get(featureName);
  }

  async initScreensaver() {
    if (!this.config.features.screensaver) return;

    const module = await this.loadFeatureModule('screensaver');
    if (!module?.ScreensaverController) return;

    const uniqueId = generateId('screensaver', 9);
    const screensaverDiv = document.createElement('div');
    screensaverDiv.id = uniqueId;
    screensaverDiv.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: 1; display: none;
    `;
    document.body.appendChild(screensaverDiv);

    const controller = new module.ScreensaverController({
      partialUrl: '/content/screensaver/screensaver.html',
      targetSelector: `#${uniqueId}`,
      inactivityDelay: this.config.features.screensaver.delay || 3000
    });
    if (typeof controller.init === 'function') {
      await controller.init();
    }

    logMessage('info', 'Screensaver initialized:', uniqueId);
  }

  async initRandomTheme() {
    if (!this.config.features.randomTheme) return;

    const module = await this.loadFeatureModule('randomTheme');
    if (!module?.RandomThemeLoader) return;

    const loader = new module.RandomThemeLoader(
      this.config.features.randomTheme.themes || [
        '/spaceface/spacesuit/random/one.css',
        '/spaceface/spacesuit/random/two.css',
        '/spaceface/spacesuit/random/three.css'
      ]
    );
    await loader.loadRandomTheme();
    logMessage('info', 'Random theme loaded');
  }

  async initDebug() {
    if (this.config.production) return;

    const module = await this.loadFeatureModule('debug');
    if (module?.InspectorXray) {
      new module.InspectorXray();
      logMessage('info', 'Debug mode enabled');
    }
  }

  async initServiceWorker() {
    if (!this.config.features.serviceWorker) return;

    const module = await this.loadFeatureModule('serviceWorker');
    if (!module?.default) return;

    const swManager = new module.default('/sw.js');
    await swManager.register();
    logMessage('info', 'Service Worker registered');
  }

  async initPartialLoader() {
    const module = await this.loadFeatureModule('partialLoader');
    if (!module?.PartialLoader) return null;

    const loader = new module.PartialLoader();
    await loader.init();
    logMessage('info', 'PartialLoader initialized');
    return loader;
  }

  async initPageFeatures() {
    logMessage('info', `Initializing features for page type: ${this.pageType}`);

    try {
      switch (this.pageType) {
        case 'home':
          // Example: dynamically load and init home page features
          // const { initHome } = await import('./pages/home.js');
          // if (initHome) await initHome();
          break;

        case 'app':
          // Example: dynamically load and init app page features
          // const { initApp } = await import('./pages/app.js');
          // if (initApp) await initApp();
          break;

        // Add other page types here...

        default:
          // Fallback common features
          // const { initCommon } = await import('./pages/common.js');
          // if (initCommon) await initCommon();
          break;
      }
      logMessage('info', `Page features initialized for: ${this.pageType}`);
    } catch (error) {
      console.warn(`Page feature initialization failed for ${this.pageType}:`, error);
    }
  }

  async init() {
    try {
      logMessage('info', `App initialization started (Page: ${this.pageType})`);

      // Mark JS as available
      document.documentElement.classList.add('js-enabled');
      document.documentElement.classList.add(`page-${this.pageType}`);

      await DomReadyPromise.ready();
      logMessage('info', 'DOM ready');

      // Initialize core features and page features in parallel
      const coreFeatures = [
        this.initPartialLoader(),
        this.initScreensaver(),
        this.initRandomTheme(),
        this.initDebug(),
        this.initServiceWorker()
      ];

      const [coreResults, pageResult] = await Promise.allSettled([
        Promise.allSettled(coreFeatures),
        this.initPageFeatures()
      ]);

      if (coreResults.status === 'fulfilled') {
        const featureNames = ['partialLoader', 'screensaver', 'randomTheme', 'debug', 'serviceWorker'];
        coreResults.value.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.warn(`${featureNames[i]} initialization failed:`, result.reason);
          }
        });
      }

      this.removeSplashScreen();

      const endTime = performance.now();
      logMessage('info', `App initialization completed in ${(endTime - this.startTime).toFixed(2)}ms`);

    } catch (error) {
      console.error('Critical app initialization error:', error);
      this.removeSplashScreen();
    }
  }

  removeSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      splashScreen.style.opacity = '0';
      splashScreen.style.transition = 'opacity 300ms ease-out';
      setTimeout(() => splashScreen.remove(), 300);
    }
  }

  setupSPX() {
    return spx({
      fragments: ['main', 'footer'],
      logLevel: 0,
      cache: true,
      style: ['link[href*="main.css"]'],
      scripts: ['script[src*="main.js"]'],
    });
  }

  getPageType() {
    return this.pageType;
  }

  getCurrentPath() {
    return window.location.pathname;
  }

  isPageType(type) {
    return this.pageType === type;
  }
}
