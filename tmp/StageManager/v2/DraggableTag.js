export class DraggableTag {
  constructor() {
    this.elements = [];
    this.current = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.nextX = 0;
    this.nextY = 0;
    this.raf = null;
    this.zCounter = 1000; // Start from a high z-index base

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.updatePosition = this.updatePosition.bind(this);

    this.init();
  }

  init() {
    this.elements = [...document.querySelectorAll('[draggable-tag]')];
    this.elements.forEach(el => {
      el.style.position = 'absolute';
      el.style.cursor = 'grab';
      el.style.userSelect = 'none';
      if (!el.style.zIndex) {
        el.style.zIndex = 1;
      }
      el.addEventListener('mousedown', this.onMouseDown);
    });

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseDown(e) {
    if (!this.elements.includes(e.target)) return;

    this.current = e.target;
    this.offsetX = e.clientX - this.current.offsetLeft;
    this.offsetY = e.clientY - this.current.offsetTop;
    this.current.style.cursor = 'grabbing';

    // Bring to front
    this.zCounter++;
    this.current.style.zIndex = this.zCounter;

    this.raf = requestAnimationFrame(this.updatePosition);
  }

  onMouseMove(e) {
    if (!this.current) return;
    this.nextX = e.clientX - this.offsetX;
    this.nextY = e.clientY - this.offsetY;
  }

  onMouseUp() {
    if (this.current) {
      this.current.style.cursor = 'grab';
    }
    this.current = null;
    cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  updatePosition() {
    if (this.current) {
      this.current.style.left = `${this.nextX}px`;
      this.current.style.top = `${this.nextY}px`;
      this.raf = requestAnimationFrame(this.updatePosition);
    }
  }
}
