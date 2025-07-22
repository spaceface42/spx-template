import spx from '../../lib/spx/index.js';
import { generateId } from '../../system/usr/bin/id.js';
import { eventBus } from '../../system/bin/EventBus.js';
import { DomReadyPromise } from '../../system/bin/DomReadyPromise.js';
import { InactivityService } from '../../system/sbin/InactivityService.js';
import { AppConfig } from './AppConfig.js';

export class Spaceface {
  static EVENT_LOG = 'log';
  static EVENT_TELEMETRY = 'telemetry';

  constructor(options = {}) {
    this.appConfig = new AppConfig(options);
    this.config = this.appConfig.config;
    this.features = this.config.features ?? {};
    this.debug = !!this.config.debug;

    this.pageType = this.resolvePageType();
    this.startTime = performance.now();

    this.featureModules = this.defineFeatureModules();
    this.featureCache = new Map();
    this.inactivityWatcher = null;
    this.screensaverController = null;

    this.validateConfig();

    // Prefetch all feature modules in parallel (fire and forget)
    Object.keys(this.featureModules).forEach(name => {
      this.loadFeatureModule(name);
    });
  }

  validateConfig() {
    if (!this.config) throw new Error('Missing configuration object');
    if (typeof this.config !== 'object') throw new Error('Invalid configuration format');
    if (!this.config.features) this.log('warn', 'No features specified in config');
  }

  log(level, ...args) {
    if (!this.debug && level === 'debug') return;
    eventBus.emit(Spaceface.EVENT_LOG, { level, args });
  }

  defineFeatureModules() {
    return {
      partialLoader: () =>  import('../../system/bin/PartialLoader.js'),
      slideplayer: () =>    import('../../system/features/SlidePlayer/SlidePlayer.js'),
      screensaver: () =>    import('../../system/features/Screensaver/ScreensaverController.js'),
      serviceWorker: () =>  import('../../system/sbin/ServiceWorkerManager.js'),
      debug: () =>          import('../../system/usr/bin/InspectorXray.js'),
    };
  }

  resolvePageType() {
    const path = window.location.pathname;
    const body = document.body;
    if (body.dataset.page) return body.dataset.page;
    if (path === '/') return 'home';
    if (path === '/app') return 'app';
    return 'default';
  }

  async loadFeatureModule(name) {
    if (!this.featureModules[name]) return null;

    if (!this.featureCache.has(name)) {
      try {
        const module = await this.featureModules[name]();
        this.featureCache.set(name, module);
      } catch (err) {
        const modulePath = this.featureModules[name].toString();
        this.log('warn', `Failed to load "${name}" from ${modulePath}:`, err);
        this.featureCache.set(name, null);
      }
    }

    return this.featureCache.get(name);
  }

  async initInactivityWatcher() {
    const { screensaver } = this.features;
    if (!screensaver || this.inactivityWatcher) return;

    this.inactivityWatcher = new InactivityService({
      inactivityDelay: screensaver.delay || 3000,
    });
  }

  async initSlidePlayer() {
    const { slideplayer } = this.features;
    if (!slideplayer) return;

    const module = await this.loadFeatureModule('slideplayer');
    const SlidePlayer = module?.SlidePlayer;
    if (!SlidePlayer) return;

    const slideshow = new SlidePlayer('.slideshow-container', {
      interval: slideplayer.interval ?? 5000,
      includePicture: slideplayer.includePicture ?? false,
    });

    if (typeof slideshow.ready?.then === 'function') {
      await slideshow.ready;
    }

    this.log('info', 'SlidePlayer loaded');
    this.slideshow = slideshow;
  }

  async initScreensaver() {
    const { screensaver } = this.features;
    if (!screensaver?.partialUrl) {
      this.log('error', 'Screensaver configuration is missing or incomplete.');
      return;
    }

    const module = await this.loadFeatureModule('screensaver');
    const ScreensaverController = module?.ScreensaverController;
    if (!ScreensaverController) return;

    const id = generateId('screensaver', 9);
    const container = Object.assign(document.createElement('div'), {
      id,
      style: `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999; display: none;`,
    });
    document.body.appendChild(container);

    const controllerOptions = {
      partialUrl: screensaver.partialUrl,
      targetSelector: `#${id}`,
      ...(screensaver.delay !== undefined && { inactivityDelay: screensaver.delay }),
    };

    this.screensaverController = new ScreensaverController(controllerOptions);
    if (typeof this.screensaverController.init === 'function') {
      await this.screensaverController.init();
    }

    eventBus.emit('screensaver:initialized', id);
    this.log('info', 'Screensaver initialized:', id);
  }

  async initServiceWorker() {
    const { serviceWorker } = this.features;
    if (!serviceWorker) return;

    const module = await this.loadFeatureModule('serviceWorker');
    const Manager = module?.default;
    if (!Manager) return;

    const swManager = new Manager('/sw.js', {}, {
      strategy: {
        images: 'cache-first',
        others: 'network-first',
      },
    });

    try {
      await swManager.register();
      swManager.configure();
      this.log('info', 'Service Worker registered and configured');
      this.swManager = swManager;
    } catch (err) {
      this.log('error', `Service Worker registration failed: ${err.message}`);
    }
  }

  async initPartialLoader() {
    const module = await this.loadFeatureModule('partialLoader');
    const PartialLoader = module?.PartialLoader;
    if (!PartialLoader) return null;

    const loader = new PartialLoader();
    await loader.init();
    eventBus.on('partial:load', (data) => loader.loadPartial(data), 12);
    this.log('info', 'PartialLoader initialized');
    return loader;
  }

  async initPageFeatures() {
    this.log('info', `Initializing features for page type: ${this.pageType}`);

    try {
      switch (this.pageType) {
        case 'home':
          break;
        case 'app':
          break;
        default:
          break;
      }
      this.log('info', `Page features initialized for: ${this.pageType}`);
    } catch (err) {
      this.log('warn', `Page feature initialization failed for ${this.pageType}:`, err);
    }
  }

  async init() {
    try {
      this.log('info', `App initialization started (Page: ${this.pageType})`);
      document.documentElement.classList.add('js-enabled', `page-${this.pageType}`);

      await DomReadyPromise.ready();
      this.log('info', 'DOM ready');

      await this.initInactivityWatcher();

      await Promise.allSettled([
        this.initPartialLoader(),
        this.initSlidePlayer(),
        this.initScreensaver(),
        this.initServiceWorker(),
      ]);

      await this.initPageFeatures();

      const endTime = performance.now();
      const duration = (endTime - this.startTime).toFixed(2);
      this.log('info', `App initialized in ${duration}ms`);
      eventBus.emit(Spaceface.EVENT_TELEMETRY, {
        type: 'init:duration',
        value: duration,
        page: this.pageType,
      });
    } catch (err) {
      this.log('error', 'Critical app initialization error:', err);
    }
  }

  setupSPX() {
    return spx(this.config.spx ?? {
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
