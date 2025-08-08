class ResizeManager {
    static instance = null;
    destroyed = false;
    windowCallbacks = new Set();
    elementObservers = new WeakMap();
    elementCallbacks = new WeakMap();
    isThrottled = false;
    boundHandler = () => this.handleWindowResize();
    customEvents = []; // ✅ fixes TS2564
    constructor(customEvents = ['resize']) {
        if (ResizeManager.instance)
            return ResizeManager.instance;
        this.customEvents = [...new Set(customEvents)];
        for (const event of this.customEvents) {
            window.addEventListener(event, this.boundHandler, { passive: true });
        }
        ResizeManager.instance = this;
    }
    handleWindowResize() {
        if (this.isThrottled)
            return;
        this.isThrottled = true;
        requestAnimationFrame(() => {
            for (const callback of this.windowCallbacks) {
                try {
                    callback();
                }
                catch (e) {
                    console.error('[ResizeManager] Window resize callback error:', e);
                }
            }
            this.isThrottled = false;
        });
    }
    /** Shared ResizeObserver handler for all elements — avoids per-element closures */
    elementObserverHandler = (entries) => {
        for (const entry of entries) {
            const element = entry.target;
            const callbacks = this.elementCallbacks.get(element);
            if (!callbacks)
                continue;
            for (const callback of callbacks) {
                try {
                    callback(entry);
                }
                catch (e) {
                    console.error('[ResizeManager] Element resize callback error:', e);
                }
            }
        }
    };
    ensureNotDestroyed() {
        if (this.destroyed) {
            throw new Error('ResizeManager: Instance has been destroyed.');
        }
    }
    onWindow(callback) {
        this.ensureNotDestroyed();
        this.windowCallbacks.add(callback);
        return () => this.windowCallbacks.delete(callback);
    }
    onElement(element, callback) {
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
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                const observer = this.elementObservers.get(element);
                if (observer)
                    observer.disconnect();
                this.elementObservers.delete(element);
                this.elementCallbacks.delete(element);
            }
        };
    }
    getWindow() {
        this.ensureNotDestroyed();
        return { width: window.innerWidth, height: window.innerHeight };
    }
    getElement(element) {
        this.ensureNotDestroyed();
        const isHTMLElement = element instanceof HTMLElement;
        return {
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            offsetWidth: isHTMLElement ? element.offsetWidth : 0,
            offsetHeight: isHTMLElement ? element.offsetHeight : 0,
        };
    }
    destroy() {
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
