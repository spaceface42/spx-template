import { eventBus } from '../../bin/EventBus.js';
import { InactivityService } from '../../bin/InactivityService.js';
import { PartialFetcher } from '../../sbin/PartialFetcher.js';
import { FloatingImagesManager } from '../FloatingImages/FloatingImagesManager.js';

export class ScreensaverController {
  constructor({ partialUrl, targetSelector, inactivityDelay = 30000, onError = null }) {
    this.partialUrl = partialUrl;
    this.targetSelector = targetSelector;
    this.inactivityDelay = inactivityDelay;
    this.screensaverManager = null;
    this.watcher = null;
    this.onError = onError;
    this._destroyed = false;

    this._onInactivity = this.showScreensaver.bind(this);
    this._onActivity = this.hideScreensaver.bind(this);
  }

  async init() {
    if (this._destroyed) return;

    try {
      // this.watcher = new InactivityWatcher({ inactivityDelay: this.inactivityDelay });
      this.watcher = new InactivityService({ inactivityDelay: this.inactivityDelay });

      // Listen for events emitted by the watcher
      eventBus.on('user:inactive', this._onInactivity);
      eventBus.on('user:active', this._onActivity);
    } catch (error) {
      this.handleError('Failed to initialize inactivity watcher', error);
    }
  }

  async showScreensaver() {
    if (this._destroyed) return;

    try {
      await PartialFetcher.load(this.partialUrl, this.targetSelector);

      const container = document.querySelector(this.targetSelector);
      if (container) container.style.display = '';

      if (this.screensaverManager) {
        this.screensaverManager.destroy();
        this.screensaverManager = null;
      }

      this.screensaverManager = new FloatingImagesManager(container);
      this.screensaverManager.resetAllImagePositions();
    } catch (error) {
      this.handleError('Failed to load or show screensaver', error);
    }
  }

  hideScreensaver() {
    if (this._destroyed) return;

    try {
      const container = document.querySelector(this.targetSelector);
      if (container) container.style.display = 'none';

      if (this.screensaverManager) {
        this.screensaverManager.destroy();
        this.screensaverManager = null;
      }
    } catch (error) {
      this.handleError('Failed to hide screensaver', error);
    }
  }

  destroy() {
    this._destroyed = true;

    try {
      this.hideScreensaver();
      if (this.watcher) {
        this.watcher.destroy();
        this.watcher = null;
      }

      eventBus.off('user:inactive', this._onInactivity);
      eventBus.off('user:active', this._onActivity);
    } catch (error) {
      this.handleError('Failed to destroy screensaver controller', error);
    }

    this.onError = null;
  }

  handleError(message, error) {
    if (this._destroyed) return;

    console.error(`${message}:`, error);
    if (typeof this.onError === 'function') {
      try {
        this.onError(message, error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    }
  }
}
