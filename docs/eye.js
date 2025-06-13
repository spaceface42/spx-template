import { MouseTracker } from '/spaceface/system/bin/MouseTracker.js';

import { throttle } from '/spaceface/system/usr/bin/timing.js';

import { lerp, clamp } from '/spaceface/system/usr/bin/index.js';

export class BoxAnimator {
  constructor(element, constrain = 20, lerpFactor = 0.15) {
    if (!(element instanceof HTMLElement)) {
      throw new Error('Invalid element provided to BoxAnimator.');
    }

    this.element = element;
    this.constrain = constrain;
    this.lerpFactor = lerpFactor;

    this.targetX = 0;
    this.targetY = 0;
    this.currentX = 0;
    this.currentY = 0;

    this.tracker = MouseTracker.getInstance();
    this.tracker.subscribe(() => {}); // Ensure tracking starts

    this.init();
  }

  init() {
    const box = this.element.getBoundingClientRect();
    this.targetX = box.x + box.width / 2;
    this.targetY = box.y + box.height / 2;
    this.currentX = this.targetX;
    this.currentY = this.targetY;

    this.updateTransform();
  }

  transforms(x, y) {
    const box = this.element.getBoundingClientRect();
    const calcX = -(y - box.y - box.height / 2) / this.constrain;
    const calcY = (x - box.x - box.width / 2) / this.constrain;
    const scale = 1 + Math.abs(calcX + calcY) * 0.01; // Add scale effect
    return `perspective(100px) rotateX(${calcX}deg) rotateY(${calcY}deg) scale(${scale})`;
  }

  updateTransform() {
    const { x, y } = this.tracker.position;

    const clampedX = clamp(x, 0, window.innerWidth);
    const clampedY = clamp(y, 0, window.innerHeight);

    this.targetX = clampedX;
    this.targetY = clampedY;

    this.currentX = lerp(this.currentX, this.targetX, this.lerpFactor);
    this.currentY = lerp(this.currentY, this.targetY, this.lerpFactor);

    this.element.style.transform = this.transforms(this.currentX, this.currentY);



    requestAnimationFrame(() => this.updateTransform());
  }
}
