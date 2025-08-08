import { eventBus } from '../../bin/EventBus.js';
import { InactivityWatcher } from '../../sbin/InactivityWatcher.js';
import { PartialFetcher } from '../../bin/PartialFetcher.js';
import { FloatingImagesManager } from '../FloatingImages/FloatingImagesManager.js';
import { EventBinder } from '../../bin/EventBinder.js';
export class ScreensaverController {
    partialUrl;
    targetSelector;
    inactivityDelay;
    screensaverManager = null;
    watcher = null;
    onError;
    _destroyed = false;
    eventBinder;
    _onInactivity;
    _onActivity;
    constructor({ partialUrl, targetSelector, inactivityDelay = 12000, onError = null, }) {
        this.partialUrl = partialUrl;
        this.targetSelector = targetSelector;
        this.inactivityDelay = inactivityDelay;
        this.onError = onError;
        this.eventBinder = new EventBinder(true);
        this._onInactivity = this.showScreensaver.bind(this);
        this._onActivity = this.hideScreensaver.bind(this);
        eventBus.emit('screensaver:log', {
            level: 'info',
            message: 'ScreensaverController initialized',
            details: { partialUrl, targetSelector, inactivityDelay },
        });
    }
    async init() {
        if (this._destroyed)
            return;
        try {
            this.watcher = InactivityWatcher.getInstance({ inactivityDelay: this.inactivityDelay });
            this.eventBinder.bindBus('user:inactive', this._onInactivity);
            eventBus.emit('screensaver:log', {
                level: 'info',
                message: 'Bound user:inactive event to showScreensaver',
            });
            this.eventBinder.bindBus('user:active', this._onActivity);
            eventBus.emit('screensaver:log', {
                level: 'info',
                message: 'Bound user:active event to hideScreensaver',
            });
        }
        catch (error) {
            this.handleError('Failed to initialize inactivity watcher', error);
        }
    }
    async showScreensaver() {
        if (this._destroyed)
            return;
        try {
            await PartialFetcher.load(this.partialUrl, this.targetSelector);
            const container = document.querySelector(this.targetSelector);
            if (!container) {
                this.handleError(`ScreensaverController: targetSelector "${this.targetSelector}" is invalid or missing.`);
                return;
            }
            container.style.display = '';
            eventBus.emit('screensaver:log', {
                level: 'info',
                message: 'Screensaver displayed',
                details: { targetSelector: this.targetSelector },
            });
            if (this.screensaverManager) {
                this.screensaverManager.destroy();
                this.screensaverManager = null;
            }
            this.screensaverManager = new FloatingImagesManager(container);
            this.screensaverManager.resetAllImagePositions();
            eventBus.emit('screensaver:log', {
                level: 'info',
                message: 'FloatingImagesManager initialized',
            });
        }
        catch (error) {
            this.handleError('Failed to load or show screensaver', error);
        }
    }
    hideScreensaver() {
        if (this._destroyed)
            return;
        try {
            const container = document.querySelector(this.targetSelector);
            if (container)
                container.style.display = 'none';
            eventBus.emit('screensaver:log', {
                level: 'info',
                message: 'Screensaver hidden',
                details: { targetSelector: this.targetSelector },
            });
            if (this.screensaverManager) {
                this.screensaverManager.destroy();
                this.screensaverManager = null;
                eventBus.emit('screensaver:log', {
                    level: 'info',
                    message: 'FloatingImagesManager destroyed',
                });
            }
        }
        catch (error) {
            this.handleError('Failed to hide screensaver', error);
        }
    }
    destroy() {
        if (this._destroyed)
            return;
        this._destroyed = true;
        try {
            this.hideScreensaver();
            if (this.watcher) {
                this.watcher.destroy();
                this.watcher = null;
                eventBus.emit('screensaver:log', {
                    level: 'info',
                    message: 'InactivityService destroyed',
                });
            }
            this.eventBinder.unbindAll();
            eventBus.emit('screensaver:log', {
                level: 'info',
                message: 'EventBinder unbound all events',
            });
        }
        catch (error) {
            this.handleError('Failed to destroy screensaver controller', error);
        }
        this.onError = null;
        eventBus.emit('screensaver:log', {
            level: 'info',
            message: 'ScreensaverController destroyed',
        });
    }
    handleError(message, error) {
        if (this._destroyed)
            return;
        console.error(`${message}:`, error);
        eventBus.emit('screensaver:error', {
            message,
            error,
        });
        if (typeof this.onError === 'function') {
            try {
                this.onError(message, error);
            }
            catch (callbackError) {
                console.error('Error in error callback:', callbackError);
                eventBus.emit('screensaver:error', {
                    message: 'Error in error callback',
                    error: callbackError,
                });
            }
        }
    }
}
