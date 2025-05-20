// stage-manager.js
export class StageManager {
  #elements = new Map();
  #observer;
  #resizeTimeout = null;

  constructor(debounceDelay = 100) {
    this.debounceDelay = debounceDelay;

    // Observe element size changes
    this.#observer = new ResizeObserver(entries => {
      clearTimeout(this.#resizeTimeout);
      this.#resizeTimeout = setTimeout(() => {
        for (const entry of entries) {
          const el = entry.target;
          const pos = this.#elements.get(el);
          if (pos) this._applyPosition(el, pos);
        }
      }, this.debounceDelay);
    });
  }

  register(selector, position = 'top left') {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;

    const parsed = this._normalizePosition(position);
    el.classList.add('stage-element');

    this.#elements.set(el, parsed);
    this.#observer.observe(el);
    this._applyPosition(el, parsed);
  }

  update(selector, position) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el || !this.#elements.has(el)) return;

    const parsed = this._normalizePosition(position);
    this.#elements.set(el, parsed);
    this._applyPosition(el, parsed);
  }

  _normalizePosition(input) {
    if (typeof input === 'string') {
      return this._parseStringPosition(input);
    } else {
      return this._parseConfigObject(input);
    }
  }

  _parseConfigObject(cfg = {}) {
    const vertical = cfg.vertical || 'top';
    const horizontal = cfg.horizontal || 'left';

    const parsed = {
      top: null,
      bottom: null,
      left: null,
      right: null,
      translateX: false,
      translateY: false,
      offsetX: cfg.offsetX || '0px',
      offsetY: cfg.offsetY || '0px'
    };

    if (vertical === 'middle') {
      parsed.top = '50%';
      parsed.translateY = true;
      parsed.offsetY = cfg.offsetY || '0px';
    } else {
      parsed[vertical] = cfg.offsetY || '0px';
    }

    if (horizontal === 'center') {
      parsed.left = '50%';
      parsed.translateX = true;
      parsed.offsetX = cfg.offsetX || '0px';
    } else {
      parsed[horizontal] = cfg.offsetX || '0px';
    }

    return parsed;
  }

  _parseStringPosition(input) {
    const tokens = input.toLowerCase().split(/\s+/);
    const parsed = {
      top: null,
      bottom: null,
      left: null,
      right: null,
      translateX: false,
      translateY: false,
      offsetX: '0px',
      offsetY: '0px'
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const value = tokens[i + 1];

      if (['top', 'bottom', 'left', 'right'].includes(token)) {
        if (value && /^[\d.+-]+(px|%)$/.test(value)) {
          parsed[token] = value;
          i++;
        } else {
          parsed[token] = '0px';
        }
      }

      if (['middle', 'center', 'centered', 'centre'].includes(token)) {
        const offset = value && /^[\d.+-]+(px|%)$/.test(value) ? value : '0px';
        if (!parsed.top && !parsed.bottom) {
          parsed.top = '50%';
          parsed.translateY = true;
          parsed.offsetY = offset;
          if (offset !== '0px') i++;
        } else {
          parsed.left = '50%';
          parsed.translateX = true;
          parsed.offsetX = offset;
          if (offset !== '0px') i++;
        }
      }
    }

    return parsed;
  }

  _applyPosition(el, pos) {
    el.style.position = 'fixed';
    ['top', 'bottom', 'left', 'right'].forEach(p => (el.style[p] = ''));
    el.style.transform = '';

    if (pos.top !== null) el.style.top = pos.top;
    if (pos.bottom !== null) el.style.bottom = pos.bottom;
    if (pos.left !== null) el.style.left = pos.left;
    if (pos.right !== null) el.style.right = pos.right;

    const tx = pos.translateX ? '-50%' : '0';
    const ty = pos.translateY ? '-50%' : '0';

    if (tx !== '0' || ty !== '0' || pos.offsetX !== '0px' || pos.offsetY !== '0px') {
      el.style.transform = `translate(${tx}, ${ty}) translate(${pos.offsetX}, ${pos.offsetY})`;
    }
  }

  destroy() {
    for (const el of this.#elements.keys()) {
      this.#observer.unobserve(el);
    }
    this.#elements.clear();
  }
}
