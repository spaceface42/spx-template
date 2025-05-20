/**
 * Represents a floating image inside a container.
 */
export class FloatingImage {
    /**
     * @param {Element} element - The image DOM element.
     * @param {Element} container - The container DOM element.
     */
    constructor(element, container) {
        this.element = element;
        this.container = container;

        // Always use offsetWidth/offsetHeight for rendered size
        this.size = {
            width: this.element.offsetWidth,
            height: this.element.offsetHeight
        };

        // Get container dimensions from manager
        const containerWidth = container.manager.containerWidth;
        const containerHeight = container.manager.containerHeight;

        // True random initial position within the container
        this.x = Math.round(Math.random() * (containerWidth - this.size.width));
        this.y = Math.round(Math.random() * (containerHeight - this.size.height));

        // Random velocity with variation in speed and direction
        this.vx = (Math.random() - 0.5) * 3;  // Between -1.5 and 1.5
        this.vy = (Math.random() - 0.5) * 3;  // Between -1.5 and 1.5

        // Apply initial position
        this.updatePosition();

        // Make the image visible now that it's positioned
        this.element.style.opacity = '1';
    }

    /**
     * Updates the DOM position of the image using CSS transform.
     */
    updatePosition() {
        this.element.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
    }

    /**
     * Updates the image's position and velocity, and optionally applies the new position.
     * @param {number} [speedMultiplier=1] - Multiplier for velocity.
     * @param {boolean} [applyPosition=true] - Whether to update the DOM position.
     */
    update(speedMultiplier = 1, applyPosition = true) {
        // Update position based on velocity
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;

        // Get current container dimensions from the manager
        const containerWidth = this.container.manager.containerWidth;
        const containerHeight = this.container.manager.containerHeight;

        // Bounce off the edges with a gentle effect
        if (this.x <= 0 || this.x + this.size.width >= containerWidth) {
            this.vx = -this.vx * 0.8; // Reduce velocity slightly for more natural bounce
            
            // Ensure the image stays within bounds
            if (this.x <= 0) {
                this.x = 0;
            } else {
                this.x = containerWidth - this.size.width;
            }
        }
        
        if (this.y <= 0 || this.y + this.size.height >= containerHeight) {
            this.vy = -this.vy * 0.8; // Reduce velocity slightly for more natural bounce
            
            // Ensure the image stays within bounds
            if (this.y <= 0) {
                this.y = 0;
            } else {
                this.y = containerHeight - this.size.height;
            }
        }
        
        // Add a small random fluctuation to make movement more organic
        this.vx += (Math.random() - 0.5) * 0.05;
        this.vy += (Math.random() - 0.5) * 0.05;
        
        // Limit max speed to prevent images from moving too fast
        const maxSpeed = 2;
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > maxSpeed) {
            this.vx = (this.vx / currentSpeed) * maxSpeed;
            this.vy = (this.vy / currentSpeed) * maxSpeed;
        }
        
        // Only apply the new position if requested
        if (applyPosition) {
            this.updatePosition();
        }
    }
}