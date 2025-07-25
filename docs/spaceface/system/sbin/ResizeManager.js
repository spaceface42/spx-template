/**
 * Minimal singleton resize manager - clean, fast, focused.
 */
class ResizeManager {
    static #instance = null;
    #destroyed = false;

    constructor(customEvents = ['resize']) {
        if (ResizeManager.#instance) {
            return ResizeManager.#instance;
        }
        this.windowCallbacks = new Set();
        this.elementObservers = new WeakMap();
        this.elementCallbacks = new WeakMap();
        this.isThrottled = false;
        this.boundHandler = () => this.#handleWindowResize();
        customEvents.forEach(event => window.addEventListener(event, this.boundHandler, { passive: true }));
        ResizeManager.#instance = this;
    }

    #handleWindowResize() {
        if (this.isThrottled) return;

        this.isThrottled = true;
        requestAnimationFrame(() => {
            this.windowCallbacks.forEach(callback => {
                try { callback(); } catch (e) { console.error('Resize callback error:', e); }
            });
            this.isThrottled = false;
        });
    }

    #createElementHandler(element) {
        return (entries) => {
            const callbacks = this.elementCallbacks.get(element);
            if (!callbacks) return;

            requestAnimationFrame(() => {
                callbacks.forEach(callback => {
                    try { callback(entries[0]); } catch (e) { console.error('Element resize error:', e); }
                });
            });
        };
    }

    #ensureNotDestroyed() {
        if (this.#destroyed) throw new Error('ResizeManager: Instance has been destroyed.');
    }

    /**
     * Subscribe to window resize
     * @param {Function} callback
     * @returns {Function} unsubscribe
     */
    onWindow(callback) {
        this.#ensureNotDestroyed();
        this.windowCallbacks.add(callback);
        return () => this.windowCallbacks.delete(callback);
    }

    /**
     * Subscribe to element resize
     * @param {Element} element
     * @param {Function} callback - receives ResizeObserverEntry
     * @returns {Function} unsubscribe
     */
    onElement(element, callback) {
        this.#ensureNotDestroyed();
        if (!this.elementCallbacks.has(element)) {
            this.elementCallbacks.set(element, new Set());
        }

        const callbacks = this.elementCallbacks.get(element);
        callbacks.add(callback);

        if (!this.elementObservers.has(element)) {
            const observer = new ResizeObserver(this.#createElementHandler(element));
            observer.observe(element);
            this.elementObservers.set(element, observer);
        }

        return () => {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.elementObservers.get(element)?.disconnect();
                this.elementObservers.delete(element);
                this.elementCallbacks.delete(element);
            }
        };
    }

    /**
     * Get window dimensions
     */
    getWindow() {
        this.#ensureNotDestroyed();
        return { width: window.innerWidth, height: window.innerHeight };
    }

    /**
     * Get element dimensions
     */
    getElement(element) {
        this.#ensureNotDestroyed();
        return {
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight
        };
    }

    /**
     * Cleanup everything
     */
    destroy() {
        window.removeEventListener('resize', this.boundHandler);
        this.elementObservers.forEach(observer => observer.disconnect());
        this.windowCallbacks.clear();
        this.elementObservers = new WeakMap();
        this.elementCallbacks = new WeakMap();
        ResizeManager.#instance = null;
        this.#destroyed = true;
    }
}

// Export singleton instance
const resizeManager = new ResizeManager();
export { resizeManager }; // Named export
// export default resizeManager; /
