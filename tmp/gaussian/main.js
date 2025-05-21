import { Quadtree } from './quadtree.js';

export class GaussianPortfolio {
  constructor(wrapperSelector, options = {}) {
    this.wrapper = document.querySelector(wrapperSelector);
    this.items = Array.from(this.wrapper.querySelectorAll('.portfolio-item'));

    this.settings = {
      stdDevX: 25,
      stdDevY: 20,
      marginBuffer: 8,
      avoidOverlap: true,
      maxAttempts: 100,
      ...options,
    };

    this.resizeHandler = this.repositionItems.bind(this);
    this.init();
  }

  init() {
    this.wrapper.style.position = 'relative';

    this.items.forEach(item => {
      const link = item.querySelector('a');
      const img = link.querySelector('img');
      const text = link.childNodes[0].nodeValue.trim();

      const label = document.createElement('span');
      label.className = 'project-label';
      label.textContent = text;

      link.innerHTML = '';
      link.appendChild(label);
      link.appendChild(img);

      item.style.position = 'absolute';
      item.style.transition = 'transform 0.25s ease';
    });

    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(this.resizeHandler, 100);
    });

    this.repositionItems();
  }

  repositionItems() {
    const w = this.wrapper.offsetWidth;
    const h = this.wrapper.offsetHeight;
    const buffer = this.settings.marginBuffer / 100;
    const qt = new Quadtree({ x: 0, y: 0, w, h });

    this.items.forEach(item => {
      let attempts = 0;
      let placed = false;
      const iw = item.offsetWidth;
      const ih = item.offsetHeight;

      while (attempts < this.settings.maxAttempts && !placed) {
        const { x, y } = this.getGaussianPoint(w, h);
        const cx = Math.round(x - iw / 2);
        const cy = Math.round(y - ih / 2);

        const rect = { x: cx, y: cy, w: iw, h: ih };

        const withinMargins =
          rect.x > w * buffer &&
          rect.x + rect.w < w * (1 - buffer) &&
          rect.y > h * buffer &&
          rect.y + rect.h < h * (1 - buffer);

        const overlaps = qt.query(rect).length > 0;

        if (withinMargins && (!this.settings.avoidOverlap || !overlaps)) {
          qt.insert(rect);
          item.style.transform = `translate(${cx}px, ${cy}px)`;
          placed = true;
        }

        attempts++;
      }
    });
  }

  getGaussianPoint(w, h) {
    const gaussian = () => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    return {
      x: w / 2 + gaussian() * w * (this.settings.stdDevX / 100),
      y: h / 2 + gaussian() * h * (this.settings.stdDevY / 100),
    };
  }

  destroy() {
    window.removeEventListener('resize', this.resizeHandler);
  }
}




document.querySelectorAll('.portfolio-item').forEach(item => {
  // Only add this for touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      const img = item.querySelector('img');

      // Toggle image visibility manually
      const isVisible = img.style.opacity === '1';

      // Hide all other images
      document.querySelectorAll('.portfolio-item img').forEach(otherImg => {
        otherImg.style.opacity = '0';
        otherImg.style.visibility = 'hidden';
      });

      if (!isVisible) {
        img.style.opacity = '1';
        img.style.visibility = 'visible';
      }
    });
  }
});