class ServiceWorkerManager {
    swPath;
    options;
    customConfig;
    registration = null;
    isSupported;
    constructor(swPath = '/sw.js', options = {}, customConfig = {}) {
        this.swPath = swPath;
        this.options = {
            scope: '/',
            updateViaCache: 'none',
            ...options,
        };
        this.customConfig = customConfig;
        this.isSupported = 'serviceWorker' in navigator;
    }
    /**
     * Register the service worker
     */
    async register() {
        if (!this.isSupported) {
            throw new Error('ServiceWorker not supported');
        }
        try {
            this.registration = await navigator.serviceWorker.register(this.swPath, this.options);
            this.setupEventListeners();
            return this.registration;
        }
        catch (error) {
            console.error('SW registration failed:', error);
            throw error;
        }
    }
    /**
     * Apply custom configuration after registration
     */
    configure() {
        if (this.customConfig.strategy) {
            this.setStrategy(this.customConfig.strategy);
        }
    }
    /**
     * Unregister the service worker
     */
    async unregister() {
        if (!this.registration)
            return false;
        try {
            return await this.registration.unregister();
        }
        catch (error) {
            console.error('SW unregistration failed:', error);
            return false;
        }
    }
    /**
     * Update the service worker
     */
    async update() {
        if (!this.registration)
            return null;
        try {
            // registration.update() returns void
            await this.registration.update();
            return null;
        }
        catch (error) {
            console.error('SW update failed:', error);
            return null;
        }
    }
    /**
     * Get registration status
     */
    getStatus() {
        if (!this.registration)
            return 'unregistered';
        if (this.registration.installing)
            return 'installing';
        if (this.registration.waiting)
            return 'waiting';
        if (this.registration.active)
            return 'active';
        return 'unknown';
    }
    /**
     * Setup lifecycle event listeners
     */
    setupEventListeners() {
        if (!this.registration)
            return;
        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration?.installing;
            if (!newWorker)
                return;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.onUpdateAvailable?.(newWorker);
                }
            });
        });
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            this.onControllerChange?.();
        });
    }
    /**
     * Send a message to the service worker
     */
    async postMessage(message, transfer) {
        const sw = navigator.serviceWorker.controller;
        if (!sw)
            throw new Error('No active service worker');
        if (transfer) {
            sw.postMessage(message, { transfer });
        }
        else {
            sw.postMessage(message);
        }
    }
    /**
     * Wait for message from service worker
     */
    waitForMessage(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Message timeout')), timeout);
            const handler = (event) => {
                clearTimeout(timer);
                navigator.serviceWorker.removeEventListener('message', handler);
                resolve(event.data);
            };
            navigator.serviceWorker.addEventListener('message', handler);
        });
    }
    /**
     * Activate the waiting service worker
     */
    async activateWaiting() {
        if (!this.registration?.waiting)
            return false;
        try {
            await this.postMessage({ type: 'SKIP_WAITING' });
            return true;
        }
        catch (error) {
            console.error('Failed to activate waiting SW:', error);
            return false;
        }
    }
    /**
     * Set runtime cache strategy (e.g., cache-first or network-first)
     */
    setStrategy(config = {}) {
        if (!navigator.serviceWorker.controller) {
            console.warn('No active SW to set strategy');
            return;
        }
        this.postMessage({
            type: 'SET_STRATEGY',
            payload: config,
        });
    }
}
export default ServiceWorkerManager;
