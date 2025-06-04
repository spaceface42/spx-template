/**
 * Represents a floating image inside a container
 * Enhanced FloatingImage with better transform handling and memory management
 */
import { clamp } from '../../sbin/Utilities.js';
export class FloatingImage {
    constructor(element, container, options = {}) {
        this.element = element;
        this.container = container;
        this.options = {
            useSubpixel: true,
            ...options
        };

        // Cache element reference weakly
        this._elementRef = new WeakRef(element);

        // Always use offsetWidth/offsetHeight for rendered size
        this.size = {
            width: this.element.offsetWidth,
            height: this.element.offsetHeight
        };

        // Get container dimensions from manager
        const containerWidth = container.manager.containerWidth;
        const containerHeight = container.manager.containerHeight;

        // True random initial position within the container
        this.x = Math.random() * (containerWidth - this.size.width);
        this.y = Math.random() * (containerHeight - this.size.height);

        // Random velocity with variation in speed and direction
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;

        // Set up initial transform style for hardware acceleration
        this.element.style.willChange = 'transform';
        this.element.style.backfaceVisibility = 'hidden';
        this.element.style.perspective = '1000px';

        // Apply initial position
        this.updatePosition();

        // Make the image visible now that it's positioned
        this.element.style.opacity = '1';
    }

    /**
     * Updates the DOM position using hardware-accelerated transform
     */
    updatePosition() {
        const element = this._elementRef?.deref();
        if (!element) return false; // Element was garbage collected

        // Round positions for crisp rendering unless subpixel is enabled
        const x = this.options.useSubpixel ? this.x : Math.round(this.x);
        const y = this.options.useSubpixel ? this.y : Math.round(this.y);

        // Use translate3d for hardware acceleration
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        return true;
    }

    /**
     * Enhanced update method with better physics and bounds checking
     */
    update(speedMultiplier = 1, applyPosition = true) {
        // Check if element still exists
        const element = this._elementRef?.deref();
        if (!element) return false;

        // Update position based on velocity
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;

        // Get current container dimensions from the manager
        const containerWidth = this.container.manager.containerWidth;
        const containerHeight = this.container.manager.containerHeight;

        // Enhanced bouncing with more natural physics
        const damping = 0.85; // Energy loss on bounce
        const minVelocity = 0.1; // Prevent extremely slow movement

        if (this.x <= 0 || this.x + this.size.width >= containerWidth) {
            this.vx = -this.vx * damping;

            // Ensure minimum velocity to prevent sticking
            if (Math.abs(this.vx) < minVelocity) {
                this.vx = this.vx > 0 ? minVelocity : -minVelocity;
            }

            // Clamp position within bounds
            this.x = clamp(this.x, 0, containerWidth - this.size.width);
        }

        if (this.y <= 0 || this.y + this.size.height >= containerHeight) {
            this.vy = -this.vy * damping;

            // Ensure minimum velocity to prevent sticking
            if (Math.abs(this.vy) < minVelocity) {
                this.vy = this.vy > 0 ? minVelocity : -minVelocity;
            }

            // Clamp position within bounds
            this.y = clamp(this.y, 0, containerHeight - this.size.height);
        }

        // Add organic movement with reduced randomness for performance
        this.vx += (Math.random() - 0.5) * 0.02;
        this.vy += (Math.random() - 0.5) * 0.02;

        // Limit max speed with better calculation
        const maxSpeed = 2.5;
        const speedSquared = this.vx * this.vx + this.vy * this.vy;
        if (speedSquared > maxSpeed * maxSpeed) {
            const currentSpeed = Math.sqrt(speedSquared);
            const scale = maxSpeed / currentSpeed;
            this.vx *= scale;
            this.vy *= scale;
        }

        // Apply position update if requested
        if (applyPosition) {
            return this.updatePosition();
        }

        return true;
    }

    resetPosition() {
        const containerWidth = this.container.manager.containerWidth;
        const containerHeight = this.container.manager.containerHeight;
        this.x = Math.random() * (containerWidth - this.size.width);
        this.y = Math.random() * (containerHeight - this.size.height);
        this.updatePosition();
    }

    destroy() {
        const element = this._elementRef?.deref();
        if (element) {
            element.style.willChange = 'auto';
            element.style.backfaceVisibility = '';
            element.style.perspective = '';
        }
        this._elementRef = null;
        this.element = null;
        this.container = null;
    }
}
