export class InspectorXray {
  constructor() {
    this.tooltip = this.createTooltip();
    this.overlay = this.createOverlay();
    this.init();
  }

  createTooltip() {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'fixed',
      zIndex: '9999',
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      fontSize: '12px',
      fontFamily: 'monospace',
      padding: '4px 8px',
      borderRadius: '4px',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.2s ease',
      whiteSpace: 'nowrap',
    });
    document.body.appendChild(el);
    return el;
  }

  createOverlay() {
    const createBox = (color) => {
      const box = document.createElement('div');
      Object.assign(box.style, {
        position: 'fixed',
        border: `1px solid ${color}`,
        pointerEvents: 'none',
        zIndex: '9998',
      });
      document.body.appendChild(box);
      return box;
    };

    return {
      border: createBox('deepskyblue'),
      padding: createBox('rgba(0,255,0,0.4)'),
      margin: createBox('rgba(255,165,0,0.4)'),
    };
  }

  init() {
    this._mouseoverHandler = (e) => this.inspectElement(e.target);
    this._mousemoveHandler = (e) => this.moveTooltip(e);
    this._mouseoutHandler = () => this.clear();

    document.body.addEventListener('mouseover', this._mouseoverHandler);
    document.body.addEventListener('mousemove', this._mousemoveHandler);
    document.body.addEventListener('mouseout', this._mouseoutHandler);
  }

  inspectElement(el) {
    if (!el || el === document.body || el === document.documentElement) return;

    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);

    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const className = el.className ? '.' + el.className.trim().replace(/\s+/g, '.') : '';
    const size = `${Math.round(rect.width)}×${Math.round(rect.height)}`;

    this.tooltip.textContent = `${tag}${id}${className} [${size}]`;
    this.tooltip.style.opacity = '1';

    // Show element outline
    Object.assign(this.overlay.border.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      display: 'block',
    });

    // Calculate padding
    const padTop = parseFloat(style.paddingTop);
    const padRight = parseFloat(style.paddingRight);
    const padBottom = parseFloat(style.paddingBottom);
    const padLeft = parseFloat(style.paddingLeft);

    Object.assign(this.overlay.padding.style, {
      top: `${rect.top + padTop}px`,
      left: `${rect.left + padLeft}px`,
      width: `${rect.width - padLeft - padRight}px`,
      height: `${rect.height - padTop - padBottom}px`,
      backgroundColor: 'rgba(0,255,0,0.1)',
      display: 'block',
    });

    // Calculate margin box
    const marginTop = parseFloat(style.marginTop);
    const marginRight = parseFloat(style.marginRight);
    const marginBottom = parseFloat(style.marginBottom);
    const marginLeft = parseFloat(style.marginLeft);

    Object.assign(this.overlay.margin.style, {
      top: `${rect.top - marginTop}px`,
      left: `${rect.left - marginLeft}px`,
      width: `${rect.width + marginLeft + marginRight}px`,
      height: `${rect.height + marginTop + marginBottom}px`,
      backgroundColor: 'rgba(255,165,0,0.15)',
      display: 'block',
    });
  }

  moveTooltip(e) {
    const offset = 10;
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const maxX = window.innerWidth - tooltipRect.width - offset;
    const maxY = window.innerHeight - tooltipRect.height - offset;

    this.tooltip.style.left = `${Math.min(e.clientX + offset, maxX)}px`;
    this.tooltip.style.top = `${Math.min(e.clientY + offset, maxY)}px`;
  }

  clear() {
    this.tooltip.style.opacity = '0';
    ['border', 'padding', 'margin'].forEach((key) => {
      this.overlay[key].style.display = 'none';
    });
  }

  destroy() {
    document.body.removeEventListener('mouseover', this._mouseoverHandler);
    document.body.removeEventListener('mousemove', this._mousemoveHandler);
    document.body.removeEventListener('mouseout', this._mouseoutHandler);

    this.tooltip.remove();
    Object.values(this.overlay).forEach(el => el.remove());
  }
}
