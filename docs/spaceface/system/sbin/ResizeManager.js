class ResizeManager {
    static instance = null;
    destroyed = false;
    windowCallbacks = new Set();
    elementObservers = new WeakMap();
    observerSet = new Set();
    elementCallbacks = new WeakMap();
    isThrottled = false;
    boundHandler = () => this.handleWindowResize();
    customEvents;
    constructor(customEvents = ['resize']) {
        this.customEvents = [...new Set(customEvents)];
        for (const event of this.customEvents) {
            window.addEventListener(event, this.boundHandler, { passive: true });
        }
    }
    static getInstance(customEvents = ['resize']) {
        if (!ResizeManager.instance) {
            ResizeManager.instance = new ResizeManager(customEvents);
        }
        return ResizeManager.instance;
    }
    ensureNotDestroyed() {
        if (this.destroyed) {
            throw new Error('ResizeManager: Instance has been destroyed.');
        }
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
            const observer = new ResizeObserver(this.elementObserverHandler);
            observer.observe(element);
            this.elementObservers.set(element, observer);
            this.observerSet.add(observer);
        }
        callbacks.add(callback);
        return () => {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
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
