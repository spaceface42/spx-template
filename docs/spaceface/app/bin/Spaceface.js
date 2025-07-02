import spx from '../../lib/spx/index.js';
import { generateId } from '../../system/usr/bin/id.js';
import { eventBus } from '../../system/bin/EventBus.js';
import { DomReadyPromise } from '../../system/bin/DomReadyPromise.js';
import { InactivityService } from '../../system/sbin/InactivityService.js';
import { AppConfig } from './AppConfig.js';

export class Spaceface {
  static EVENT_LOG = 'log';

  constructor(options = {}) {
    this.appConfig = new AppConfig(options);
    this.config = this.appConfig.config;
    this.features = this.config.features ?? {};

    this.pageType = this.resolvePageType();
    this.startTime = performance.now();

    this.featureModules = this.defineFeatureModules();
    this.featureCache = new Map();
    this.inactivityWatcher = null;
    this.screensaverController = null;
  }

  defineFeatureModules() {
    return {
      partialLoader: () => import('../../system/bin/PartialLoader.js'),
      slideplayer: () => import('../../system/features/SlidePlayer/SlidePlayer.js'),
      screensaver: () => import('../../system/features/Screensaver/ScreensaverController.js'),
      serviceWorker: () => import('../../system/sbin/ServiceWorkerManager.js'),
      debug: () => import('../../system/usr/bin/InspectorXray.js'),
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
        eventBus.emit(Spaceface.EVENT_LOG, {
          level: 'warn',
          args: [`Failed to load "${name}" from ${modulePath}:`, err],
        });
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

    eventBus.emit(Spaceface.EVENT_LOG, { level: 'info', args: ['SlidePlayer loaded'] });
    this.slideshow = slideshow;
  }

  async initScreensaver() {
    const { screensaver } = this.features;
    if (!screensaver?.partialUrl) {
      eventBus.emit(Spaceface.EVENT_LOG, {
        level: 'error',
        args: ['Screensaver configuration is missing or incomplete.'],
      });
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
    eventBus.emit(Spaceface.EVENT_LOG, { level: 'info', args: ['Screensaver initialized:', id] });
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
      eventBus.emit(Spaceface.EVENT_LOG, { level: 'info', args: ['Service Worker registered and configured'] });
      this.swManager = swManager;
    } catch (err) {
      eventBus.emit(Spaceface.EVENT_LOG, { level: 'error', args: [`Service Worker registration failed: ${err.message}`] });
    }
  }

  async initPartialLoader() {
    const module = await this.loadFeatureModule('partialLoader');
    const PartialLoader = module?.PartialLoader;
    if (!PartialLoader) return null;

    const loader = new PartialLoader();
    await loader.init();
    eventBus.on('partial:load', (data) => loader.loadPartial(data), 12);
    eventBus.emit(Spaceface.EVENT_LOG, { level: 'info', args: ['PartialLoader initialized'] });
    return loader;
  }

  async initPageFeatures() {
    eventBus.emit(Spaceface.EVENT_LOG, { level: 'info', args: [`Initializing features for page type: ${this.pageType}`] });

    try {
      switch (this.pageType) {
        case 'home':
          break;
        case 'app':
          break;
        default:
          break;
      }
      eventBus.emit(Spaceface.EVENT_LOG, { level: 'info', args: [`Page features initialized for: ${this.pageType}`] });
    } catch (err) {
      eventBus.emit(Spaceface.EVENT_LOG, { level: 'warn', args: [`Page feature initialization failed for ${this.pageType}:`, err] });
    }
  }

  async init() {
    try {
      eventBus.emit(Spaceface.EVENT_LOG, { level: 'info', args: [`App initialization started (Page: ${this.pageType})`] });
      document.documentElement.classList.add('js-enabled', `page-${this.pageType}`);

      await DomReadyPromise.ready();
      eventBus.emit(Spaceface.EVENT_LOG, { level: 'info', args: ['DOM ready'] });

      await this.initInactivityWatcher();

      await Promise.allSettled([
        this.initPartialLoader(),
        this.initSlidePlayer(),
        this.initScreensaver(),
        this.initServiceWorker(),
      ]);

      await this.initPageFeatures();

      const endTime = performance.now();
      eventBus.emit(Spaceface.EVENT_LOG, { level: 'info', args: [`App initialized in ${(endTime - this.startTime).toFixed(2)}ms`] });
    } catch (err) {
      eventBus.emit(Spaceface.EVENT_LOG, { level: 'error', args: ['Critical app initialization error:', err] });
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
