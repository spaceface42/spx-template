/**
 * AppInitializer - Page-aware progressive enhancement
 * Simple approach: detect page type and load accordingly
 */
import spx from './library/spx/index.js';
import { logMessage, generateId } from './system/sbin/Utilities.js';
import { DomReadyPromise } from './system/sbin/DomReadyPromise.js';

export class Spaceface {
    constructor(options = {}) {
        this.config = {
            production: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
            features: options.features ?? {},
            ...options
        };
        
        this.modules = new Map();
        this.pageType = this.detectPageType();
        this.startTime = performance.now();
    }

    // Detect what type of page we're on
    detectPageType() {
        const path = window.location.pathname;
        const body = document.body;
        
        // Method 1: Check data attribute (recommended)
        if (body.dataset.page) {
            return body.dataset.page;
        }
        
        // Method 2: Check path patterns
        if (path === '/') return 'home';
        if (path === '/app') return 'app';
        if (path === '/contact') return 'contact';
        if (path.startsWith('/products/')) return 'product';
        if (path.startsWith('/dashboard')) return 'dashboard';
        if (path.startsWith('/admin')) return 'admin';
       /* 
        // Method 3: Check for specific elements that indicate page type
        if (document.querySelector('[data-dashboard]')) return 'dashboard';
        if (document.querySelector('[data-product-id]')) return 'product';
        if (document.querySelector('.admin-panel')) return 'admin';
        */
        return 'default';
    }

    // Lazy import with caching
    async lazyImport(modulePath) {
        if (this.modules.has(modulePath)) {
            return this.modules.get(modulePath);
        }
        
        try {
            const module = await import(modulePath);
            this.modules.set(modulePath, module);
            return module;
        } catch (error) {
            console.warn(`Failed to load module: ${modulePath}`, error);
            this.modules.set(modulePath, null);
            return null;
        }
    }

    // Core feature initializers (same as before)
    async initScreensaver() {
        if (!this.config.features.screensaver) return;
        
        try {
            const module = await this.lazyImport('./app/FloatingImages/ScreensaverController.js');
            const ScreensaverController = module?.ScreensaverController;
            
            if (!ScreensaverController) return;

            const uniqueId = generateId('screensaver', 9);
            const screensaverDiv = document.createElement('div');
            screensaverDiv.id = uniqueId;
            screensaverDiv.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                z-index: 1; display: none;
            `;
            
            document.body.appendChild(screensaverDiv);

            const controller = new ScreensaverController({
                partialUrl: '/content/screensaver/screensaver.html',
                targetSelector: `#${uniqueId}`,
                inactivityDelay: this.config.features.screensaver.delay || 3000
            });

            if (typeof controller.init === 'function') {
                await controller.init();
            }

            logMessage('info', 'Screensaver initialized:', uniqueId);
        } catch (error) {
            console.warn('Screensaver initialization failed:', error);
        }
    }

    async initRandomTheme() {
        if (!this.config.features.randomTheme) return;
        
        try {
            const module = await this.lazyImport('./app/RandomTheme/RandomThemeLoader.js');
            const RandomThemeLoader = module?.RandomThemeLoader;
            
            if (!RandomThemeLoader) return;

            const loader = new RandomThemeLoader(
                this.config.features.randomTheme.themes || [
                    '/spaceface/spacesuit/random/one.css',
                    '/spaceface/spacesuit/random/two.css',
                    '/spaceface/spacesuit/random/three.css'
                ]
            );
            
            await loader.loadRandomTheme();
            logMessage('info', 'Random theme loaded');
        } catch (error) {
            console.warn('Random theme loading failed:', error);
        }
    }

    async initDebug() {
        if (this.config.production) return;
        
        try {
            const module = await this.lazyImport('./system/sbin/InspectorXray.js');
            const InspectorXray = module?.InspectorXray;
            
            if (InspectorXray) {
                new InspectorXray();
                logMessage('info', 'Debug mode enabled');
            }
        } catch (error) {
            console.warn('Debug initialization failed:', error);
        }
    }

    async initServiceWorker() {
        if (!this.config.features.serviceWorker) return;
        
        try {
            const module = await this.lazyImport('./app/ServiceWorker.js');
            const ServiceWorkerManager = module?.default;
            
            if (!ServiceWorkerManager) return;

            const swManager = new ServiceWorkerManager('/sw.js');
            await swManager.register();
            logMessage('info', 'Service Worker registered');
        } catch (error) {
            console.warn('Service Worker registration failed:', error);
        }
    }

    async initPartialLoader() {
        try {
            const module = await this.lazyImport('./system/sbin/PartialLoader.js');
            const PartialLoader = module?.PartialLoader;
            
            if (!PartialLoader) return;

            const loader = new PartialLoader();
            await loader.init();
            logMessage('info', 'PartialLoader initialized');
            return loader;
        } catch (error) {
            console.warn('PartialLoader initialization failed:', error);
            return null;
        }
    }

    // Page-specific initializers
    async initPageFeatures() {
        logMessage('info', `Initializing features for page type: ${this.pageType}`);
        
        try {
            switch (this.pageType) {
                case 'home':
                    console.log('home');
                    // const { initHome } = await this.lazyImport('./pages/home.js') || {};
                    // if (initHome) await initHome();
                    break;

                case 'app':
                    console.log('app');
                    // const { initHome } = await this.lazyImport('./pages/home.js') || {};
                    // if (initHome) await initHome();
                    break;


                case 'dashboard':
                    // Load heavy dashboard features in parallel
                    const [charts, tables, realtime] = await Promise.allSettled([
                        this.lazyImport('.charts.js'),
                        this.lazyImport('.data-tables.js'),
                        this.lazyImport('.realtime.js')
                    ]);
                    
                    if (charts.status === 'fulfilled' && charts.value?.initCharts) {
                        await charts.value.initCharts();
                    }
                    if (tables.status === 'fulfilled' && tables.value?.initTables) {
                        await tables.value.initTables();
                    }
                    if (realtime.status === 'fulfilled' && realtime.value?.initRealtime) {
                        await realtime.value.initRealtime();
                    }
                    break;
                    
                case 'product':
                    const productId = this.getProductId();
                    const { initProduct } = await this.lazyImport('./pages/product.js') || {};
                    if (initProduct) await initProduct(productId);
                    break;
                    
                case 'admin':
                    const { initAdmin } = await this.lazyImport('./pages/admin.js') || {};
                    if (initAdmin) await initAdmin();
                    break;
                    
                case 'contact':
                    const { initContactForm } = await this.lazyImport('.contact-form.js') || {};
                    if (initContactForm) await initContactForm();
                    break;
                    
                default:
                    // Common enhancements for all pages
                    const { initCommon } = await this.lazyImport('.common.js') || {};
                    if (initCommon) await initCommon();
            }
            
            logMessage('info', `Page features initialized for: ${this.pageType}`);
        } catch (error) {
            console.warn(`Page feature initialization failed for ${this.pageType}:`, error);
        }
    }

    // Helper to extract product ID from various sources
    getProductId() {
        // Try data attribute first
        const productEl = document.querySelector('[data-product-id]');
        if (productEl) return productEl.dataset.productId;
        
        // Try URL path
        const pathMatch = window.location.pathname.match(/\/products\/([^\/]+)/);
        if (pathMatch) return pathMatch[1];
        
        return null;
    }

    // Main initialization
    async init() {
        try {
            logMessage('info', `App initialization started (Page: ${this.pageType})`);

            // Mark JS as available
            document.documentElement.classList.add('js-enabled');
            document.documentElement.classList.add(`page-${this.pageType}`);

            // Wait for DOM
            await DomReadyPromise.ready();
            logMessage('info', 'DOM ready');

            // Initialize core features and page features in parallel
            const [coreResults, pageResult] = await Promise.allSettled([
                // Core features (parallel)
                Promise.allSettled([
                    this.initPartialLoader(),
                    this.initScreensaver(),
                    this.initRandomTheme(),
                    this.initDebug(),
                    this.initServiceWorker()
                ]),
                // Page-specific features
                this.initPageFeatures()
            ]);

            // Log any core feature failures
            if (coreResults.status === 'fulfilled') {
                const featureNames = ['partialLoader', 'screensaver', 'randomTheme', 'debug', 'serviceWorker'];
                coreResults.value.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        console.warn(`${featureNames[index]} initialization failed:`, result.reason);
                    }
                });
            }

            // Remove splash screen
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

    // Utility getters
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