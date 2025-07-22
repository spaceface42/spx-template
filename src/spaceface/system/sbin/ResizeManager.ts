/**
 * Minimal singleton resize manager - clean, fast, focused.
 */

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

    private destroyed: boolean = false;
    private windowCallbacks: Set<ResizeCallback> = new Set();
    private elementObservers: WeakMap<Element, ResizeObserver> = new WeakMap();
    private elementCallbacks: WeakMap<Element, Set<ElementResizeCallback>> = new WeakMap();
    private isThrottled: boolean = false;
    private boundHandler: () => void = () => this.handleWindowResize();
    private customEvents!: string[];

    constructor(customEvents: string[] = ['resize']) {
        if (ResizeManager.instance) {
            return ResizeManager.instance;
        }

        this.customEvents = customEvents;
        for (const event of customEvents) {
            window.addEventListener(event, this.boundHandler, { passive: true });
        }

        ResizeManager.instance = this;
    }

    private handleWindowResize(): void {
        if (this.isThrottled) return;

        this.isThrottled = true;
        requestAnimationFrame(() => {
            this.windowCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (e) {
                    console.error('Resize callback error:', e);
                }
            });
            this.isThrottled = false;
        });
    }

    private createElementHandler(element: Element): ResizeObserverCallback {
        return (entries: ResizeObserverEntry[]) => {
            const callbacks = this.elementCallbacks.get(element);
            if (!callbacks) return;

            requestAnimationFrame(() => {
                callbacks.forEach(callback => {
                    try {
                        callback(entries[0]);
                    } catch (e) {
                        console.error('Element resize error:', e);
                    }
                });
            });
        };
    }

    private ensureNotDestroyed(): void {
        if (this.destroyed) {
            throw new Error('ResizeManager: Instance has been destroyed.');
        }
    }

    /**
     * Subscribe to window resize.
     * @param callback - A callback function triggered on window resize.
     * @returns A function to unsubscribe.
     */
    public onWindow(callback: ResizeCallback): () => void {
        this.ensureNotDestroyed();
        this.windowCallbacks.add(callback);
        return () => this.windowCallbacks.delete(callback);
    }

    /**
     * Subscribe to element resize.
     * @param element - The DOM element to observe.
     * @param callback - Callback receiving ResizeObserverEntry.
     * @returns A function to unsubscribe.
     */
    public onElement(element: Element, callback: ElementResizeCallback): () => void {
        this.ensureNotDestroyed();

        if (!this.elementCallbacks.has(element)) {
            this.elementCallbacks.set(element, new Set());
        }

        const callbacks = this.elementCallbacks.get(element)!;
        callbacks.add(callback);

        if (!this.elementObservers.has(element)) {
            const observer = new ResizeObserver(this.createElementHandler(element));
            observer.observe(element);
            this.elementObservers.set(element, observer);
        }

        return () => {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                const observer = this.elementObservers.get(element);
                if (observer) {
                    observer.disconnect();
                }
                this.elementObservers.delete(element);
                this.elementCallbacks.delete(element);
            }
        };
    }

    /**
     * Get current window dimensions.
     */
    public getWindow(): { width: number; height: number } {
        this.ensureNotDestroyed();
        return {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }

    /**
     * Get current element dimensions.
     */
    public getElement(element: Element): ElementDimensions {
        this.ensureNotDestroyed();

        const clientWidth = element.clientWidth;
        const clientHeight = element.clientHeight;
        const isHTMLElement = element instanceof HTMLElement;

        return {
            clientWidth,
            clientHeight,
            offsetWidth: isHTMLElement ? element.offsetWidth : 0,
            offsetHeight: isHTMLElement ? element.offsetHeight : 0,
        };
    }

    /**
     * Clean up everything and destroy singleton.
     */
    public destroy(): void {
        window.removeEventListener('resize', this.boundHandler);

        this.customEvents.forEach(event => {
            window.removeEventListener(event, this.boundHandler);
        });

        // Since WeakMap doesn't have forEach, we need to track elements differently
        // This approach relies on the fact that we'll clean up properly when callbacks are removed
        this.windowCallbacks.clear();
        this.elementObservers = new WeakMap();
        this.elementCallbacks = new WeakMap();
        ResizeManager.instance = null;
        this.destroyed = true;
    }
}

// Export singleton instance
const resizeManager = new ResizeManager();
export { resizeManager };
