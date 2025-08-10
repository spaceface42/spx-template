import {
    ResizeCallback,
    ElementResizeCallback,
    ElementDimensions
} from '../types/sbin.js';

class ResizeManager {
    private static instance: ResizeManager | null = null;

    private destroyed = false;
    private windowCallbacks = new Set<ResizeCallback>();

    private elementObservers = new WeakMap<Element, ResizeObserver>();
    private observerSet = new Set<ResizeObserver>();
    private elementCallbacks = new WeakMap<Element, Set<ElementResizeCallback>>();

    private isThrottled = false;
    private boundHandler = () => this.handleWindowResize();

    private customEvents: string[];

    private constructor(customEvents: string[] = ['resize']) {
        this.customEvents = [...new Set(customEvents)];
        for (const event of this.customEvents) {
            window.addEventListener(event, this.boundHandler, { passive: true });
        }
    }

    public static getInstance(customEvents: string[] = ['resize']): ResizeManager {
        if (!ResizeManager.instance) {
            ResizeManager.instance = new ResizeManager(customEvents);
        }
        return ResizeManager.instance;
    }

    private ensureNotDestroyed(): void {
        if (this.destroyed) {
            throw new Error('ResizeManager: Instance has been destroyed.');
        }
    }

    private handleWindowResize(): void {
        if (this.isThrottled) return;
        this.isThrottled = true;

        requestAnimationFrame(() => {
            for (const callback of this.windowCallbacks) {
                try {
                    callback();
                } catch (e) {
                    console.error('[ResizeManager] Window resize callback error:', e);
                }
            }
            this.isThrottled = false;
        });
    }

    private elementObserverHandler: ResizeObserverCallback = (entries) => {
        for (const entry of entries) {
            const element = entry.target;
            const callbacks = this.elementCallbacks.get(element);
            if (!callbacks) continue;
            for (const callback of callbacks) {
                try {
                    callback(entry);
                } catch (e) {
                    console.error('[ResizeManager] Element resize callback error:', e);
                }
            }
        }
    };

    public onWindow(callback: ResizeCallback): () => void {
        this.ensureNotDestroyed();
        this.windowCallbacks.add(callback);
        return () => this.windowCallbacks.delete(callback);
    }

    public onElement(element: Element, callback: ElementResizeCallback): () => void {
        this.ensureNotDestroyed();

        let callbacks = this.elementCallbacks.get(element);
        if (!callbacks) {
            callbacks = new Set();
            this.elementCallbacks.set(element, callbacks);

            const observer = new ResizeObserver(this.elementObserverHandler);
            observer.observe(element);
            this.elementObservers.set(element, observer);
            this.observerSet.add(observer);
        }

        callbacks.add(callback);

        return () => {
            callbacks!.delete(callback);
            if (callbacks!.size === 0) {
                const observer = this.elementObservers.get(element);
                if (observer) {
                    observer.disconnect();
                    this.observerSet.delete(observer);
                }
                this.elementObservers.delete(element);
                this.elementCallbacks.delete(element);
            }
        };
    }

    public getWindow(): { width: number; height: number } {
        this.ensureNotDestroyed();
        return { width: window.innerWidth, height: window.innerHeight };
    }

    public getElement(element: Element): ElementDimensions {
        this.ensureNotDestroyed();
        const isHTMLElement = element instanceof HTMLElement;
        return {
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            offsetWidth: isHTMLElement ? element.offsetWidth : 0,
            offsetHeight: isHTMLElement ? element.offsetHeight : 0,
        };
    }

    public destroy(): void {
        for (const event of this.customEvents) {
            window.removeEventListener(event, this.boundHandler);
        }

        for (const observer of this.observerSet) {
            observer.disconnect();
        }
        this.observerSet.clear();

        this.windowCallbacks.clear();
        this.elementObservers = new WeakMap();
        this.elementCallbacks = new WeakMap();

        this.destroyed = true;
        ResizeManager.instance = null;
    }
}

export const resizeManager = ResizeManager.getInstance();
