import { clamp } from '/app/resources/_42/utils.js';
import { FloatingImage } from './FloatingImage.js';
import resizeManager from './ResizeManager.js';

/**
 * Manages floating images using centralized resize management.
 */
export class FloatingImageManager {
    constructor(containerOrId) {
        // Get container element
        this.container = typeof containerOrId === 'string' 
            ? document.getElementById(containerOrId) 
            : containerOrId;
            
        if (!this.container) {
            throw new Error('Container not found');
        }
        
        // Initialize properties
        this.images = [];
        this.speedMultiplier = 1;
        this.isInViewport = true;
        this._destroyed = false;

        // Set up intersection observer for viewport detection
        this.intersectionObserver = new IntersectionObserver(entries => {
            this.isInViewport = entries[0].isIntersecting;
        }, { threshold: 0 });
        this.intersectionObserver.observe(this.container);

        // Subscribe to resize events using the new API
        this.unsubscribeWindow = resizeManager.onWindow(() => this.handleResize());
        this.unsubscribeElement = resizeManager.onElement(this.container, () => this.handleResize());

        // Initialize
        this.updateContainerDimensions();
        this.initializeImages();
        this.animate();
    }
    
    updateContainerDimensions() {
        const dims = resizeManager.getElement(this.container);
        this.containerWidth = dims.clientWidth;
        this.containerHeight = dims.clientHeight;
    }
    
    initializeImages() {
        const imageElements = this.container.querySelectorAll('.floating-image');
        
        imageElements.forEach(imgElement => {
            if (imgElement.complete) {
                this.addExistingImage(imgElement);
            } else {
                imgElement.onload = () => this.addExistingImage(imgElement);
            }
        });
    }
    
    addExistingImage(imgElement) {
        this.container.manager = this;
        const floatingImage = new FloatingImage(imgElement, this.container);
        this.images.push(floatingImage);
    }
    
    changeSpeed(factor) {
        this.speedMultiplier = clamp(this.speedMultiplier * factor, 0.2, 5);
    }

    handleResize() {
        if (this._destroyed) return;
        
        this.updateContainerDimensions();
        
        this.images.forEach(image => {
            // Update image size
            image.size.width = image.element.offsetWidth;
            image.size.height = image.element.offsetHeight;
            
            // Clamp position to new container bounds
            image.x = clamp(image.x, 0, this.containerWidth - image.size.width);
            image.y = clamp(image.y, 0, this.containerHeight - image.size.height);
            image.updatePosition();
        });
    }
    
    animate() {
        if (this._destroyed) return;

        if (!this.isInViewport || this.speedMultiplier === 0) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        // Update positions (calculations only)
        this.images.forEach(image => image.update(this.speedMultiplier, false));
        
        // Apply DOM updates
        this.images.forEach(image => image.updatePosition());

        requestAnimationFrame(() => this.animate());
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
        
        // Unsubscribe from resize events
        if (this.unsubscribeWindow) this.unsubscribeWindow();
        if (this.unsubscribeElement) this.unsubscribeElement();
        
        // Clean up intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        this.images = [];
    }
}