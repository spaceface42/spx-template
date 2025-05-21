// gaussian-portfolio.js

export class GaussianPortfolio {
  constructor(wrapperSelector, options = {}) {
    this.wrapper = document.querySelector(wrapperSelector);
    if (!this.wrapper) throw new Error('Wrapper not found');

    this.settings = Object.assign({
      stdDevX: 100,
      stdDevY: 80,
      marginBuffer: 8, // in percentage
      avoidOverlap: true,
    }, options);

    this.items = [...this.wrapper.querySelectorAll('.portfolio-item')];
    this.hoverContainer = this.createHoverImageContainer();

    window.addEventListener('resize', () => this.layout());
    this.layout();
    this.enableHoverPreview();
  }

  createHoverImageContainer() {
    let container = document.createElement('div');
    container.id = 'hover-image-container';
    Object.assign(container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '0',
      overflow: 'hidden'
    });
    document.body.appendChild(container);
    return container;
  }

  gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  layout() {
    const rect = this.wrapper.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const marginX = (this.settings.marginBuffer / 100) * rect.width;
    const marginY = (this.settings.marginBuffer / 100) * rect.height;

    const placed = [];

    this.items.forEach((item) => {
      let attempts = 0;
      let x, y, fits = false;

      const itemRect = item.getBoundingClientRect();
      const w = itemRect.width;
      const h = itemRect.height;

      do {
        const dx = this.gaussianRandom() * this.settings.stdDevX;
        const dy = this.gaussianRandom() * this.settings.stdDevY;
        x = centerX + dx;
        y = centerY + dy;

        const left = Math.round(Math.max(marginX, Math.min(x - w / 2, rect.width - w - marginX)));
        const top = Math.round(Math.max(marginY, Math.min(y - h / 2, rect.height - h - marginY)));

        fits = !this.settings.avoidOverlap || !placed.some(p =>
          Math.abs(p.left - left) < w && Math.abs(p.top - top) < h
        );

        if (fits) {
          item.style.left = `${left}px`;
          item.style.top = `${top}px`;
          item.style.position = 'absolute';
          placed.push({ left, top });
        }
      } while (!fits && ++attempts < 100);
    });
  }

  enableHoverPreview() {
    this.items.forEach(item => {
      const img = item.querySelector('img');
      const link = item.querySelector('a');

      const labelText = Array.from(link.childNodes)
        .filter(n => n.nodeType === 3 && n.textContent.trim())
        .map(n => n.textContent.trim())[0];

      if (labelText) {
        const label = document.createElement('span');
        label.className = 'project-label';
        label.innerText = labelText;
        link.insertBefore(label, img);
      }

      item.addEventListener('mouseenter', () => {
        const rect = item.getBoundingClientRect();
        const clone = img.cloneNode();

        Object.assign(clone.style, {
          position: 'absolute',
          left: `${rect.left + rect.width / 2}px`,
          top: `${rect.top + rect.height / 2}px`,
          transform: 'translate(-50%, -50%)',
          maxWidth: '200px',
          maxHeight: '200px',
          opacity: '0',
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex: '0'
        });

        this.hoverContainer.innerHTML = '';
        this.hoverContainer.appendChild(clone);

        requestAnimationFrame(() => {
          clone.style.opacity = '1';
        });
      });

      item.addEventListener('mouseleave', () => {
        this.hoverContainer.innerHTML = '';
      });
    });
  }
}
