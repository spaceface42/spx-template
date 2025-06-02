import { InactivityWatcher } from '../_42/InactivityWatcher.js';
import { PartialFetcher } from '../../../system/42/PartialFetcher.js';
import { FloatingImageManager } from '../FloatingImages/FloatingImageManager.js';

export class ScreensaverController {
    constructor({ partialUrl, targetSelector, inactivityDelay = 30000 }) {
        this.partialUrl = partialUrl;
        this.targetSelector = targetSelector;
        this.inactivityDelay = inactivityDelay;
        this.screensaverManager = null;
        this.partialLoaded = false;
        this.watcher = null; // Will be set in init()
    }

    async init() {
        // Set up the inactivity watcher
        this.watcher = new InactivityWatcher({
            inactivityDelay: this.inactivityDelay,
            onInactivity: () => this.showScreensaver(),
            onActivity: () => this.hideScreensaver()
        });
    }

    async showScreensaver() {
        if (!this.partialLoaded) {
            await PartialFetcher.load(this.partialUrl, this.targetSelector);
            this.partialLoaded = true;
        }
        const container = document.querySelector(this.targetSelector);
        if (container) container.style.display = '';

        // Always destroy previous manager if exists
        if (this.screensaverManager) {
            this.screensaverManager.destroy();
            this.screensaverManager = null;
        }

        // Create a new manager and randomize positions
        this.screensaverManager = new FloatingImageManager(container);
        this.screensaverManager.resetAllImagePositions();
    }

    hideScreensaver() {
        const container = document.querySelector(this.targetSelector);
        if (container) container.style.display = 'none';
        if (this.screensaverManager) {
            this.screensaverManager.destroy();
            this.screensaverManager = null;
        }
    }

    destroy() {
        this.watcher.destroy();
    }
}
