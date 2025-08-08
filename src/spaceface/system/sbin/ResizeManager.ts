type ResizeCallback = () => void;
type ElementResizeCallback = (entry: ResizeObserverEntry) => void;
type ElementDimensions = {
    clientWidth: number;
    clientHeight: number;
    offsetWidth: number;
    offsetHeight: number;
};

class ResizeManager {
    private static instance: ResizeManager | null = null;

    private destroyed = false;
    private windowCallbacks = new Set<ResizeCallback>();
    private elementObservers = new WeakMap<Element, ResizeObserver>();
    private elementCallbacks = new WeakMap<Element, Set<ElementResizeCallback>>();
    private isThrottled = false;
    private boundHandler = () => this.handleWindowResize();
    private customEvents: string[] = []; // ✅ fixes TS2564

    constructor(customEvents: string[] = ['resize']) {
        if (ResizeManager.instance) return ResizeManager.instance;

        this.customEvents = [...new Set(customEvents)];
        for (const event of this.customEvents) {
            window.addEventListener(event, this.boundHandler, { passive: true });
        }

        ResizeManager.instance = this;
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

    /** Shared ResizeObserver handler for all elements — avoids per-element closures */
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

    private ensureNotDestroyed(): void {
        if (this.destroyed) {
            throw new Error('ResizeManager: Instance has been destroyed.');
        }
    }

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

            // Create and store observer
            const observer = new ResizeObserver(this.elementObserverHandler);
            observer.observe(element);
            this.elementObservers.set(element, observer);
        }

        callbacks.add(callback);

        return () => {
            callbacks!.delete(callback);
            if (callbacks!.size === 0) {
                const observer = this.elementObservers.get(element);
                if (observer) observer.disconnect();
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
        this.windowCallbacks.clear();
        this.elementObservers = new WeakMap();
        this.elementCallbacks = new WeakMap();
        ResizeManager.instance = null;
        this.destroyed = true;
    }
}

const resizeManager = new ResizeManager();
export { resizeManager };
