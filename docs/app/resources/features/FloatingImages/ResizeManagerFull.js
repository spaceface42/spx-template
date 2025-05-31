/**
 * Centralized singleton resize manager for handling window and element resize events.
 * Optimized with debouncing, batched callbacks, and performance monitoring.
 */
class ResizeManager {
    static #instance = null;
    
    constructor() {
        if (ResizeManager.#instance) {
            return ResizeManager.#instance;
        }
        
        this.#init();
        ResizeManager.#instance = this;
    }
    
    #init() {
        // Callback collections
        this.windowCallbacks = new Set();
        this.elementObservers = new WeakMap();
        this.elementCallbacks = new WeakMap();
        
        // Performance settings
        this.debounceDelay = 16; // ~60fps default
        this.isDebounced = false;
        this.lastWindowSize = { width: window.innerWidth, height: window.innerHeight };
        
        // Performance monitoring
        this.stats = {
            windowResizeCount: 0,
            elementResizeCount: 0,
            lastUpdate: performance.now()
        };
        
        // Store bound handler for proper cleanup
        this.boundWindowResizeHandler = (e) => this.#handleWindowResize(e);
        
        // Start listening
        window.addEventListener('resize', this.boundWindowResizeHandler, { passive: true });
        
        // Optional: Listen for orientation changes on mobile
        if ('onorientationchange' in window) {
            this.boundOrientationHandler = () => this.#handleOrientationChange();
            window.addEventListener('orientationchange', this.boundOrientationHandler, { passive: true });
        }
    }
    
    /**
     * Debounced window resize handler with size change detection
     */
    #handleWindowResize(event) {
        // Skip if no actual size change (some browsers fire resize without size change)
        const currentSize = { width: window.innerWidth, height: window.innerHeight };
        if (currentSize.width === this.lastWindowSize.width && 
            currentSize.height === this.lastWindowSize.height) {
            return;
        }
        
        this.lastWindowSize = currentSize;
        
        if (this.isDebounced) return;
        
        this.isDebounced = true;
        this.stats.windowResizeCount++;
        
        // Use RAF for smooth updates, with optional delay for heavy operations
        const executeCallbacks = () => {
            const resizeData = {
                width: currentSize.width,
                height: currentSize.height,
                event,
                timestamp: performance.now()
            };
            
            this.windowCallbacks.forEach(callback => {
                try {
                    callback(resizeData);
                } catch (error) {
                    console.error('ResizeManager: Window resize callback error:', error);
                }
            });
            
            this.isDebounced = false;
            this.stats.lastUpdate = performance.now();
        };
        
        if (this.debounceDelay > 0) {
            setTimeout(() => requestAnimationFrame(executeCallbacks), this.debounceDelay);
        } else {
            requestAnimationFrame(executeCallbacks);
        }
    }
    
    /**
     * Handle orientation changes (mobile)
     */
    #handleOrientationChange() {
        // Delay to account for browser UI changes
        setTimeout(() => {
            this.#handleWindowResize({ type: 'orientationchange' });
        }, 150);
    }
    
    /**
     * Creates optimized element resize observer handler
     */
    #createElementResizeHandler(element) {
        return (entries) => {
            const callbacks = this.elementCallbacks.get(element);
            if (!callbacks?.size) return;
            
            this.stats.elementResizeCount++;
            
            // Batch DOM reads and writes
            requestAnimationFrame(() => {
                const entry = entries[0];
                const resizeData = {
                    entry,
                    element,
                    contentRect: entry.contentRect,
                    borderBoxSize: entry.borderBoxSize?.[0],
                    contentBoxSize: entry.contentBoxSize?.[0],
                    timestamp: performance.now()
                };
                
                callbacks.forEach(callback => {
                    try {
                        callback(resizeData);
                    } catch (error) {
                        console.error('ResizeManager: Element resize callback error:', error);
                    }
                });
            });
        };
    }
    
    /**
     * Subscribe to window resize events
     * @param {Function} callback - Function called with {width, height, event, timestamp}
     * @param {Object} options - {immediate: boolean} - call immediately with current size
     * @returns {Function} Unsubscribe function
     */
    onWindowResize(callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        this.windowCallbacks.add(callback);
        
        // Call immediately with current dimensions if requested
        if (options.immediate) {
            callback({
                width: window.innerWidth,
                height: window.innerHeight,
                event: null,
                timestamp: performance.now()
            });
        }
        
        return () => this.windowCallbacks.delete(callback);
    }
    
    /**
     * Subscribe to element resize events
     * @param {Element} element - DOM element to observe
     * @param {Function} callback - Function called with resize data object
     * @param {Object} options - {immediate: boolean} - call immediately with current size
     * @returns {Function} Unsubscribe function
     */
    onElementResize(element, callback, options = {}) {
        if (!(element instanceof Element)) {
            throw new Error('First argument must be a DOM element');
        }
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        
        // Initialize callbacks set for this element
        if (!this.elementCallbacks.has(element)) {
            this.elementCallbacks.set(element, new Set());
        }
        
        const callbacks = this.elementCallbacks.get(element);
        callbacks.add(callback);
        
        // Create observer if first callback for this element
        if (!this.elementObservers.has(element)) {
            const observer = new ResizeObserver(this.#createElementResizeHandler(element));
            observer.observe(element);
            this.elementObservers.set(element, observer);
        }
        
        // Call immediately if requested
        if (options.immediate) {
            const rect = element.getBoundingClientRect();
            callback({
                element,
                contentRect: rect,
                timestamp: performance.now()
            });
        }
        
        return () => {
            callbacks.delete(callback);
            
            // Cleanup observer if no callbacks remain
            if (callbacks.size === 0) {
                const observer = this.elementObservers.get(element);
                observer?.disconnect();
                this.elementObservers.delete(element);
                this.elementCallbacks.delete(element);
            }
        };
    }
    
    /**
     * Set debounce delay for window resize events
     * @param {number} delay - Delay in milliseconds (0 = no delay, just RAF)
     */
    setDebounceDelay(delay) {
        if (typeof delay !== 'number' || delay < 0) {
            throw new Error('Delay must be a non-negative number');
        }
        this.debounceDelay = delay;
    }
    
    /**
     * Get current window dimensions and viewport info
     * @returns {Object} Comprehensive window size data
     */
    getWindowDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: window.screen.orientation?.angle || 0
        };
    }
    
    /**
     * Get comprehensive element dimensions
     * @param {Element} element - DOM element
     * @returns {Object} All relevant dimension properties
     */
    getElementDimensions(element) {
        if (!(element instanceof Element)) {
            throw new Error('Argument must be a DOM element');
        }
        
        const rect = element.getBoundingClientRect();
        const computed = getComputedStyle(element);
        
        return {
            // BoundingClientRect
            ...rect,
            
            // Element properties
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight,
            scrollWidth: element.scrollWidth,
            scrollHeight: element.scrollHeight,
            
            // Computed styles (margins, padding, borders)
            marginTop: parseFloat(computed.marginTop) || 0,
            marginRight: parseFloat(computed.marginRight) || 0,
            marginBottom: parseFloat(computed.marginBottom) || 0,
            marginLeft: parseFloat(computed.marginLeft) || 0,
            paddingTop: parseFloat(computed.paddingTop) || 0,
            paddingRight: parseFloat(computed.paddingRight) || 0,
            paddingBottom: parseFloat(computed.paddingBottom) || 0,
            paddingLeft: parseFloat(computed.paddingLeft) || 0,
            borderTopWidth: parseFloat(computed.borderTopWidth) || 0,
            borderRightWidth: parseFloat(computed.borderRightWidth) || 0,
            borderBottomWidth: parseFloat(computed.borderBottomWidth) || 0,
            borderLeftWidth: parseFloat(computed.borderLeftWidth) || 0
        };
    }
    
    /**
     * Check if element is currently visible in viewport
     * @param {Element} element - DOM element to check
     * @param {number} threshold - Percentage of element that must be visible (0-1)
     * @returns {boolean}
     */
    isElementVisible(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
        
        if (visibleHeight <= 0 || visibleWidth <= 0) return false;
        
        const visibleArea = visibleHeight * visibleWidth;
        const totalArea = rect.height * rect.width;
        
        return (visibleArea / totalArea) >= threshold;
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance stats
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Reset performance statistics
     */
    resetStats() {
        this.stats.windowResizeCount = 0;
        this.stats.elementResizeCount = 0;
        this.stats.lastUpdate = performance.now();
    }
    
    /**
     * Clean up all observers and event listeners
     */
    destroy() {
        // Remove window event listeners
        window.removeEventListener('resize', this.boundWindowResizeHandler);
        if (this.boundOrientationHandler) {
            window.removeEventListener('orientationchange', this.boundOrientationHandler);
        }
        
        // Disconnect all element observers
        this.elementObservers.forEach(observer => observer.disconnect());
        
        // Clear all collections
        this.windowCallbacks.clear();
        this.elementObservers = new WeakMap();
        this.elementCallbacks = new WeakMap();
        
        // Reset singleton
        ResizeManager.#instance = null;
    }
    
    /**
     * Get singleton instance
     * @returns {ResizeManager}
     */
    static getInstance() {
        if (!ResizeManager.#instance) {
            ResizeManager.#instance = new ResizeManager();
        }
        return ResizeManager.#instance;
    }
}

// Export singleton instance
export default new ResizeManager();