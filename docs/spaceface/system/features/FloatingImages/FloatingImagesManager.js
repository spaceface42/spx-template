import { clamp } from '../../usr/bin/math.js';
import { FloatingImage } from './FloatingImage.js';
import { resizeManager } from '../../sbin/ResizeManager.js';
import { AsyncImageLoader } from '../../sbin/AsyncImageLoader.js';
import { PerformanceMonitor } from '../../sbin/PerformanceMonitor.js';
export class FloatingImagesManager {
    container;
    performanceMonitor;
    images;
    speedMultiplier;
    isInViewport;
    _destroyed;
    _animationId;
    performanceSettings;
    maxImages;
    intersectionObserver;
    unsubscribeWindow;
    unsubscribeElement;
    imageLoader;
    containerWidth;
    containerHeight;
    constructor(containerOrId, options = {}) {
        this.container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId)
            : containerOrId;
        if (!this.container) {
            throw new Error('Container not found');
        }
        this.container.manager = this;
        this.performanceMonitor = new PerformanceMonitor();
        this.images = [];
        this.speedMultiplier = 1;
        this.isInViewport = true;
        this._destroyed = false;
        this._animationId = null;
        this.performanceSettings = this.performanceMonitor.getRecommendedSettings();
        this.maxImages = options.maxImages ?? this.performanceSettings.maxImages;
        this.intersectionObserver = new IntersectionObserver(entries => {
            this.isInViewport = entries[0].isIntersecting;
        }, { threshold: 0 });
        this.intersectionObserver.observe(this.container);
        this.setupResizeHandling();
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
        this.images = this.images.filter(image => {
            const isValid = image.update(0, false);
            if (isValid) {
                const element = image._elementRef?.deref();
                if (element) {
                    image.size.width = element.offsetWidth;
                    image.size.height = element.offsetHeight;
                }
                image.x = clamp(image.x, 0, this.containerWidth - image.size.width);
                image.y = clamp(image.y, 0, this.containerHeight - image.size.height);
                image.updatePosition();
                return true;
            }
            else {
                image.destroy();
                return false;
            }
        });
    }
    animate() {
        if (this._destroyed)
            return;
        const shouldSkipFrame = this.performanceMonitor.update();
        if (shouldSkipFrame || !this.isInViewport || this.speedMultiplier === 0) {
            this._animationId = requestAnimationFrame(() => this.animate());
            return;
        }
        if (this.performanceMonitor.frameCount % 60 === 0) {
            this.performanceSettings = this.performanceMonitor.getRecommendedSettings();
        }
        const validImages = [];
        this.images.forEach(image => {
            const isValid = image.update(this.speedMultiplier * this.performanceSettings.speedMultiplier, false);
            if (isValid) {
                validImages.push(image);
            }
        });
        if (validImages.length !== this.images.length) {
            this.images.forEach(image => {
                if (!validImages.includes(image)) {
                    image.destroy();
                }
            });
            this.images = validImages;
        }
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
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        if (this.unsubscribeWindow)
            this.unsubscribeWindow();
        if (this.unsubscribeElement)
            this.unsubscribeElement();
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        this.images.forEach(image => image.destroy());
        this.images.length = 0;
        if (this.imageLoader) {
            this.imageLoader.destroy();
            this.imageLoader = null;
        }
        // this.container = null!;
        this.performanceMonitor = null;
    }
}
