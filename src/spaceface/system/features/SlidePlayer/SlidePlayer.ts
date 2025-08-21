import { eventBus } from '../../bin/EventBus.js';
import { EventBinder } from '../../bin/EventBinder.js';
import { AsyncImageLoader } from '../../sbin/AsyncImageLoader.js';

/**
 * SlidePlayer
 * - autoplay with configurable interval
 * - dots (auto-generated if missing)
 * - touch swipe / mouse drag / keyboard nav
 * - pause on hover + on tab hidden + on user inactivity (screensaver)
 * - robust pause handling via reason set to avoid accidental resumes
 */

interface SlidePlayerOptions {
  interval?: number;
  includePicture?: boolean;
}

type SlideDot = HTMLDivElement;
type PauseReason = 'hover' | 'inactivity' | 'hidden' | 'manual';

export class SlidePlayer {
  static SWIPE_THRESHOLD = 50;

  public readonly container: HTMLElement;
  public readonly interval: number;
  public readonly includePicture: boolean;

  private currentIndex = 0;
  private lastTimestamp = 0;
  private rafId: number | null = null;
  private _destroyed = false;

  private touchStartX = 0;
  private touchEndX = 0;
  private mouseStartX = 0;
  private mouseEndX = 0;
  private isDragging = false;

  private slides: HTMLElement[] = [];
  private dots: SlideDot[] = [];
  private dotsWrapper: HTMLElement | null = null;

  private pauseReasons = new Set<PauseReason>();

  private loader: AsyncImageLoader;
  private eventBinder: EventBinder;
  public readonly ready: Promise<void>;

  constructor(
    containerSelector: string | HTMLElement,
    { interval = 5000, includePicture = false }: SlidePlayerOptions = {}
  ) {
    this.container =
      typeof containerSelector === 'string'
        ? (document.querySelector<HTMLElement>(containerSelector) as HTMLElement)
        : containerSelector;

    if (!this.container) throw new Error('Container element not found.');

    this.interval = interval;
    this.includePicture = includePicture;

    this.loader = new AsyncImageLoader(this.container, { includePicture });
    this.eventBinder = new EventBinder(true);

    this.ready = this.init();
  }

  // ---------- Init / teardown ----------

  private async init(): Promise<void> {
    await this.loader.waitForImagesToLoad();

    this.slides = Array.from(this.container.querySelectorAll<HTMLElement>('.slide'));
    if (this.slides.length === 0) {
      console.warn('[SlidePlayer] No .slide elements inside container.');
      return;
    }

    // Create or re-create dots
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

      // Keep EventListener type happy without losing strong typing
      this.eventBinder.bindDOM(
        dot,
        'click',
        (() => {
          this.goToSlide(i);
          this.bumpTimer();
        }) as EventListener
      );

      this.dotsWrapper!.appendChild(dot);
      this.dots.push(dot);
    });

    // Activate first slide
    this.setActiveSlide(0);

    // Bind DOM + bus events
    this.bindEvents();

    // Start RAF loop
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.animate);
  }

  public async destroy(): Promise<void> {
    if (this._destroyed) return;
    this._destroyed = true;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.eventBinder.unbindAll();
    this.loader.destroy();

    this.slides = [];
    this.dots = [];
    this.dotsWrapper = null;
    this.pauseReasons.clear();
  }

  // ---------- Event binding ----------

  private bindEvents(): void {
    // Touch (use Event and narrow with instanceof for TS)
    this.eventBinder.bindDOM(
      this.container,
      'touchstart',
      ((e: Event) => {
        if (e instanceof TouchEvent) {
          this.touchStartX = e.changedTouches[0].screenX;
        }
      }) as EventListener,
      { passive: true }
    );

    this.eventBinder.bindDOM(
      this.container,
      'touchend',
      ((e: Event) => {
        if (e instanceof TouchEvent) {
          this.touchEndX = e.changedTouches[0].screenX;
          this.handleSwipe(this.touchStartX, this.touchEndX);
        }
      }) as EventListener
    );

    // Mouse
    this.eventBinder.bindDOM(this.container, 'mousedown', this.onMouseDown as unknown as EventListener);
    this.eventBinder.bindDOM(this.container, 'mousemove', this.onMouseMove as unknown as EventListener);
    this.eventBinder.bindDOM(this.container, 'mouseup', this.onMouseUp as unknown as EventListener);
    this.eventBinder.bindDOM(this.container, 'mouseleave', this.onMouseLeave as unknown as EventListener);

    // Keyboard
    this.eventBinder.bindDOM(document, 'keydown', this.onKeyDown as unknown as EventListener);

    // Pause on hover (reason-based so it won't override inactivity)
    this.eventBinder.bindDOM(
      this.container,
      'mouseenter',
      (() => this.pause('hover')) as EventListener
    );
    this.eventBinder.bindDOM(
      this.container,
      'mouseleave',
      (() => this.resume('hover')) as EventListener
    );

    // Pause while tab hidden; resume when visible (won't override inactivity)
    this.eventBinder.bindDOM(
      document,
      'visibilitychange',
      (() => {
        if (document.visibilityState === 'hidden') {
          this.pause('hidden');
        } else {
          this.resume('hidden');
          this.bumpTimer();
        }
      }) as EventListener
    );

    // Screensaver / Inactivity integration (do NOT instantiate watcher here)
    this.eventBinder.bindBus('user:inactive', () => {
      this.pause('inactivity');
      eventBus.emit('slideplayer:paused-due-to-inactivity', { index: this.currentIndex });
    });

    this.eventBinder.bindBus('user:active', () => {
      this.resume('inactivity');
      this.bumpTimer();
      eventBus.emit('slideplayer:resumed-after-inactivity', { index: this.currentIndex });
    });

    // Cleanup on unload
    this.eventBinder.bindDOM(window, 'beforeunload', (() => this.destroy()) as EventListener);
  }

  // ---------- RAF loop ----------

  private animate = (timestamp: number): void => {
    if (this._destroyed) return;

    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const elapsed = timestamp - this.lastTimestamp;

    if (!this.isPaused() && elapsed >= this.interval) {
      this.nextSlide();
      this.lastTimestamp = timestamp;
    }

    this.rafId = requestAnimationFrame(this.animate);
  };

  // ---------- Public navigation ----------

  public goToSlide(index: number): void {
    if (index < 0 || index >= this.slides.length) return;
    this.setActiveSlide(index);
    this.bumpTimer();
    eventBus.emit('slideplayer:slide-changed', { index: this.currentIndex });
  }

  public nextSlide(): void {
    this.goToSlide((this.currentIndex + 1) % this.slides.length);
  }

  public prevSlide(): void {
    const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  // ---------- Private helpers ----------

  private setActiveSlide(index: number): void {
    this.slides[this.currentIndex]?.classList.remove('active');
    this.dots[this.currentIndex]?.classList.remove('active');

    this.currentIndex = index;

    this.slides[this.currentIndex]?.classList.add('active');
    this.dots[this.currentIndex]?.classList.add('active');
  }

  private handleSwipe(startX: number, endX: number): void {
    const delta = endX - startX;
    if (delta < -SlidePlayer.SWIPE_THRESHOLD) {
      this.nextSlide();
    } else if (delta > SlidePlayer.SWIPE_THRESHOLD) {
      this.prevSlide();
    }
    this.bumpTimer();
  }

  private bumpTimer(): void {
    this.lastTimestamp = performance.now();
  }

  // Pause system with reasons so different subsystems don’t fight each other
  private isPaused(): boolean {
    return this.pauseReasons.size > 0;
  }
  private pause(reason: PauseReason): void {
    this.pauseReasons.add(reason);
  }
  private resume(reason: PauseReason): void {
    this.pauseReasons.delete(reason);
  }

  // ---------- Handlers ----------

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
      this.bumpTimer();
    } else if (e.key === 'ArrowLeft') {
      this.prevSlide();
      this.bumpTimer();
    }
  };
}
