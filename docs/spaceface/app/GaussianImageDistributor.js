export class GaussianImageDistributor {
    constructor(container, imageLoader, options = {}) {
        if (!container || !(container instanceof Element)) {
            throw new Error('GaussianImageDistributor: container must be a valid DOM Element.');
        }
        if (!imageLoader) {
            throw new Error('GaussianImageDistributor: imageLoader is required.');
        }

        this.container = container;
        this.imageLoader = imageLoader;
        
        // Configuration options
        this.fadeInDuration = options.fadeInDuration || 800;
        this.displayDuration = options.displayDuration || 2000;
        this.fadeOutDuration = options.fadeOutDuration || 600;
        this.standardDeviation = options.standardDeviation || 0.2; // As fraction of container size
        this.selector = options.selector || 'img';
        this.loop = options.loop !== false; // Default to true
        
        // State
        this.isRunning = false;
        this.currentIndex = 0;
        this.images = [];
        this.animationId = null;
        
        // Bind methods
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.showNextImage = this.showNextImage.bind(this);
    }

    /**
     * Generate a random number from a normal (Gaussian) distribution
     * Using Box-Muller transform
     */
    generateGaussianRandom(mean = 0, stdDev = 1) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        
        const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return z0 * stdDev + mean;
    }

    /**
     * Get container dimensions and center point
     */
    getContainerInfo() {
        const rect = this.container.getBoundingClientRect();
        const computedStyle = getComputedStyle(this.container);
        
        return {
            width: rect.width,
            height: rect.height,
            centerX: rect.width / 2,
            centerY: rect.height / 2,
            paddingLeft: parseFloat(computedStyle.paddingLeft) || 0,
            paddingTop: parseFloat(computedStyle.paddingTop) || 0
        };
    }

    /**
     * Generate Gaussian-distributed position around container center
     */
    getGaussianPosition() {
        const containerInfo = this.getContainerInfo();
        
        // Calculate standard deviation in pixels
        const stdDevX = containerInfo.width * this.standardDeviation;
        const stdDevY = containerInfo.height * this.standardDeviation;
        
        // Generate Gaussian-distributed offsets from center
        const offsetX = this.generateGaussianRandom(0, stdDevX);
        const offsetY = this.generateGaussianRandom(0, stdDevY);
        
        // Calculate final position
        let x = containerInfo.centerX + offsetX;
        let y = containerInfo.centerY + offsetY;
        
        // Clamp to container bounds (with some padding)
        const margin = 20;
        x = Math.max(margin, Math.min(containerInfo.width - margin, x));
        y = Math.max(margin, Math.min(containerInfo.height - margin, y));
        
        return { x, y };
    }

    /**
     * Position an image element at the given coordinates
     */
    positionImage(imgElement, x, y) {
        imgElement.style.position = 'absolute';
        imgElement.style.left = `${x}px`;
        imgElement.style.top = `${y}px`;
        imgElement.style.transform = 'translate(-50%, -50%)'; // Center the image on the point
        imgElement.style.zIndex = '1000';
        imgElement.style.opacity = '0';
        imgElement.style.transition = `opacity ${this.fadeInDuration}ms ease-in-out`;
        imgElement.style.pointerEvents = 'none'; // Prevent interference with other elements
    }

    /**
     * Animate image appearance
     */
    async animateImageIn(imgElement) {
        return new Promise(resolve => {
            // Trigger fade in
            requestAnimationFrame(() => {
                imgElement.style.opacity = '1';
                setTimeout(resolve, this.fadeInDuration);
            });
        });
    }

    /**
     * Animate image disappearance
     */
    async animateImageOut(imgElement) {
        return new Promise(resolve => {
            imgElement.style.transition = `opacity ${this.fadeOutDuration}ms ease-in-out`;
            imgElement.style.opacity = '0';
            setTimeout(() => {
                imgElement.style.display = 'none';
                resolve();
            }, this.fadeOutDuration);
        });
    }

    /**
     * Show the next image in sequence
     */
    async showNextImage() {
        if (!this.isRunning || this.images.length === 0) return;

        const currentImage = this.images[this.currentIndex];
        const imgElement = currentImage.element;
        
        // Get Gaussian-distributed position
        const position = this.getGaussianPosition();
        
        // Position and prepare the image
        this.positionImage(imgElement, position.x, position.y);
        imgElement.style.display = 'block';
        
        // Animate in
        await this.animateImageIn(imgElement);
        
        if (!this.isRunning) return;
        
        // Wait for display duration
        await new Promise(resolve => {
            this.animationId = setTimeout(resolve, this.displayDuration);
        });
        
        if (!this.isRunning) return;
        
        // Animate out
        await this.animateImageOut(imgElement);
        
        // Move to next image
        this.currentIndex++;
        
        // Check if we should loop or stop
        if (this.currentIndex >= this.images.length) {
            if (this.loop) {
                this.currentIndex = 0;
                // Continue with next image
                if (this.isRunning) {
                    this.showNextImage();
                }
            } else {
                this.stop();
                return;
            }
        } else {
            // Continue with next image
            if (this.isRunning) {
                this.showNextImage();
            }
        }
    }

    /**
     * Start the image sequence
     */
    async start() {
        if (this.isRunning) return;
        
        try {
            // Load images
            await this.imageLoader.waitForImagesToLoad(this.selector);
            this.images = this.imageLoader.getImageData(this.selector);
            
            if (this.images.length === 0) {
                console.warn('GaussianImageDistributor: No images found');
                return;
            }
            
            // Ensure container has relative positioning
            if (getComputedStyle(this.container).position === 'static') {
                this.container.style.position = 'relative';
            }
            
            // Hide all images initially
            this.images.forEach(img => {
                img.element.style.display = 'none';
            });
            
            this.isRunning = true;
            this.currentIndex = 0;
            
            // Start the sequence
            this.showNextImage();
            
        } catch (error) {
            console.error('GaussianImageDistributor: Error starting sequence:', error);
        }
    }

    /**
     * Stop the image sequence
     */
    stop() {
        this.isRunning = false;
        
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
        
        // Hide all images
        this.images.forEach(img => {
            img.element.style.display = 'none';
            img.element.style.opacity = '0';
        });
    }

    /**
     * Update configuration options
     */
    updateOptions(options) {
        if (options.fadeInDuration !== undefined) this.fadeInDuration = options.fadeInDuration;
        if (options.displayDuration !== undefined) this.displayDuration = options.displayDuration;
        if (options.fadeOutDuration !== undefined) this.fadeOutDuration = options.fadeOutDuration;
        if (options.standardDeviation !== undefined) this.standardDeviation = options.standardDeviation;
        if (options.loop !== undefined) this.loop = options.loop;
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentIndex: this.currentIndex,
            totalImages: this.images.length,
            currentImage: this.images[this.currentIndex] || null
        };
    }

    /**
     * Clean up
     */
    destroy() {
        this.stop();
        this.container = null;
        this.imageLoader = null;
        this.images = [];
    }
}