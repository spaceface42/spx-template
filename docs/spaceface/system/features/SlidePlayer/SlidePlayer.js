import { eventBus } from '../../bin/EventBus.js';
import { AsyncImageLoader } from '../../bin/AsyncImageLoader.js';

export class SlidePlayer {
  /**
   * @param {string | HTMLElement} containerSelector
   * @param {Object} options
   * @param {number} options.interval - Autoplay interval in ms
   * @param {boolean} options.includePicture - Whether to support <picture> tags
   */
  constructor(containerSelector, { interval = 5000, includePicture = false } = {}) {
    this.container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

    if (!this.container) throw new Error('Container element not found.');

    this.interval = interval;
    this.includePicture = includePicture;

    this.currentIndex = 0;
    this.lastTimestamp = 0;
    this.isPaused = false;
    this.rafId = null;

    this.touchStartX = 0;
    this.touchEndX = 0;
    this.mouseStartX = 0;
    this.mouseEndX = 0;
    this.isDragging = false;

    this.loader = new AsyncImageLoader(this.container, { includePicture });

    this.ready = this.init();
  }

  async init() {
    await this.loader.waitForImagesToLoad();

    this.slides = this.container.querySelectorAll('.slide');

    // Create or update dots dynamically
    let dotsWrapper = this.container.querySelector('.dots');

    // If it exists, clear it — else create and append it
    if (!dotsWrapper) {
      dotsWrapper = document.createElement('div');
      dotsWrapper.className = 'dots';
      this.container.appendChild(dotsWrapper);
    } else {
      dotsWrapper.innerHTML = ''; // Clear manually created dots
    }

    this.dots = [];
    this.dotClickHandlers = [];

    this.slides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.dataset.index = i;

      const handler = () => {
        this.goToSlide(i);
        this.lastTimestamp = performance.now();
      };

      dot.addEventListener('click', handler);
      this.dotClickHandlers.push({ dot, handler });

      dotsWrapper.appendChild(dot);
      this.dots.push(dot);
    });

    // Mark first dot active
    this.dots[0]?.classList.add('active');

    // Swipe & mouse drag
    this.container.addEventListener('touchstart', e => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.container.addEventListener('touchend', e => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(this.touchStartX, this.touchEndX);
    });

    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('mouseleave', this.onMouseLeave);

    document.addEventListener('keydown', this.onKeyDown);

    this.container.addEventListener('mouseenter', () => {
      this.isPaused = true;
    });
    this.container.addEventListener('mouseleave', () => {
      this.isPaused = false;
      this.lastTimestamp = performance.now();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.lastTimestamp = performance.now();
      }
    });

    // pause on inactivity
    this.handleUserInactive = () => {
      this.isPaused = true;
      eventBus.emit('slideplayer: Paused due to inactivity', { index: this.currentIndex });
    };

    this.handleUserActive = () => {
      this.isPaused = false;
      this.lastTimestamp = performance.now();
      eventBus.emit('slideplayer: Resumed after inactivity', { index: this.currentIndex });
    };

    eventBus.on('user:inactive', this.handleUserInactive);
    eventBus.on('user:active', this.handleUserActive);
    // pause on inactivity
  
    this.rafId = requestAnimationFrame(this.animate.bind(this));
  }

  animate(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const elapsed = timestamp - this.lastTimestamp;

    if (!this.isPaused && elapsed >= this.interval) {
      this.nextSlide();
      this.lastTimestamp = timestamp;
    }

    this.rafId = requestAnimationFrame(this.animate.bind(this));
  }

goToSlide(index) {
  if (index < 0 || index >= this.slides.length) return;

  this.slides[this.currentIndex].classList.remove('active');
  this.dots[this.currentIndex]?.classList.remove('active');

  this.currentIndex = index;

  this.slides[this.currentIndex].classList.add('active');
  this.dots[this.currentIndex]?.classList.add('active');

  eventBus.emit('slideplayer:slideChanged', { index: this.currentIndex });
}

  nextSlide() {
    this.goToSlide((this.currentIndex + 1) % this.slides.length);
  }

  handleSwipe(startX, endX) {
    const delta = endX - startX;
    const threshold = 50;

    if (delta < -threshold) {
      this.nextSlide();
    } else if (delta > threshold) {
      const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
      this.goToSlide(prevIndex);
    }
    this.lastTimestamp = performance.now();
  }

  onMouseDown = (e) => {
    this.isDragging = true;
    this.mouseStartX = e.clientX;
  };

  onMouseMove = (e) => {
    if (this.isDragging) {
      this.mouseEndX = e.clientX;
    }
  };

  onMouseUp = () => {
    if (this.isDragging) {
      this.isDragging = false;
      this.handleSwipe(this.mouseStartX, this.mouseEndX);
    }
  };

  onMouseLeave = () => {
    this.isDragging = false;
  };

  onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      this.nextSlide();
      this.lastTimestamp = performance.now();
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
      this.goToSlide(prevIndex);
      this.lastTimestamp = performance.now();
    }
  };

  async destroy() {
    cancelAnimationFrame(this.rafId);

    this.dotClickHandlers.forEach(({ dot, handler }) => {
      dot.removeEventListener('click', handler);
    });
    this.dotClickHandlers = [];

    this.container.removeEventListener('touchstart', this.touchStartHandler);
    this.container.removeEventListener('touchend', this.touchEndHandler);
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mouseleave', this.onMouseLeave);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('visibilitychange', this.visibilityHandler);

    eventBus.off('user:inactive', this.handleUserInactive);
    eventBus.off('user:active', this.handleUserActive);

    this.loader.destroy();
  }
}
