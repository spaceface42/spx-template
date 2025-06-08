import spx from '../../lib/spx/index.js';

import { generateId } from '../../system/usr/bin/id.js';
import { eventBus } from '../../system/bin/EventBus.js';
import { DomReadyPromise } from '../../system/sbin/DomReadyPromise.js';
import { InactivityService } from '../../system/bin/InactivityService.js';

export class Spaceface {
  constructor(options = {}) {
    this.config = {
      production: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
      features: options.features ?? {},
      ...options
    };

    this.pageType = this.detectPageType();
    this.startTime = performance.now();

    this.featureModules = {
      // debug: () => import('../../system/usr/bin/InspectorXray.js'),
      partialLoader: () => import('../../system/sbin/PartialLoader.js'),
      slideplayer: () => import('../../system/features/SlidePlayer/SlidePlayer.js'),
      screensaver: () => import('../../system/features/Screensaver/ScreensaverController.js'),
      serviceWorker: () => import('../../system/bin/ServiceWorkerManager.js'),
    };

    this.loadedModules = new Map();
    this.inactivityWatcher = null;
    this.screensaverController = null;
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
        eventBus.emit('log', { level: 'warn', args: [`Failed to load feature module "${featureName}":`, err] });
        this.loadedModules.set(featureName, null);
      }
    }
    return this.loadedModules.get(featureName);
  }

  async initInactivityWatcher() {
    if (!this.config.features.screensaver) return;
    if (this.inactivityWatcher) return;

    this.inactivityWatcher = new InactivityService({
      inactivityDelay: this.config.features.screensaver.delay || 3000,
    });
  }

    async initSlidePlayer() {

        await DomReadyPromise.ready();

        if (!this.config.features.slideplayer) return;

        const module = await this.loadFeatureModule('slideplayer');
        if (!module?.SlidePlayer) return;

        const slideshow = new module.SlidePlayer('.slideshow-container', {
            interval: this.config.features.slideplayer.interval || 5000,
            includePicture: this.config.features.slideplayer.includePicture || false
        });

        // Await the init() Promise that started in constructor
        await slideshow.ready;

        eventBus.emit('log', { level: 'info', args: ['SlidePlayer loaded'] });

        this.slideshow = slideshow;
    }

async initScreensaver() {
  const config = this.config.features.screensaver;
  if (!config) return;

  if (!config.partialUrl) {
    eventBus.emit('log', {
      level: 'error',
      args: ['Screensaver partialUrl is missing in configuration.']
    });
    return;
  }

  const module = await this.loadFeatureModule('screensaver');
  if (!module?.ScreensaverController) return;

  const uniqueId = generateId('screensaver', 9);
  const screensaverDiv = document.createElement('div');
  screensaverDiv.id = uniqueId;
  screensaverDiv.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 999; display: none;
  `;
  document.body.appendChild(screensaverDiv);

  this.screensaverController = new module.ScreensaverController({
    partialUrl: config.partialUrl,
    targetSelector: `#${uniqueId}`,
    inactivityDelay: config.delay || 3000
  });

  if (typeof this.screensaverController.init === 'function') {
    await this.screensaverController.init();
  }

  eventBus.emit('screensaver:initialized', uniqueId);
  eventBus.emit('log', { level: 'info', args: ['Screensaver initialized:', uniqueId] });
}

  async initDebug() {
    if (this.config.production) return;

    const module = await this.loadFeatureModule('debug');
    if (module?.InspectorXray) {
      new module.InspectorXray();
      eventBus.emit('log', { level: 'info', args: ['Debug mode enabled'] });
    }
  }

  async initServiceWorker() {
    if (!this.config.features.serviceWorker) return;

    const module = await this.loadFeatureModule('serviceWorker');
    if (!module?.default) return;

    const swManager = new module.default('/sw.js', {}, {
      strategy: {
        images: 'cache-first',
        others: 'network-first'
      }
    });

    try {
      await swManager.register();
      swManager.configure();
      eventBus.emit('log', { level: 'info', args: ['Service Worker registered and configured'] });
      this.swManager = swManager;
    } catch (error) {
      eventBus.emit('log', { level: 'error', args: [`Service Worker registration failed: ${error.message}`] });
    }
  }

  async initPartialLoader() {
    const module = await this.loadFeatureModule('partialLoader');
    if (!module?.PartialLoader) return null;

    const loader = new module.PartialLoader();
    await loader.init();
    eventBus.emit('log', { level: 'info', args: ['PartialLoader initialized'] });
    return loader;
  }

  async initPageFeatures() {
    eventBus.emit('log', { level: 'info', args: [`Initializing features for page type: ${this.pageType}`] });

    try {
      switch (this.pageType) {
        case 'home':
          // const { initHome } = await import('./_home.js');
          // if (initHome) await initHome();
          break;

        case 'app':
          // const { initApp } = await import('./_app.js');
          // if (initApp) await initApp();
          break;

        default:
          // fallback or no specific page features
          break;
      }
      eventBus.emit('log', { level: 'info', args: [`Page features initialized for: ${this.pageType}`] });
    } catch (error) {
      eventBus.emit('log', { level: 'warn', args: [`Page feature initialization failed for ${this.pageType}:`, error] });
    }
  }

  async init() {
    try {
      eventBus.emit('log', { level: 'info', args: [`App initialization started (Page: ${this.pageType})`] });

      document.documentElement.classList.add('js-enabled');
      document.documentElement.classList.add(`page-${this.pageType}`);

      await DomReadyPromise.ready();
      eventBus.emit('log', { level: 'info', args: ['DOM ready'] });

      // Init inactivity watcher first to start emitting events for screensaver
      await this.initInactivityWatcher();

      // Init screensaver and other core features in parallel
      const coreFeatures = [
        this.initPartialLoader(),
        this.initSlidePlayer(),
        this.initScreensaver(),
        // this.initDebug(),
        this.initServiceWorker()
      ];

      const [coreResults, pageResult] = await Promise.allSettled([
        Promise.allSettled(coreFeatures),
        this.initPageFeatures()
      ]);

      if (coreResults.status === 'fulfilled') {
        const featureNames = ['partialLoader', 'screensaver', 'debug', 'serviceWorker'];
        coreResults.value.forEach((result, i) => {
          if (result.status === 'rejected') {
            eventBus.emit('log', { level: 'warn', args: [`${featureNames[i]} initialization failed:`, result.reason] });
          }
        });
      }

      const endTime = performance.now();
      eventBus.emit('log', { level: 'info', args: [`App initialization completed in ${(endTime - this.startTime).toFixed(2)}ms`] });

    } catch (error) {
      eventBus.emit('log', { level: 'error', args: ['Critical app initialization error:', error] });
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
