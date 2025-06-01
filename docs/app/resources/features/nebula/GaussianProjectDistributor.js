import resizeManager from '../FloatingImages/ResizeManager.js';
import { debounce } from '../../_42/utils.js';

export class GaussianProjectDistributor {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) throw new Error(`Container ${containerSelector} not found`);

        this.links = [...this.container.querySelectorAll('a[href]')];
        this.positions = [];
        this.animationEnabled = true;
        this.boundDistribute = this.distribute.bind(this); // Bind distribute method
        this.debouncedDistribute = debounce(this.distribute, 100).bind(this); // Debounce distribute

        this.init();
    }

    init() {
        this.setupStyles();
        this.distribute();
        this.bindEvents();

        // Subscribe to resize events using ResizeManager
        this.unsubscribeResize = resizeManager.onElement(this.container, this.debouncedDistribute);
    }

    setupStyles() {
        const containerStyle = getComputedStyle(this.container);
        if (containerStyle.position === 'static') {
            this.container.style.position = 'relative';
        }
        // Remove overflow hidden to allow items to extend beyond container
        this.container.style.overflow = 'visible';

        this.links.forEach(link => {
            link.style.position = 'absolute';
            link.style.transform = 'translate(-50%, -50%)';
            link.style.transition = this.animationEnabled ? 'all 0.3s ease' : 'none';
            link.style.zIndex = '1';

            const imageSrc = link.dataset.image;
            if (imageSrc) {
                const img = document.createElement('img');
                img.src = imageSrc;
                img.style.cssText = `
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                    max-width: 80px;
                    max-height: 80px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10;
                `;
                link.appendChild(img);
            }
        });
    }

    gaussianRandom(mean = 0, stdDev = 1) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();

        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        return z * stdDev + mean;
    }

    circlesOverlap(x1, y1, x2, y2, minDistance = 60) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
    }

    generatePosition(centerX, centerY, stdDevX, stdDevY, existingPositions, maxAttempts = 50) {
        // Keep items within container boundaries with padding for the item size
        const padding = 60; // Account for item width/height
        const minX = padding;
        const maxX = this.container.offsetWidth - padding;
        const minY = padding;
        const maxY = this.container.offsetHeight - padding;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.max(minX, Math.min(centerX + this.gaussianRandom(0, stdDevX), maxX));
            const y = Math.max(minY, Math.min(centerY + this.gaussianRandom(0, stdDevY), maxY));

            const hasOverlap = existingPositions.some(pos =>
                this.circlesOverlap(x, y, pos.x, pos.y)
            );

            if (!hasOverlap) {
                return { x, y };
            }
        }

        return this.findEmptyGridPosition(existingPositions);
    }

    findEmptyGridPosition(existingPositions) {
        const gridSize = 80;
        const padding = 60;
        const startX = padding;
        const startY = padding;
        const endX = this.container.offsetWidth - padding;
        const endY = this.container.offsetHeight - padding;
        const cols = Math.floor((endX - startX) / gridSize);
        const rows = Math.floor((endY - startY) / gridSize);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + (col + 0.5) * gridSize;
                const y = startY + (row + 0.5) * gridSize;

                const hasOverlap = existingPositions.some(pos =>
                    this.circlesOverlap(x, y, pos.x, pos.y)
                );

                if (!hasOverlap) {
                    return { x, y };
                }
            }
        }

        // Last resort: random position within container boundaries
        return {
            x: Math.random() * (this.container.offsetWidth - 2 * padding) + padding,
            y: Math.random() * (this.container.offsetHeight - 2 * padding) + padding
        };
    }

    distribute() {
        const { offsetWidth: width, offsetHeight: height } = this.container;

        if (width === 0 || height === 0) return;

        const centerX = width / 2;
        const centerY = height / 2;
        // Keep reasonable distribution within container
        const stdDevX = width * 0.25;
        const stdDevY = height * 0.25;

        this.positions = [];

        this.links.forEach((link, index) => {
            const position = this.generatePosition(
                centerX,
                centerY,
                stdDevX,
                stdDevY,
                this.positions
            );

            this.positions.push(position);

            setTimeout(() => {
                link.style.left = `${position.x}px`;
                link.style.top = `${position.y}px`;
                link.style.opacity = '1';
            }, this.animationEnabled ? index * 50 : 0);
        });
    }

    bindEvents() {
        this.links.forEach(link => {
            const img = link.querySelector('img');
            if (img) {
                link.addEventListener('mouseenter', () => {
                    img.style.opacity = '1';
                });

                link.addEventListener('mouseleave', () => {
                    img.style.opacity = '0';
                });
            }
        });
    }

    redistribute() {
        this.distribute();
    }

    toggleAnimation() {
        this.animationEnabled = !this.animationEnabled;
        this.links.forEach(link => {
            link.style.transition = this.animationEnabled ? 'all 0.3s ease' : 'none';
        });
    }

    destroy() {
        // Unsubscribe from resize events
        if (this.unsubscribeResize) this.unsubscribeResize();
    }
}