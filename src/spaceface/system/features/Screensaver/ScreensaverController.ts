import { eventBus } from '../../bin/EventBus.js';
import { InactivityWatcher } from '../../sbin/InactivityWatcher.js';
import { PartialFetcher } from '../../bin/PartialFetcher.js';
import { FloatingImagesManager } from '../FloatingImages/FloatingImagesManager.js';
import { EventBinder } from '../../bin/EventBinder.js';

export interface ScreensaverControllerOptions {
    partialUrl: string;
    targetSelector: string;
    inactivityDelay?: number;
    onError?: (message: string, error: unknown) => void;
}

export class ScreensaverController {
    private partialUrl: string;
    private targetSelector: string;
    private inactivityDelay: number;
    private screensaverManager: FloatingImagesManager | null = null;
    private watcher: InactivityWatcher | null = null;
    private onError?: (message: string, error: unknown) => void;
    private _destroyed = false;
    private eventBinder: EventBinder;
    private _partialLoaded = false;
    private _onInactivity: () => void;
    private _onActivity: () => void;

    constructor({ partialUrl, targetSelector, inactivityDelay = 12000, onError }: ScreensaverControllerOptions) {
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
            details: { partialUrl, targetSelector, inactivityDelay }
        });
    }

    async init(): Promise<void> {
        if (this._destroyed) return;

        try {
            this.watcher = InactivityWatcher.getInstance({
                inactivityDelay: this.inactivityDelay
            });

            this.eventBinder.bindBus('user:inactive', this._onInactivity);
            this.eventBinder.bindBus('user:active', this._onActivity);

            eventBus.emit('screensaver:log', {
                level: 'info',
                message: 'Bound user inactivity/active events'
            });
        } catch (error) {
            this.handleError('Failed to initialize inactivity watcher', error);
        }
    }

    async showScreensaver(): Promise<void> {
        if (this._destroyed) return;

        try {
            if (!this._partialLoaded) {
                await PartialFetcher.load(this.partialUrl, this.targetSelector);
                this._partialLoaded = true;
            }

            const container = document.querySelector<HTMLElement>(this.targetSelector);
            if (!container) {
                this.handleError(`Target selector "${this.targetSelector}" not found`, null);
                return;
            }

            // Reset opacity for animation replay
            container.style.opacity = '0';
            container.style.display = '';
            void container.offsetWidth; // Force reflow
            container.style.transition = 'opacity 0.5s ease';
            container.style.opacity = '1';

            if (!this.screensaverManager) {
                this.screensaverManager = new FloatingImagesManager(container);
                this.screensaverManager.resetAllImagePositions();
            } else if (typeof (this.screensaverManager as any).resume === 'function') {
                (this.screensaverManager as any).resume();
            }

            eventBus.emit('screensaver:log', {
                level: 'info',
                message: 'Screensaver displayed'
            });
        } catch (error) {
            this.handleError('Failed to load or show screensaver', error);
        }
    }

    hideScreensaver(): void {
        if (this._destroyed) return;

        try {
            const container = document.querySelector<HTMLElement>(this.targetSelector);
            if (container) {
                container.style.transition = 'opacity 0.5s ease';
                container.style.opacity = '0';
                setTimeout(() => {
                    if (container) container.style.display = 'none';
                }, 500);
            }

            if (this.screensaverManager) {
                if (typeof (this.screensaverManager as any).pause === 'function') {
                    (this.screensaverManager as any).pause();
                } else {
                    this.screensaverManager.destroy();
                    this.screensaverManager = null;
                }
            }

            eventBus.emit('screensaver:log', {
                level: 'info',
                message: 'Screensaver hidden'
            });
        } catch (error) {
            this.handleError('Failed to hide screensaver', error);
        }
    }

    destroy(): void {
        if (this._destroyed) return;
        this._destroyed = true;

        this.hideScreensaver();

        if (this.watcher) {
            this.watcher.destroy();
            this.watcher = null;
        }

        this.eventBinder.unbindAll();
        this.onError = undefined;
        this._partialLoaded = false;

        eventBus.emit('screensaver:log', {
            level: 'info',
            message: 'ScreensaverController destroyed'
        });
    }

    private handleError(message: string, error: unknown): void {
        if (this._destroyed) return;
        console.error(`${message}:`, error);

        eventBus.emit('screensaver:error', { message, error });

        if (typeof this.onError === 'function') {
            try {
                this.onError(message, error);
            } catch (callbackError) {
                console.error('Error in error callback:', callbackError);
                eventBus.emit('screensaver:error', {
                    message: 'Error in error callback',
                    error: callbackError
                });
            }
        }
    }
}
