/**
 * Performance monitor for detecting lower-end devices and managing frame rates
 */
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.targetFPS = 60;
        this.frameSkipThreshold = 30; // Skip frames if FPS drops below this
        this.shouldSkipFrame = false;
        this.skipCounter = 0;
        this.samples = [];
        this.maxSamples = 60; // Track last 60 frames
    }

    /**
     * Updates FPS calculation and determines if frame should be skipped
     * @returns {boolean} Whether the current frame should be skipped
     */
    update() {
        const now = performance.now();
        const delta = now - this.lastTime;
        
        if (delta >= 16.67) { // ~60fps
            this.frameCount++;
            this.samples.push(1000 / delta);
            
            if (this.samples.length > this.maxSamples) {
                this.samples.shift();
            }
            
            // Calculate average FPS from recent samples
            if (this.samples.length >= 10) {
                this.fps = this.samples.reduce((a, b) => a + b) / this.samples.length;
            }
            
            this.lastTime = now;
        }

        // Determine if we should skip frames
        if (this.fps < this.frameSkipThreshold) {
            this.skipCounter++;
            this.shouldSkipFrame = this.skipCounter % 2 === 0; // Skip every other frame
        } else {
            this.shouldSkipFrame = false;
            this.skipCounter = 0;
        }

        return this.shouldSkipFrame;
    }

    /**
     * Gets the current performance level
     * @returns {'high'|'medium'|'low'} Performance level
     */
    getPerformanceLevel() {
        if (this.fps >= 50) return 'high';
        if (this.fps >= 30) return 'medium';
        return 'low';
    }

    /**
     * Gets recommended settings based on performance
     * @returns {Object} Performance settings
     */
    getRecommendedSettings() {
        const level = this.getPerformanceLevel();
        
        switch (level) {
            case 'high':
                return { maxImages: 50, speedMultiplier: 1.0, useSubpixel: true };
            case 'medium':
                return { maxImages: 25, speedMultiplier: 0.8, useSubpixel: false };
            case 'low':
                return { maxImages: 10, speedMultiplier: 0.5, useSubpixel: false };
            default:
                return { maxImages: 25, speedMultiplier: 1.0, useSubpixel: false };
        }
    }
}