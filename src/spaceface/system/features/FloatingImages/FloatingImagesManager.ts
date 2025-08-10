import { clamp } from '../../usr/bin/math.js';
import { FloatingImage } from './FloatingImage.js';
import { resizeManager } from '../../sbin/ResizeManager.js';
import { AsyncImageLoader } from '../../sbin/AsyncImageLoader.js';
import { PerformanceMonitor } from '../../sbin/PerformanceMonitor.js';
import { PerformanceSettings, 
         ContainerDimensions, 
         FloatingImagesManagerOptions } from '../../types/features.js';



export class FloatingImagesManager {
    readonly container: HTMLElement;
    performanceMonitor: PerformanceMonitor;
    images: FloatingImage[];
    speedMultiplier: number;
    isInViewport: boolean;
    private _destroyed: boolean;
    private _animationId: number | null;
    performanceSettings: PerformanceSettings;
    maxImages: number;
    intersectionObserver: IntersectionObserver;
    unsubscribeWindow?: () => void;
    unsubscribeElement?: () => void;
    imageLoader: AsyncImageLoader;
    containerWidth!: number;
    containerHeight!: number;

    constructor(containerOrId: string | HTMLElement, options: FloatingImagesManagerOptions = {}) {
        this.container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId)!
            : containerOrId;

        if (!this.container) {
            throw new Error('Container not found');
        }

        this.performanceMonitor = new PerformanceMonitor();
        this.images = [];
        this.speedMultiplier = 1;
        this.isInViewport = true;
        this._destroyed = false;
        this._animationId = null;

        this.performanceSettings = this.performanceMonitor.getRecommendedSettings();
        this.maxImages = options.maxImages ?? this.performanceSettings.maxImages;

        // Intersection observer to pause when out of view
        this.intersectionObserver = new IntersectionObserver(entries => {
            this.isInViewport = entries[0].isIntersecting;
        }, { threshold: 0 });
        this.intersectionObserver.observe(this.container);

        this.setupResizeHandling();
        this.imageLoader = new AsyncImageLoader(this.container);
        this.updateContainerDimensions();

        // Initialize asynchronously and start animation when ready
        this.initializeImages().then(() => this.animate());
    }

    private setupResizeHandling() {
        this.unsubscribeWindow = resizeManager.onWindow(() => this.handleResize());
        this.unsubscribeElement = resizeManager.onElement(this.container, () => this.handleResize());
    }

    private updateContainerDimensions() {
        const dims = resizeManager.getElement(this.container);
        this.containerWidth = dims.clientWidth;
        this.containerHeight = dims.clientHeight;
    }

    private async initializeImages() {
        try {
            const imageElements = await this.imageLoader.waitForImagesToLoad('.floating-image');
            const limitedImages = imageElements.slice(0, this.maxImages);
            const dims = this.getDimensions();
            limitedImages.forEach(imgElement => {
                this.addExistingImage(imgElement, dims);
            });
        }
        catch (error) {
            console.warn('Failed to initialize some images:', error);
        }
    }

    private getDimensions(): ContainerDimensions {
        return { width: this.containerWidth, height: this.containerHeight };
    }

    private addExistingImage(imgElement: HTMLElement, dims: ContainerDimensions) {
        if (this.images.length >= this.maxImages) {
            console.warn('Maximum number of images reached, skipping additional images');
            return;
        }
        const performanceSettings = this.performanceMonitor.getRecommendedSettings();
        const floatingImage = new FloatingImage(imgElement, dims, {
            useSubpixel: performanceSettings.useSubpixel
        });
        this.images.push(floatingImage);
    }

    changeSpeed(factor: number) {
        this.speedMultiplier = clamp(this.speedMultiplier * factor, 0.2, 5);
    }

    private handleResize() {
        if (this._destroyed) return;
        this.updateContainerDimensions();
        const dims = this.getDimensions();

        for (let i = 0; i < this.images.length; i++) {
            const image = this.images[i];
            image.updateSize();
            image.clampPosition(dims);
            image.updatePosition();
        }
    }

private animate() {
    if (this._destroyed) return;

    const shouldSkipFrame = this.performanceMonitor.update();
    if (shouldSkipFrame || !this.isInViewport || this.speedMultiplier === 0) {
        this._animationId = requestAnimationFrame(() => this.animate());
        return;
    }

    if (this.performanceMonitor.getFrameCount() % 60 === 0) {
        this.performanceSettings = this.performanceMonitor.getRecommendedSettings();
    }

    const multiplier = this.speedMultiplier * this.performanceSettings.speedMultiplier;
    const dims = this.getDimensions();
    const updatedImages: FloatingImage[] = [];

    for (let i = 0; i < this.images.length; i++) {
        const img = this.images[i];
        if (img.update(multiplier, dims, false)) {
            img.updatePosition();
            updatedImages.push(img);
        } else {
            img.destroy();
        }
    }

    this.images = updatedImages;
    this._animationId = requestAnimationFrame(() => this.animate());
}


    resetAllImagePositions() {
        const dims = this.getDimensions();
        this.images.forEach(image => image.resetPosition(dims));
    }

    destroy() {
        this._destroyed = true;
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        if (this.unsubscribeWindow) this.unsubscribeWindow();
        if (this.unsubscribeElement) this.unsubscribeElement();
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null!;
        }
        this.images.forEach(image => image.destroy());
        this.images.length = 0;
        if (this.imageLoader) {
            this.imageLoader.destroy();
            this.imageLoader = null!;
        }
        this.performanceMonitor = null!;
        (this.container as any).manager = null;
    }
}
