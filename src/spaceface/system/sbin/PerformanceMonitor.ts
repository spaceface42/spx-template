import { logMessage } from '../usr/bin/logging.js';
import { PerformanceSettings } from './types.js';

type PerformanceLevel = 'high' | 'medium' | 'low';

export class PerformanceMonitor {
    private frameCount: number;
    private lastTime: number;
    private fps: number;
    private targetFPS: number;
    private frameSkipThreshold: number;
    private shouldSkipFrame: boolean;

    private samples: Float32Array;
    private sampleIndex: number;
    private samplesFilled: number;
    private fpsSum: number;

    private cachedPerformanceLevel: PerformanceLevel;
    private lastLevelUpdate: number;
    private levelUpdateInterval: number;

    private cachedSettings: PerformanceSettings | null;

    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.targetFPS = 60;
        this.frameSkipThreshold = 30;
        this.shouldSkipFrame = false;

        this.samples = new Float32Array(60);
        this.sampleIndex = 0;
        this.samplesFilled = 0;
        this.fpsSum = 0;

        this.cachedPerformanceLevel = 'high';
        this.lastLevelUpdate = 0;
        this.levelUpdateInterval = 1000;

        this.cachedSettings = null;
    }

    /**
     * Updates FPS calculation and determines if frame should be skipped
     * @returns Whether the current frame should be skipped
     */
    public update(): boolean {
        const now = performance.now();
        const delta = now - this.lastTime;

        if (delta < 1) return this.shouldSkipFrame;

        const currentFPS = 1000 / delta;

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

        const wasSkipping = this.shouldSkipFrame;
        if (wasSkipping) {
            this.shouldSkipFrame = this.fps < (this.frameSkipThreshold + 5);
        } else {
            this.shouldSkipFrame = this.fps < this.frameSkipThreshold;
        }

        if (this.shouldSkipFrame) {
            this.shouldSkipFrame = this.frameCount % 2 === 0;
        }

        return this.shouldSkipFrame;
    }

    /**
     * Gets the current performance level with caching
     */
    public getPerformanceLevel(): PerformanceLevel {
        const now = performance.now();

        if (now - this.lastLevelUpdate > this.levelUpdateInterval) {
            this.cachedPerformanceLevel =
                this.fps >= 50 ? 'high' :
                this.fps >= 30 ? 'medium' : 'low';

            this.lastLevelUpdate = now;
            this.cachedSettings = null;
        }

        return this.cachedPerformanceLevel;
    }

    /**
     * Gets recommended settings based on performance with caching
     */
    public getRecommendedSettings(): PerformanceSettings {
        if (this.cachedSettings) {
            return this.cachedSettings;
        }

        const level = this.getPerformanceLevel();

        logMessage('info', `Performance: ${level}`);

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
     * Gets current FPS rounded to 1 decimal place
     */
    public getCurrentFPS(): number {
        return Math.round(this.fps * 10) / 10;
    }

    /**
     * Resets the performance monitor state
     */
    public reset(): void {
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

    // inside PerformanceMonitor.ts
    public getFrameCount(): number {
        return this.frameCount;
    }

}
