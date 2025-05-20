import { clamp } from './utils.js';
import { FloatingImage } from './FloatingImage.js';


/**
 * Manages floating images inside a container, animating their movement and handling resizing, speed controls,
 * and pausing animation when the container is not in the viewport.
 */
export default class FloatingImageManager {
    /**
     * @param {Element|string} containerOrId - The container DOM element or its ID.
     * @throws {Error} If the container cannot be found.
     */
    constructor(containerOrId) {
        if (typeof containerOrId === 'string') {
            this.container = document.getElementById(containerOrId);
        } else {
            this.container = containerOrId;
        }
        this.images = [];
        this.speedMultiplier = 1;

        // Intersection Observer: Pause animation if container is not in viewport
        this.isInViewport = true;
        this.intersectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                this.isInViewport = entry.isIntersecting;
            });
        }, { threshold: 0 });
        this.intersectionObserver.observe(this.container);

        // Store container dimensions
        this.updateContainerDimensions();

        // Find all images with the floating-image class inside the container
        const imageElements = this.container.querySelectorAll('.floating-image');

        // Initialize all found images
        imageElements.forEach(imgElement => {
            // Wait for image to load to get proper dimensions
            if (imgElement.complete) {
                this.addExistingImage(imgElement);
            } else {
                imgElement.onload = () => this.addExistingImage(imgElement);
            }
        });

        // Start the animation loop
        this.animate();

        // Set up event listeners for controls
        document.getElementById('speedUp').addEventListener('click', () => this.changeSpeed(1.5));
        document.getElementById('slowDown').addEventListener('click', () => this.changeSpeed(0.6));

        // Create a ResizeObserver to monitor the container's size changes
        this.resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === this.container) {
                    // Small delay to ensure correct calculations
                    setTimeout(() => {
                        this.updateContainerDimensions();
                        this.handleResize();
                    }, 50);
                }
            }
        });

        // Start observing the container
        this.resizeObserver.observe(this.container);

        // Also handle window resize events that might affect the container
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.updateContainerDimensions();
                this.handleResize();
            }, 50);
        });
    }
    
    /**
     * Updates the stored container dimensions (width and height).
     * Should be called whenever the container size may have changed.
     */
    updateContainerDimensions() {
        this.containerWidth = this.container.clientWidth;
        this.containerHeight = this.container.clientHeight;
        // console.log(`Container dimensions updated: ${this.containerWidth}x${this.containerHeight}`);
    }
    
    /**
     * Adds an existing image element to the floating images manager.
     * @param {Element} imgElement - The image DOM element to add.
     */
    addExistingImage(imgElement) {
        // Store reference to the manager in the container for images to access
        this.container.manager = this;
        
        const newFloatingImage = new FloatingImage(imgElement, this.container);
        this.images.push(newFloatingImage);
    }
    
    /**
     * Changes the animation speed by multiplying the current speed by the given factor.
     * Speed is clamped between 0.2 and 5.
     * @param {number} factor - The factor to multiply the speed by.
     */
    changeSpeed(factor) {
        this.speedMultiplier *= factor;
        // Limit the speed to reasonable bounds
        if (this.speedMultiplier > 5) this.speedMultiplier = 5;
        if (this.speedMultiplier < 0.2) this.speedMultiplier = 0.2;
    }

    /**
     * Ensures all images are within the new container bounds after a resize.
     * Updates image sizes and clamps their positions.
     */
    handleResize() {
        // Ensure all images are within the new container bounds
        this.images.forEach(image => {
            // Update size in case image or container changed
            image.size.width = image.element.offsetWidth;
            image.size.height = image.element.offsetHeight;

            image.x = clamp(image.x, 0, this.containerWidth - image.size.width);
            image.y = clamp(image.y, 0, this.containerHeight - image.size.height);
            image.updatePosition();
        });

        // console.log(`Container resized to: ${this.containerWidth}x${this.containerHeight}`);
    }
    
    /**
     * The main animation loop.
     * - Skips animation if the container is not in the viewport.
     * - Skips position updates if speedMultiplier is 0.
     * - Batches position calculations and DOM writes for performance.
     * Called automatically after initialization.
     */
    animate() {
        // Pause animation if container is not in the viewport
        if (!this.isInViewport) {
            requestAnimationFrame(() => this.animate());
            return;
        }
        // If speedMultiplier is 0, skip updating positions but keep requesting frames for UI responsiveness
        if (this.speedMultiplier === 0) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        // First loop: update all positions (math only, no DOM writes)
        this.images.forEach(image => {
            image.update(this.speedMultiplier, false); // We'll skip updatePosition here
        });

        // Second loop: apply all DOM writes (style changes)
        this.images.forEach(image => {
            image.updatePosition();
        });

        // Request the next animation frame
        requestAnimationFrame(() => this.animate());
    }
}
