import { eventBus } from '../../bin/EventBus.js';
import { EventBinder } from '../../bin/EventBinder.js';
import { AsyncImageLoader } from '../../sbin/AsyncImageLoader.js';

interface SlidePlayerOptions {
  interval?: number;
  includePicture?: boolean;
}

type SlideDot = HTMLDivElement;

export class SlidePlayer {
  static SWIPE_THRESHOLD = 50;

  public readonly container: HTMLElement;
  public readonly interval: number;
  public readonly includePicture: boolean;

  private currentIndex: number;
  private lastTimestamp: number;
  private isPaused: boolean;
  private rafId: number | null;

  private touchStartX: number;
  private touchEndX: number;
  private mouseStartX: number;
  private mouseEndX: number;
  private isDragging: boolean;

  private slides: HTMLElement[];
  private dots: SlideDot[];
  private dotsWrapper: HTMLElement | null;

  private handleUserInactive: (() => void) | null;
  private handleUserActive: (() => void) | null;

  private loader: AsyncImageLoader;
  private eventBinder: EventBinder;
  private _destroyed: boolean;
  public readonly ready: Promise<void>;

  constructor(
    containerSelector: string | HTMLElement,
    { interval = 5000, includePicture = false }: SlidePlayerOptions = {}
  ) {
    this.container = typeof containerSelector === 'string'
      ? document.querySelector<HTMLElement>(containerSelector)!
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

    this.slides = [];
    this.dots = [];
    this.dotsWrapper = null;

    this.handleUserInactive = null;
    this.handleUserActive = null;

    this.loader = new AsyncImageLoader(this.container, { includePicture });
    this.eventBinder = new EventBinder(true);

    this._destroyed = false;
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    await this.loader.waitForImagesToLoad();

    this.slides = Array.from(this.container.querySelectorAll<HTMLElement>('.slide'));

    // Create or update dots dynamically
    this.dotsWrapper = this.container.querySelector<HTMLElement>('.dots');
    if (!this.dotsWrapper) {
      this.dotsWrapper = document.createElement('div');
      this.dotsWrapper.className = 'dots';
      this.container.appendChild(this.dotsWrapper);
    } else {
      this.dotsWrapper.innerHTML = '';
    }

    this.dots = [];
    this.slides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.dataset.index = i.toString();

      const handler = () => {
        this.goToSlide(i);
        this.lastTimestamp = performance.now();
      };

      this.eventBinder.bindDOM(dot, 'click', handler);
      this.dotsWrapper!.appendChild(dot);
      this.dots.push(dot);
    });

    if (this.dots[0]) this.dots[0].classList.add('active');
    if (this.slides[0]) this.slides[0].classList.add('active');

    // Swipe & drag
    this.eventBinder.bindDOM(this.container, 'touchstart', (e: Event) => {
      if (e instanceof TouchEvent) {
        this.touchStartX = e.changedTouches[0].screenX;
      }
    }, { passive: true });

    this.eventBinder.bindDOM(this.container, 'touchend', (e: Event) => {
      if (e instanceof TouchEvent) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe(this.touchStartX, this.touchEndX);
      }
    });

    this.eventBinder.bindDOM(this.container, 'mousedown', this.onMouseDown as EventListener);
    this.eventBinder.bindDOM(this.container, 'mousemove', this.onMouseMove as EventListener);
    this.eventBinder.bindDOM(this.container, 'mouseup', this.onMouseUp as EventListener);
    this.eventBinder.bindDOM(this.container, 'mouseleave', this.onMouseLeave as EventListener);

    // Keyboard
    this.eventBinder.bindDOM(document, 'keydown', this.onKeyDown as EventListener);

    // Pause on hover
    this.eventBinder.bindDOM(this.container, 'mouseenter', () => {
      this.isPaused = true;
    });

    this.eventBinder.bindDOM(this.container, 'mouseleave', () => {
      this.isPaused = false;
      this.lastTimestamp = performance.now();
    });

    // Pause when tab is hidden
    this.eventBinder.bindDOM(document, 'visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.lastTimestamp = performance.now();
      }
    });

    // EventBus bindings
    this.handleUserInactive = () => {
      this.isPaused = true;
      eventBus.emit('slideplayer:paused-due-to-inactivity', { index: this.currentIndex });
    };

    this.handleUserActive = () => {
      this.isPaused = false;
      this.lastTimestamp = performance.now();
      eventBus.emit('slideplayer:resumed-after-inactivity', { index: this.currentIndex });
    };

    this.eventBinder.bindBus('user:inactive', this.handleUserInactive);
    this.eventBinder.bindBus('user:active', this.handleUserActive);

    // Cleanup on unload
    this.eventBinder.bindDOM(window, 'beforeunload', () => {
      this.destroy();
    });

    this.rafId = requestAnimationFrame(this.animate.bind(this));
  }

  private animate(timestamp: number): void {
    if (this._destroyed) return;
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const elapsed = timestamp - this.lastTimestamp;

    if (!this.isPaused && elapsed >= this.interval) {
      this.nextSlide();
      this.lastTimestamp = timestamp;
    }

    this.rafId = requestAnimationFrame(this.animate.bind(this));
  }

  public goToSlide(index: number): void {
    if (index < 0 || index >= this.slides.length) return;

    this.slides[this.currentIndex]?.classList.remove('active');
    this.dots[this.currentIndex]?.classList.remove('active');

    this.currentIndex = index;

    this.slides[this.currentIndex]?.classList.add('active');
    this.dots[this.currentIndex]?.classList.add('active');

    eventBus.emit('slideplayer:slide-changed', { index: this.currentIndex });
  }

  public nextSlide(): void {
    this.goToSlide((this.currentIndex + 1) % this.slides.length);
  }

  private handleSwipe(startX: number, endX: number): void {
    const delta = endX - startX;
    if (delta < -SlidePlayer.SWIPE_THRESHOLD) {
      this.nextSlide();
    } else if (delta > SlidePlayer.SWIPE_THRESHOLD) {
      const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
      this.goToSlide(prevIndex);
    }
    this.lastTimestamp = performance.now();
  }

  private onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true;
    this.mouseStartX = e.clientX;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.isDragging) {
      this.mouseEndX = e.clientX;
    }
  };

  private onMouseUp = (): void => {
    if (this.isDragging) {
      this.isDragging = false;
      this.handleSwipe(this.mouseStartX, this.mouseEndX);
    }
  };

  private onMouseLeave = (): void => {
    this.isDragging = false;
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowRight') {
      this.nextSlide();
      this.lastTimestamp = performance.now();
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
      this.goToSlide(prevIndex);
      this.lastTimestamp = performance.now();
    }
  };

  public async destroy(): Promise<void> {
    if (this._destroyed) return;
    this._destroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.eventBinder.unbindAll();
    if (this.loader) {
      this.loader.destroy();
    }
    this.slides = [];
    this.dots = [];
    this.dotsWrapper = null;
    this.handleUserInactive = null;
    this.handleUserActive = null;
  }
}