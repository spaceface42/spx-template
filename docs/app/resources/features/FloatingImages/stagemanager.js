/**
 * StageManager - ActionScript 3 Stage inspired manager for web applications
 * Handles display objects, stage events, and global coordination
 */
class StageManager {
    static #instance = null;
    
    constructor() {
        if (StageManager.#instance) {
            return StageManager.#instance;
        }
        
        this.#init();
        StageManager.#instance = this;
    }
    
    #init() {
        // Display list - all managed display objects
        this.displayObjects = new Set();
        this.displayObjectsById = new Map();
        
        // Stage properties (like AS3 Stage)
        this.stageWidth = window.innerWidth;
        this.stageHeight = window.innerHeight;
        this.scaleMode = 'noScale'; // 'noScale', 'showAll', 'exactFit', 'noBorder'
        this.align = 'topLeft';
        
        // Event system
        this.eventListeners = new Map();
        
        // Frame-based updates (like AS3 ENTER_FRAME)
        this.frameRate = 60;
        this.isRunning = false;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        
        // Resize handling
        this.resizeCallbacks = new Set();
        this.isResizeThrottled = false;
        
        // Performance monitoring
        this.stats = {
            displayObjectCount: 0,
            frameRate: 0,
            lastUpdate: performance.now()
        };
        
        // Bind event handlers
        this.boundResizeHandler = () => this.#handleStageResize();
        this.boundVisibilityHandler = () => this.#handleVisibilityChange();
        
        // Setup global event listeners
        window.addEventListener('resize', this.boundResizeHandler, { passive: true });
        window.addEventListener('orientationchange', this.boundResizeHandler, { passive: true });
        document.addEventListener('visibilitychange', this.boundVisibilityHandler);
        
        // Start the frame loop
        this.start();
    }
    
    /**
     * Handle stage resize (like AS3 Event.RESIZE)
     */
    #handleStageResize() {
        if (this.isResizeThrottled) return;
        
        this.isResizeThrottled = true;
        requestAnimationFrame(() => {
            const oldWidth = this.stageWidth;
            const oldHeight = this.stageHeight;
            
            this.stageWidth = window.innerWidth;
            this.stageHeight = window.innerHeight;
            
            // Dispatch resize event to all listeners
            this.dispatchEvent('resize', {
                stageWidth: this.stageWidth,
                stageHeight: this.stageHeight,
                oldWidth,
                oldHeight
            });
            
            // Notify all display objects
            this.displayObjects.forEach(obj => {
                if (obj.onStageResize) {
                    obj.onStageResize(this.stageWidth, this.stageHeight);
                }
            });
            
            this.isResizeThrottled = false;
        });
    }
    
    /**
     * Handle visibility change (like AS3 Event.ACTIVATE/DEACTIVATE)
     */
    #handleVisibilityChange() {
        const isVisible = !document.hidden;
        this.dispatchEvent(isVisible ? 'activate' : 'deactivate', { visible: isVisible });
        
        // Auto pause/resume based on visibility
        if (isVisible) {
            this.start();
        } else {
            this.stop();
        }
    }
    
    /**
     * Main frame loop (like AS3 ENTER_FRAME)
     */
    #frameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastFrameTime;
        
        // Calculate actual frame rate
        if (deltaTime >= 1000) {
            this.stats.frameRate = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
        }
        
        this.frameCount++;
        
        // Dispatch enter frame event
        this.dispatchEvent('enterFrame', {
            frameCount: this.frameCount,
            deltaTime,
            currentTime
        });
        
        // Update all display objects
        this.displayObjects.forEach(obj => {
            if (obj.update) {
                obj.update(deltaTime, currentTime);
            }
        });
        
        // Schedule next frame
        requestAnimationFrame((time) => this.#frameLoop(time));
    }
    
    /**
     * Add display object to stage (like AS3 addChild)
     */
    addChild(displayObject, id = null) {
        if (!displayObject) {
            throw new Error('Display object is required');
        }
        
        this.displayObjects.add(displayObject);
        
        if (id) {
            this.displayObjectsById.set(id, displayObject);
            displayObject.id = id;
        }
        
        // Set stage reference
        displayObject.stage = this;
        
        // Call added to stage if available
        if (displayObject.onAddedToStage) {
            displayObject.onAddedToStage();
        }
        
        this.stats.displayObjectCount = this.displayObjects.size;
        
        return displayObject;
    }
    
    /**
     * Remove display object from stage (like AS3 removeChild)
     */
    removeChild(displayObject) {
        const removed = this.displayObjects.delete(displayObject);
        
        if (removed) {
            if (displayObject.id) {
                this.displayObjectsById.delete(displayObject.id);
            }
            
            // Clear stage reference
            displayObject.stage = null;
            
            // Call removed from stage if available
            if (displayObject.onRemovedFromStage) {
                displayObject.onRemovedFromStage();
            }
            
            this.stats.displayObjectCount = this.displayObjects.size;
        }
        
        return removed;
    }
    
    /**
     * Get display object by ID (like AS3 getChildByName)
     */
    getChildById(id) {
        return this.displayObjectsById.get(id);
    }
    
    /**
     * Check if display object exists on stage
     */
    contains(displayObject) {
        return this.displayObjects.has(displayObject);
    }
    
    /**
     * Event system (like AS3 addEventListener)
     */
    addEventListener(type, callback) {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, new Set());
        }
        
        this.eventListeners.get(type).add(callback);
        
        return () => this.removeEventListener(type, callback);
    }
    
    /**
     * Remove event listener
     */
    removeEventListener(type, callback) {
        const listeners = this.eventListeners.get(type);
        if (listeners) {
            listeners.delete(callback);
        }
    }
    
    /**
     * Dispatch event to all listeners
     */
    dispatchEvent(type, data = null) {
        const listeners = this.eventListeners.get(type);
        if (!listeners) return;
        
        listeners.forEach(callback => {
            try {
                callback({ type, data, target: this });
            } catch (error) {
                console.error(`StageManager event error (${type}):`, error);
            }
        });
    }
    
    /**
     * Start the frame loop (like AS3 play)
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        
        requestAnimationFrame((time) => this.#frameLoop(time));
        this.dispatchEvent('start');
    }
    
    /**
     * Stop the frame loop (like AS3 stop)
     */
    stop() {
        this.isRunning = false;
        this.dispatchEvent('stop');
    }
    
    /**
     * Set frame rate (like AS3 stage.frameRate)
     */
    setFrameRate(fps) {
        this.frameRate = Math.max(1, Math.min(fps, 120));
    }
    
    /**
     * Get stage bounds (like AS3 stage.stageWidth/stageHeight)
     */
    getBounds() {
        return {
            width: this.stageWidth,
            height: this.stageHeight,
            centerX: this.stageWidth / 2,
            centerY: this.stageHeight / 2
        };
    }
    
    /**
     * Check if point is within stage bounds
     */
    hitTestPoint(x, y) {
        return x >= 0 && x <= this.stageWidth && y >= 0 && y <= this.stageHeight;
    }
    
    /**
     * Get all display objects (like AS3 numChildren)
     */
    getAllChildren() {
        return Array.from(this.displayObjects);
    }
    
    /**
     * Get display object count
     */
    get numChildren() {
        return this.displayObjects.size;
    }
    
    /**
     * Get performance stats
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            frameRate: this.stats.frameRate,
            stageWidth: this.stageWidth,
            stageHeight: this.stageHeight
        };
    }
    
    /**
     * Destroy stage manager (cleanup)
     */
    destroy() {
        this.stop();
        
        // Remove all display objects
        this.displayObjects.forEach(obj => this.removeChild(obj));
        
        // Remove event listeners
        window.removeEventListener('resize', this.boundResizeHandler);
        window.removeEventListener('orientationchange', this.boundResizeHandler);
        document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
        
        // Clear collections
        this.displayObjects.clear();
        this.displayObjectsById.clear();
        this.eventListeners.clear();
        
        StageManager.#instance = null;
    }
    
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!StageManager.#instance) {
            StageManager.#instance = new StageManager();
        }
        return StageManager.#instance;
    }
}

// Export singleton instance
const stageManager = new StageManager();
export default stageManager;