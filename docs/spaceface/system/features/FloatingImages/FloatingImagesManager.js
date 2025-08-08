import { clamp } from '../../usr/bin/math.js';
import { FloatingImage } from './FloatingImage.js';
import { resizeManager } from '../../sbin/ResizeManager.js';
import { AsyncImageLoader } from '../../sbin/AsyncImageLoader.js';
import { PerformanceMonitor } from '../../sbin/PerformanceMonitor.js';
/**
 * Manages floating images using centralized resize management
 * Enhanced FloatingImagesManager with performance monitoring and
 * better memory management
 */
export class FloatingImagesManager {
    constructor(containerOrId, options = {}) {
        // Get container element
        this.container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId)
            : containerOrId;
        if (!this.container) {
            throw new Error('Container not found');
        }
        // Initialize performance monitor
        this.performanceMonitor = new PerformanceMonitor();
        // Initialize properties with performance-aware defaults
        this.images = [];
        this.speedMultiplier = 1;
        this.isInViewport = true;
        this._destroyed = false;
        this._animationId = null;
        // Performance settings
        this.performanceSettings = this.performanceMonitor.getRecommendedSettings();
        this.maxImages = options.maxImages || this.performanceSettings.maxImages;
        // Set up intersection observer for viewport detection
        this.intersectionObserver = new IntersectionObserver(entries => {
            this.isInViewport = entries[0].isIntersecting;
        }, { threshold: 0 });
        this.intersectionObserver.observe(this.container);
        // Initialize resize handling (assuming resizeManager exists or fallback to window)
        this.setupResizeHandling();
        // Initialize
        this.imageLoader = new AsyncImageLoader(this.container);
        this.updateContainerDimensions();
        this.initializeImages();
        this.animate();
    }
    setupResizeHandling() {
        this.unsubscribeWindow = resizeManager.onWindow(() => this.handleResize());
        this.unsubscribeElement = resizeManager.onElement(this.container, () => this.handleResize());
    }
    updateContainerDimensions() {
        const dims = resizeManager.getElement(this.container);
        this.containerWidth = dims.clientWidth;
        this.containerHeight = dims.clientHeight;
    }
    async initializeImages() {
        try {
            const imageElements = await this.imageLoader.waitForImagesToLoad('.floating-image');
            // Limit number of images based on performance
            const limitedImages = imageElements.slice(0, this.maxImages);
            limitedImages.forEach(imgElement => {
                this.addExistingImage(imgElement);
            });
        }
        catch (error) {
            console.warn('Failed to initialize some images:', error);
        }
    }
    addExistingImage(imgElement) {
        if (this.images.length >= this.maxImages) {
            console.warn('Maximum number of images reached, skipping additional images');
            return;
        }
        this.container.manager = this;
        const performanceSettings = this.performanceMonitor.getRecommendedSettings();
        const floatingImage = new FloatingImage(imgElement, this.container, {
            useSubpixel: performanceSettings.useSubpixel
        });
        this.images.push(floatingImage);
    }
    changeSpeed(factor) {
        this.speedMultiplier = clamp(this.speedMultiplier * factor, 0.2, 5);
    }
    handleResize() {
        if (this._destroyed)
            return;
        this.updateContainerDimensions();
        // Clean up invalid images and update valid ones
        this.images = this.images.filter(image => {
            const isValid = image.update(0, false); // Update without applying position
            if (isValid) {
                // Update image size
                const element = image._elementRef?.deref();
                if (element) {
                    image.size.width = element.offsetWidth;
                    image.size.height = element.offsetHeight;
                }
                // Clamp position to new container bounds
                image.x = clamp(image.x, 0, this.containerWidth - image.size.width);
                image.y = clamp(image.y, 0, this.containerHeight - image.size.height);
                image.updatePosition();
                return true;
            }
            else {
                // Clean up destroyed image
                image.destroy();
                return false;
            }
        });
    }
    animate() {
        if (this._destroyed)
            return;
        // Update performance monitoring
        const shouldSkipFrame = this.performanceMonitor.update();
        // Skip frame if performance is poor
        if (shouldSkipFrame || !this.isInViewport || this.speedMultiplier === 0) {
            this._animationId = requestAnimationFrame(() => this.animate());
            return;
        }
        // Update performance settings periodically
        if (this.performanceMonitor.frameCount % 60 === 0) {
            this.performanceSettings = this.performanceMonitor.getRecommendedSettings();
        }
        // Batch DOM updates for better performance
        const validImages = [];
        // Update positions (calculations only)
        this.images.forEach(image => {
            const isValid = image.update(this.speedMultiplier * this.performanceSettings.speedMultiplier, false);
            if (isValid) {
                validImages.push(image);
            }
        });
        // Update the images array if any were invalidated
        if (validImages.length !== this.images.length) {
            // Clean up destroyed images
            this.images.forEach(image => {
                if (!validImages.includes(image)) {
                    image.destroy();
                }
            });
            this.images = validImages;
        }
        // Apply DOM updates in a single batch
        this.images.forEach(image => image.updatePosition());
        this._animationId = requestAnimationFrame(() => this.animate());
    }
    resetAllImagePositions() {
        this.images.forEach(image => {
            if (typeof image.resetPosition === 'function') {
                image.resetPosition();
            }
        });
    }
    destroy() {
        this._destroyed = true;
        // Cancel animation
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        // Clean up resize handling
        if (this.unsubscribeWindow)
            this.unsubscribeWindow();
        if (this.unsubscribeElement)
            this.unsubscribeElement();
        // No fallback resizeHandler to remove
        // Clean up intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        // Clean up images
        this.images.forEach(image => image.destroy());
        this.images.length = 0; // Clear array efficiently
        // Clean up image loader
        if (this.imageLoader) {
            this.imageLoader.destroy();
            this.imageLoader = null;
        }
        // Clear references
        this.container = null;
        this.performanceMonitor = null;
    }
}
