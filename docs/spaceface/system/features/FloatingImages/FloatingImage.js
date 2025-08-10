import { clamp } from '../../usr/bin/math.js';
const DAMPING = 0.85;
const MIN_VELOCITY = 0.1;
const MAX_SPEED = 2.5;
const VELOCITY_JITTER = 0.02;
export class FloatingImage {
    element;
    size;
    x;
    y;
    vx;
    vy;
    options;
    constructor(element, dims, options = {}) {
        this.element = element;
        this.options = { useSubpixel: true, ...options };
        this.size = { width: element.offsetWidth, height: element.offsetHeight };
        // Random initial position
        this.x = Math.random() * (dims.width - this.size.width);
        this.y = Math.random() * (dims.height - this.size.height);
        // Random velocity
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        // Hardware acceleration hints
        element.style.willChange = 'transform';
        element.style.backfaceVisibility = 'hidden';
        element.style.perspective = '1000px';
        element.style.opacity = '1';
        this.updatePosition();
    }
    updatePosition() {
        if (!this.element)
            return false;
        const x = this.options.useSubpixel ? this.x : Math.round(this.x);
        const y = this.options.useSubpixel ? this.y : Math.round(this.y);
        this.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        return true;
    }
    update(multiplier, dims, applyPosition = true) {
        if (!this.element)
            return false;
        this.x += this.vx * multiplier;
        this.y += this.vy * multiplier;
        // Bounce on edges
        if (this.x <= 0 || this.x + this.size.width >= dims.width) {
            this.vx = -this.vx * DAMPING;
            if (Math.abs(this.vx) < MIN_VELOCITY) {
                this.vx = this.vx > 0 ? MIN_VELOCITY : -MIN_VELOCITY;
            }
            this.x = clamp(this.x, 0, dims.width - this.size.width);
        }
        if (this.y <= 0 || this.y + this.size.height >= dims.height) {
            this.vy = -this.vy * DAMPING;
            if (Math.abs(this.vy) < MIN_VELOCITY) {
                this.vy = this.vy > 0 ? MIN_VELOCITY : -MIN_VELOCITY;
            }
            this.y = clamp(this.y, 0, dims.height - this.size.height);
        }
        // Random velocity variation
        this.vx += (Math.random() - 0.5) * VELOCITY_JITTER;
        this.vy += (Math.random() - 0.5) * VELOCITY_JITTER;
        // Cap max speed
        const speedSquared = this.vx * this.vx + this.vy * this.vy;
        if (speedSquared > MAX_SPEED * MAX_SPEED) {
            const scale = MAX_SPEED / Math.sqrt(speedSquared);
            this.vx *= scale;
            this.vy *= scale;
        }
        if (applyPosition) {
            return this.updatePosition();
        }
        return true;
    }
    resetPosition(dims) {
        this.x = Math.random() * (dims.width - this.size.width);
        this.y = Math.random() * (dims.height - this.size.height);
        this.updatePosition();
    }
    updateSize() {
        if (!this.element)
            return;
        this.size.width = this.element.offsetWidth;
        this.size.height = this.element.offsetHeight;
    }
    clampPosition(dims) {
        this.x = clamp(this.x, 0, dims.width - this.size.width);
        this.y = clamp(this.y, 0, dims.height - this.size.height);
    }
    destroy() {
        if (this.element) {
            this.element.style.willChange = 'auto';
            this.element.style.backfaceVisibility = '';
            this.element.style.perspective = '';
        }
        this.element = null;
    }
}
