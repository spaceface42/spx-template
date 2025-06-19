import spx from '../../lib/spx/index.js';
import { generateId } from '../../system/usr/bin/id.js';
import { eventBus } from '../../system/bin/EventBus.js';
import { DomReadyPromise } from '../../system/bin/DomReadyPromise.js';
import { InactivityService } from '../../system/sbin/InactivityService.js';
import { AppConfig } from './AppConfig.js';

const EVENT_LOG = 'log'; // Define a constant for the log event

export class Spaceface {
  constructor(options = {}) {
    this.appConfig = new AppConfig(options);
    this.config = this.appConfig.config;

    this.pageType = this.detectPageType();
    this.startTime = performance.now();

    this.featureModules = this.defineFeatureModules();
    this.loadedModules = new Map();
    this.inactivityWatcher = null;
    this.screensaverController = null;

    // console.log(this.appConfig.get('hostname')); // Logs the current hostname
  }

  /**
   * Define feature modules for dynamic imports
   */
  defineFeatureModules() {
    return {
      partialLoader: () => import('../../system/bin/PartialLoader.js'),
      slideplayer: () => import('../../system/features/SlidePlayer/SlidePlayer.js'),
      screensaver: () => import('../../system/features/Screensaver/ScreensaverController.js'),
      serviceWorker: () => import('../../system/sbin/ServiceWorkerManager.js'),
      debug: () => import('../../system/usr/bin/InspectorXray.js'),
    };
  }

  /**
   * Detect the current page type
   */
  detectPageType() {
    const path = window.location.pathname;
    const body = document.body;

    if (body.dataset.page) return body.dataset.page;
    if (path === '/') return 'home';
    if (path === '/app') return 'app';

    return 'default';
  }

  /**
   * Load a feature module dynamically
   */
  async loadFeatureModule(featureName) {
    if (!this.featureModules[featureName]) return null;

    if (!this.loadedModules.has(featureName)) {
      try {
        const module = await this.featureModules[featureName]();
        this.loadedModules.set(featureName, module);
      } catch (err) {
        const modulePath = this.featureModules[featureName].toString();
        eventBus.emit(EVENT_LOG, {
          level: 'warn',
          args: [`Failed to load feature module "${featureName}" from ${modulePath}:`, err],
        });
        this.loadedModules.set(featureName, null);
      }
    }

    return this.loadedModules.get(featureName);
  }

  /**
   * Initialize the inactivity watcher
   */
  async initInactivityWatcher() {
    const screensaverConfig = this.config.features.screensaver;
    if (!screensaverConfig || this.inactivityWatcher) return;

    this.inactivityWatcher = new InactivityService({
      inactivityDelay: screensaverConfig.delay || 3000,
    });
  }

  /**
   * Initialize the SlidePlayer feature
   */
  async initSlidePlayer() {
    await DomReadyPromise.ready();

    const slideplayerConfig = this.config.features.slideplayer;
    if (!slideplayerConfig) return;

    const module = await this.loadFeatureModule('slideplayer');
    if (!module?.SlidePlayer) return;

    const slideshow = new module.SlidePlayer('.slideshow-container', {
      interval: slideplayerConfig.interval || 5000,
      includePicture: slideplayerConfig.includePicture || false,
    });

    await slideshow.ready;

    eventBus.emit(EVENT_LOG, { level: 'info', args: ['SlidePlayer loaded'] });
    this.slideshow = slideshow;
  }

  /**
   * Initialize the Screensaver feature
   */
  async initScreensaver() {
    const screensaverConfig = this.config.features.screensaver;

    // Ensure the screensaver configuration exists and has a partialUrl
    if (!screensaverConfig || !screensaverConfig.partialUrl) {
      eventBus.emit(EVENT_LOG, {
        level: 'error',
        args: ['Screensaver configuration is missing or incomplete.'],
      });
      return;
    }

    // Load the Screensaver module
    const module = await this.loadFeatureModule('screensaver');
    if (!module?.ScreensaverController) {
      eventBus.emit(EVENT_LOG, {
        level: 'error',
        args: ['Failed to load ScreensaverController module.'],
      });
      return;
    }

    // Create a unique ID for the screensaver container
    const uniqueId = generateId('screensaver', 9);
    const screensaverDiv = document.createElement('div');
    screensaverDiv.id = uniqueId;
    screensaverDiv.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: 999; display: none;
    `;
    document.body.appendChild(screensaverDiv);

    // Initialize the ScreensaverController
    const controllerOptions = {
      partialUrl: screensaverConfig.partialUrl,
      targetSelector: `#${uniqueId}`,
    };

    // Only pass inactivityDelay if it is explicitly defined
    if (screensaverConfig.delay !== undefined) {
      controllerOptions.inactivityDelay = screensaverConfig.delay;
    }

    this.screensaverController = new module.ScreensaverController(controllerOptions);

    // Check if the init method exists and call it
    if (typeof this.screensaverController.init === 'function') {
      await this.screensaverController.init();
    }

    // Emit events for debugging and visibility
    eventBus.emit('screensaver:initialized', uniqueId);
    eventBus.emit(EVENT_LOG, { level: 'info', args: ['Screensaver initialized:', uniqueId] });
  }

  /**
   * Initialize the Service Worker
   */
  async initServiceWorker() {
    const serviceWorkerConfig = this.config.features.serviceWorker;
    if (!serviceWorkerConfig) return;

    const module = await this.loadFeatureModule('serviceWorker');
    if (!module?.default) return;

    const swManager = new module.default('/sw.js', {}, {
      strategy: {
        images: 'cache-first',
        others: 'network-first',
      },
    });

    try {
      await swManager.register();
      swManager.configure();
      eventBus.emit(EVENT_LOG, { level: 'info', args: ['Service Worker registered and configured'] });
      this.swManager = swManager;
    } catch (error) {
      eventBus.emit(EVENT_LOG, { level: 'error', args: [`Service Worker registration failed: ${error.message}`] });
    }
  }

  /**
   * Initialize the PartialLoader feature
   */
  async initPartialLoader() {
    const module = await this.loadFeatureModule('partialLoader');
    if (!module?.PartialLoader) return null;

    const loader = new module.PartialLoader();
    await loader.init();
    eventBus.emit(EVENT_LOG, { level: 'info', args: ['PartialLoader initialized'] });
    return loader;
  }

  /**
   * Initialize page-specific features
   */
  async initPageFeatures() {
    eventBus.emit(EVENT_LOG, { level: 'info', args: [`Initializing features for page type: ${this.pageType}`] });

    try {
      switch (this.pageType) {
        case 'home':
          // Add home-specific initialization logic here
          break;

        case 'app':
          // Add app-specific initialization logic here
          break;

        default:
          // No specific page features
          break;
      }

      eventBus.emit(EVENT_LOG, { level: 'info', args: [`Page features initialized for: ${this.pageType}`] });
    } catch (error) {
      eventBus.emit(EVENT_LOG, { level: 'warn', args: [`Page feature initialization failed for ${this.pageType}:`, error] });
    }
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      eventBus.emit(EVENT_LOG, { level: 'info', args: [`App initialization started (Page: ${this.pageType})`] });

      document.documentElement.classList.add('js-enabled');
      document.documentElement.classList.add(`page-${this.pageType}`);

      await DomReadyPromise.ready();
      eventBus.emit(EVENT_LOG, { level: 'info', args: ['DOM ready'] });

      await this.initInactivityWatcher();

      const coreFeatures = [
        this.initPartialLoader(),
        this.initSlidePlayer(),
        this.initScreensaver(),
        this.initServiceWorker(),
      ];

      await Promise.allSettled(coreFeatures);
      await this.initPageFeatures();

      const endTime = performance.now();
      eventBus.emit(EVENT_LOG, { level: 'info', args: [`App initialization completed in ${(endTime - this.startTime).toFixed(2)}ms`] });
    } catch (error) {
      eventBus.emit(EVENT_LOG, { level: 'error', args: ['Critical app initialization error:', error] });
    }
  }

  /**
   * Setup SPX
   */
  setupSPX() {
    return spx({
      fragments: ['main', 'footer'],
      logLevel: 0,
      cache: true,
      style: ['link[href*="main.css"]'],
      scripts: ['script[src*="main.js"]'],
    });
  }

  /**
   * Utility methods
   */
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
