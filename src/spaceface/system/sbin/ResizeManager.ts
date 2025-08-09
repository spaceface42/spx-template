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
    private elementObservers = new Map<Element, ResizeObserver>();
    private elementCallbacks = new WeakMap<Element, Set<ElementResizeCallback>>();
    private isThrottled = false;
    private boundHandler: () => void;
    private customEvents: string[];

    /** Private to enforce singleton pattern */
    private constructor(customEvents: string[] = ['resize']) {
        this.customEvents = [...new Set(customEvents)];
        this.boundHandler = () => this.handleWindowResize();

        for (const event of this.customEvents) {
            window.addEventListener(event, this.boundHandler, { passive: true });
        }
    }

    /** Get the singleton instance */
    public static getInstance(customEvents?: string[]): ResizeManager {
        if (!ResizeManager.instance) {
            ResizeManager.instance = new ResizeManager(customEvents);
        }
        return ResizeManager.instance;
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

    /** Shared ResizeObserver handler for all elements */
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
        this.elementObservers.forEach((observer) => observer.disconnect());
        this.elementObservers.clear();
        this.elementCallbacks = new WeakMap();
        ResizeManager.instance = null;
        this.destroyed = true;
    }
}

/** Export the singleton instance */
const resizeManager = ResizeManager.getInstance();
export { resizeManager, ResizeManager };
