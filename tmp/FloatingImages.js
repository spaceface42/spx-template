// FloatingImages.js
export class FloatingImages {
  constructor(selector, options = {}) {
    this.elements = [...document.querySelectorAll(selector)];
    this.speed = options.speed || 0.3;
    this.boundsPadding = options.boundsPadding || 0;
    this.framerate = 1000 / 60;

    this.state = this.elements.map(el => ({
      el,
      x: el.offsetLeft,
      y: el.offsetTop,
      dx: (Math.random() - 0.5) * this.speed * 2,
      dy: (Math.random() - 0.5) * this.speed * 2,
    }));

    this._boundTick = this._tick.bind(this);
    this.running = true;
    this._start();
    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
  }

  _start() {
    this._onResize();
    this.timer = setInterval(this._boundTick, this.framerate);
  }

  _tick() {
    this.state.forEach(obj => {
      const { el } = obj;
      const rect = el.getBoundingClientRect();
      const elWidth = rect.width;
      const elHeight = rect.height;

      obj.x += obj.dx;
      obj.y += obj.dy;

      // Bounce horizontally
      if (obj.x <= this.boundsPadding || obj.x + elWidth >= this.viewportWidth - this.boundsPadding) {
        obj.dx *= -1;
        obj.x = Math.max(this.boundsPadding, Math.min(obj.x, this.viewportWidth - elWidth - this.boundsPadding));
      }

      // Bounce vertically
      if (obj.y <= this.boundsPadding || obj.y + elHeight >= this.viewportHeight - this.boundsPadding) {
        obj.dy *= -1;
        obj.y = Math.max(this.boundsPadding, Math.min(obj.y, this.viewportHeight - elHeight - this.boundsPadding));
      }

      el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
    });
  }

  stop() {
    clearInterval(this.timer);
    this.running = false;
  }

  resume() {
    if (!this.running) {
      this.running = true;
      this._start();
    }
  }
}
