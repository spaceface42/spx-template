/**
 * Modern ServiceWorker ESM Class
 * Minimal, fast, and failsafe implementation
 */
class ServiceWorkerManager {
  constructor(swPath = '/sw.js', options = {}) {
    this.swPath = swPath;
    this.options = {
      scope: '/',
      updateViaCache: 'none',
      ...options
    };
    this.registration = null;
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
      this.registration = await navigator.serviceWorker.register(
        this.swPath,
        this.options
      );

      this.setupEventListeners();
      return this.registration;
    } catch (error) {
      console.error('SW registration failed:', error);
      throw error;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister() {
    if (!this.registration) return false;

    try {
      return await this.registration.unregister();
    } catch (error) {
      console.error('SW unregistration failed:', error);
      return false;
    }
  }

  /**
   * Update the service worker
   */
  async update() {
    if (!this.registration) return null;

    try {
      return await this.registration.update();
    } catch (error) {
      console.error('SW update failed:', error);
      return null;
    }
  }

  /**
   * Get registration status
   */
  getStatus() {
    if (!this.registration) return 'unregistered';

    if (this.registration.installing) return 'installing';
    if (this.registration.waiting) return 'waiting';
    if (this.registration.active) return 'active';

    return 'unknown';
  }

  /**
   * Setup event listeners for SW lifecycle
   */
  setupEventListeners() {
    if (!this.registration) return;

    // Handle updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          this.onUpdateAvailable?.(newWorker);
        }
      });
    });

    // Handle controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.onControllerChange?.();
    });
  }

  /**
   * Post message to service worker
   */
  async postMessage(message, transfer) {
    const sw = navigator.serviceWorker.controller;
    if (!sw) throw new Error('No active service worker');

    sw.postMessage(message, transfer);
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
   * Skip waiting and claim clients
   */
  async activateWaiting() {
    if (!this.registration?.waiting) return false;

    try {
      await this.postMessage({ type: 'SKIP_WAITING' });
      return true;
    } catch (error) {
      console.error('Failed to activate waiting SW:', error);
      return false;
    }
  }

  // Event handler stubs (override these)
  onUpdateAvailable(newWorker) {
    console.log('New service worker available');
  }

  onControllerChange() {
    console.log('Service worker controller changed');
  }
}

export default ServiceWorkerManager;
