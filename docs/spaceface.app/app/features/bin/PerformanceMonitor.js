/**
 * Performance monitor for detecting lower-end devices and managing frame rates
 */
export class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.targetFPS = 60;
        this.frameSkipThreshold = 30;
        this.shouldSkipFrame = false;
        
        // Optimized moving average using circular buffer
        this.samples = new Float32Array(60); // Use typed array for better performance
        this.sampleIndex = 0;
        this.samplesFilled = 0;
        this.fpsSum = 0;
        
        // Cache performance level to avoid recalculation
        this.cachedPerformanceLevel = 'high';
        this.lastLevelUpdate = 0;
        this.levelUpdateInterval = 1000; // Update level every 1000ms
        
        // Settings cache
        this.cachedSettings = null;
    }

    /**
     * Updates FPS calculation and determines if frame should be skipped
     * @returns {boolean} Whether the current frame should be skipped
     */
    update() {
        const now = performance.now();
        const delta = now - this.lastTime;
        
        // Skip update if delta is too small (prevents division by very small numbers)
        if (delta < 1) return this.shouldSkipFrame;
        
        const currentFPS = 1000 / delta;
        
        // Update moving average using circular buffer
        const oldSample = this.samples[this.sampleIndex];
        this.samples[this.sampleIndex] = currentFPS;
        
        if (this.samplesFilled < this.samples.length) {
            this.fpsSum += currentFPS;
            this.samplesFilled++;
        } else {
            this.fpsSum = this.fpsSum - oldSample + currentFPS;
        }
        
        this.sampleIndex = (this.sampleIndex + 1) % this.samples.length;
        this.fps = this.fpsSum / this.samplesFilled;
        
        this.lastTime = now;
        this.frameCount++;

        // Improved frame skipping with hysteresis to prevent oscillation
        const wasSkipping = this.shouldSkipFrame;
        if (wasSkipping) {
            // Stop skipping if performance improves significantly
            this.shouldSkipFrame = this.fps < (this.frameSkipThreshold + 5);
        } else {
            // Start skipping if performance drops
            this.shouldSkipFrame = this.fps < this.frameSkipThreshold;
        }
        
        // Only skip every other frame to maintain some visual continuity
        if (this.shouldSkipFrame) {
            this.shouldSkipFrame = this.frameCount % 2 === 0;
        }

        return this.shouldSkipFrame;
    }

    /**
     * Gets the current performance level with caching
     * @returns {'high'|'medium'|'low'} Performance level
     */
    getPerformanceLevel() {
        const now = performance.now();
        
        // Update cached level periodically to avoid constant recalculation
        if (now - this.lastLevelUpdate > this.levelUpdateInterval) {
            this.cachedPerformanceLevel = this.fps >= 50 ? 'high' : 
                                        this.fps >= 30 ? 'medium' : 'low';
            this.lastLevelUpdate = now;
            this.cachedSettings = null; // Invalidate settings cache
        }
        
        return this.cachedPerformanceLevel;
    }

    /**
     * Gets recommended settings based on performance with caching
     * @returns {Object} Performance settings
     */
    getRecommendedSettings() {
        if (this.cachedSettings) {
            return this.cachedSettings;
        }
        
        const level = this.getPerformanceLevel();

        console.log(level);
        
        switch (level) {
            case 'high':
                this.cachedSettings = { 
                    maxImages: 50, 
                    speedMultiplier: 1.0, 
                    useSubpixel: true 
                };
                break;
            case 'medium':
                this.cachedSettings = { 
                    maxImages: 25, 
                    speedMultiplier: 0.8, 
                    useSubpixel: false 
                };
                break;
            case 'low':
                this.cachedSettings = { 
                    maxImages: 10, 
                    speedMultiplier: 0.5, 
                    useSubpixel: false 
                };
                break;
            default:
                this.cachedSettings = { 
                    maxImages: 25, 
                    speedMultiplier: 1.0, 
                    useSubpixel: false 
                };
        }
        
        return this.cachedSettings;
    }
    
    /**
     * Gets current FPS
     * @returns {number} Current FPS
     */
    getCurrentFPS() {
        return Math.round(this.fps * 10) / 10; // Round to 1 decimal place
    }
    
    /**
     * Resets the performance monitor
     */
    reset() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.shouldSkipFrame = false;
        this.samples.fill(0);
        this.sampleIndex = 0;
        this.samplesFilled = 0;
        this.fpsSum = 0;
        this.cachedPerformanceLevel = 'high';
        this.lastLevelUpdate = 0;
        this.cachedSettings = null;
    }
}