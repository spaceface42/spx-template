import { clamp } from '../../usr/bin/math.js';

export interface FloatingImageOptions {
    useSubpixel?: boolean;
}

export class FloatingImage {
    element: HTMLElement | null;
    container: HTMLElement | null;
    options: FloatingImageOptions;
    _elementRef: WeakRef<HTMLElement> | null;
    size: { width: number; height: number };
    x: number;
    y: number;
    vx: number;
    vy: number;

    constructor(element: HTMLElement, container: HTMLElement, options: FloatingImageOptions = {}) {
        this.element = element;
        this.container = container;
        this.options = {
            useSubpixel: true,
            ...options
        };
        this._elementRef = new WeakRef(element);
        this.size = {
            width: element.offsetWidth,
            height: element.offsetHeight
        };
        // Get container dimensions from manager
        const containerWidth = (container as any).manager.containerWidth;
        const containerHeight = (container as any).manager.containerHeight;
        // True random initial position within the container
        this.x = Math.random() * (containerWidth - this.size.width);
        this.y = Math.random() * (containerHeight - this.size.height);
        // Random velocity with variation in speed and direction
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        // Set up initial transform style for hardware acceleration
        element.style.willChange = 'transform';
        element.style.backfaceVisibility = 'hidden';
        element.style.perspective = '1000px';
        this.updatePosition();
        element.style.opacity = '1';
    }

    updatePosition(): boolean {
        const element = this._elementRef?.deref();
        if (!element) return false;
        const x = this.options.useSubpixel ? this.x : Math.round(this.x);
        const y = this.options.useSubpixel ? this.y : Math.round(this.y);
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        return true;
    }

    update(speedMultiplier = 1, applyPosition = true): boolean {
        const element = this._elementRef?.deref();
        if (!element) return false;
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;
        const containerWidth = (this.container as any).manager.containerWidth;
        const containerHeight = (this.container as any).manager.containerHeight;
        const damping = 0.85;
        const minVelocity = 0.1;
        if (this.x <= 0 || this.x + this.size.width >= containerWidth) {
            this.vx = -this.vx * damping;
            if (Math.abs(this.vx) < minVelocity) {
                this.vx = this.vx > 0 ? minVelocity : -minVelocity;
            }
            this.x = clamp(this.x, 0, containerWidth - this.size.width);
        }
        if (this.y <= 0 || this.y + this.size.height >= containerHeight) {
            this.vy = -this.vy * damping;
            if (Math.abs(this.vy) < minVelocity) {
                this.vy = this.vy > 0 ? minVelocity : -minVelocity;
            }
            this.y = clamp(this.y, 0, containerHeight - this.size.height);
        }
        this.vx += (Math.random() - 0.5) * 0.02;
        this.vy += (Math.random() - 0.5) * 0.02;
        const maxSpeed = 2.5;
        const speedSquared = this.vx * this.vx + this.vy * this.vy;
        if (speedSquared > maxSpeed * maxSpeed) {
            const currentSpeed = Math.sqrt(speedSquared);
            const scale = maxSpeed / currentSpeed;
            this.vx *= scale;
            this.vy *= scale;
        }
        if (applyPosition) {
            return this.updatePosition();
        }
        return true;
    }

    resetPosition() {
        const containerWidth = (this.container as any).manager.containerWidth;
        const containerHeight = (this.container as any).manager.containerHeight;
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