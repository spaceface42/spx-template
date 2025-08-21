import { eventBus } from '../../bin/EventBus.js';
import { EventBinder } from '../../bin/EventBinder.js';
import { AsyncImageLoader } from '../../sbin/AsyncImageLoader.js';

/**
 * SlidePlayer (Modern Architecture)
 * ---------------------------------
 * - Autoplay with configurable interval
 * - Pointer events (mouse + touch unified)
 * - Keyboard nav (ArrowLeft / ArrowRight)
 * - Dots (auto-generated if missing)
 * - Pause on hover, tab hidden, user inactivity (screensaver)
 * - Robust pause control using reason set (no accidental resumes)
 * - Emits DOM CustomEvents (per-instance) AND EventBus events (global)
 *
 * DOM CustomEvents fired on container:
 * - 'slideplayer:slideChanged' -> { detail: { index: number } }
 * - 'slideplayer:paused'       -> { detail: { reasons: string[] } }
 * - 'slideplayer:resumed'      -> { detail: { reasons: string[] } }
 *
 * EventBus (global, optional consumers):
 * - 'slideplayer:slide-changed'             -> { index }
 * - 'slideplayer:paused-due-to-inactivity'  -> { index }
 * - 'slideplayer:resumed-after-inactivity'  -> { index }
 * - Also listens to:
 *      - 'user:inactive' (pause with reason 'inactivity')
 *      - 'user:active'   (resume reason 'inactivity')
 */

interface SlidePlayerOptions {
  interval?: number;
  includePicture?: boolean;
  /**
   * If provided, dots are rendered into this element (found within container).
   * If not present in DOM, a '.dots' wrapper is created automatically.
   */
  dotsSelector?: string;
  /**
   * Disable automatic dot creation (you can manage your own).
   */
  autoCreateDots?: boolean;
  /**
   * If true, the slider will not auto-play until play() is called.
   * Default false (autoplay on).
   */
  startPaused?: boolean;
}

type SlideDot = HTMLDivElement;
type PauseReason = 'hover' | 'hidden' | 'inactivity' | 'manual';

export class SlidePlayer {
  /** Swipe / drag minimum in px */
  static SWIPE_THRESHOLD = 50;

  public readonly container: HTMLElement;
  public readonly interval: number;
  public readonly includePicture: boolean;

  private readonly dotsSelector?: string;
  private readonly autoCreateDots: boolean;
  private readonly startPaused: boolean;

  // Core state
  #currentIndex = 0;
  #lastTimestamp = 0;
  #rafId: number | null = null;
  #destroyed = false;

  // Input state (pointer-unified)
  #isPointerDown = false;
  #pointerStartX = 0;
  #pointerEndX = 0;

  // Elements
  #slides: HTMLElement[] = [];
  #dots: SlideDot[] = [];
  #dotsWrapper: HTMLElement | null = null;

  // Pause system
  #pauseReasons = new Set<PauseReason>();

  // Infra
  #loader: AsyncImageLoader;
  #binder: EventBinder;

  // Ready promise
  public readonly ready: Promise<void>;

  constructor(
    containerOrSelector: string | HTMLElement,
    {
      interval = 5000,
      includePicture = false,
      dotsSelector,
      autoCreateDots = true,
      startPaused = false
    }: SlidePlayerOptions = {}
  ) {
    const container =
      typeof containerOrSelector === 'string'
        ? (document.querySelector<HTMLElement>(containerOrSelector) as HTMLElement)
        : containerOrSelector;

    if (!container) throw new Error('SlidePlayer: container element not found.');

    this.container = container;
    this.interval = interval;
    this.includePicture = includePicture;
    this.dotsSelector = dotsSelector;
    this.autoCreateDots = autoCreateDots;
    this.startPaused = startPaused;

    this.#loader = new AsyncImageLoader(this.container, { includePicture: this.includePicture });
    this.#binder = new EventBinder(true);

    // If requested, start in paused state (manual)
    if (this.startPaused) this.#pauseReasons.add('manual');

    this.ready = this.#init();
  }

  // -------------------- Init / Destroy --------------------

  async #init(): Promise<void> {
    await this.#loader.waitForImagesToLoad();

    this.#slides = Array.from(this.container.querySelectorAll<HTMLElement>('.slide'));
    if (this.#slides.length === 0) {
      console.warn('[SlidePlayer] No .slide elements found in container.');
      return;
    }

    this.#setupDots();
    this.#bindEvents();

    // Activate first slide
    this.#setActiveSlide(0);

    // Start RAF loop
    this.#lastTimestamp = performance.now();
    this.#rafId = requestAnimationFrame(this.#animate);
  }

  public destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }

    this.#binder.unbindAll();
    this.#loader.destroy();

    this.#slides = [];
    this.#dots = [];
    this.#dotsWrapper = null;
    this.#pauseReasons.clear();
  }

  // -------------------- DOM / Dots --------------------

  #setupDots(): void {
    // Prefer provided selector inside container
    const selector = this.dotsSelector ?? '.dots';
    this.#dotsWrapper = this.container.querySelector<HTMLElement>(selector) || null;

    if (!this.#dotsWrapper && this.autoCreateDots) {
      this.#dotsWrapper = document.createElement('div');
      this.#dotsWrapper.className = 'dots';
      this.container.appendChild(this.#dotsWrapper);
    }

    // If no wrapper at all (autoCreate disabled), skip dots
    if (!this.#dotsWrapper) {
      this.#dots = [];
      return;
    }

    // Re-render dots
    this.#dotsWrapper.innerHTML = '';
    this.#dots = this.#slides.map((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.dataset.index = i.toString();
      this.#binder.bindDOM(
        dot,
        'click',
        (() => {
          this.goToSlide(i);
          this.#bumpTimer();
        }) as EventListener
      );
      this.#dotsWrapper!.appendChild(dot);
      return dot;
    });
  }

  #setActiveSlide(index: number): void {
    this.#slides[this.#currentIndex]?.classList.remove('active');
    this.#dots[this.#currentIndex]?.classList.remove('active');

    this.#currentIndex = index;

    this.#slides[this.#currentIndex]?.classList.add('active');
    this.#dots[this.#currentIndex]?.classList.add('active');
  }

  // -------------------- RAF Loop --------------------

  #animate = (timestamp: number): void => {
    if (this.#destroyed) return;

    if (!this.#lastTimestamp) this.#lastTimestamp = timestamp;
    const elapsed = timestamp - this.#lastTimestamp;

    if (!this.isPaused() && elapsed >= this.interval) {
      this.next();
      this.#lastTimestamp = timestamp;
    }

    this.#rafId = requestAnimationFrame(this.#animate);
  };

  // -------------------- Public API --------------------

  public goToSlide(index: number): void {
    if (index < 0 || index >= this.#slides.length) return;

    this.#setActiveSlide(index);
    this.#bumpTimer();

    // DOM CustomEvent
    this.#dispatch('slideplayer:slideChanged', { index: this.#currentIndex });
    // EventBus
    eventBus.emit('slideplayer:slide-changed', { index: this.#currentIndex });
  }

  public next(): void {
    this.goToSlide((this.#currentIndex + 1) % this.#slides.length);
  }

  public prev(): void {
    const prevIndex = (this.#currentIndex - 1 + this.#slides.length) % this.#slides.length;
    this.goToSlide(prevIndex);
  }

  public play(): void {
    const wasPaused = this.isPaused();
    this.#pauseReasons.delete('manual');
    if (wasPaused && !this.isPaused()) {
      this.#dispatch('slideplayer:resumed', { reasons: Array.from(this.#pauseReasons) });
    }
    this.#bumpTimer();
  }

  public pause(): void {
    const wasPaused = this.isPaused();
    this.#pauseReasons.add('manual');
    if (!wasPaused && this.isPaused()) {
      this.#dispatch('slideplayer:paused', { reasons: Array.from(this.#pauseReasons) });
    }
  }

  public isPaused(): boolean {
    return this.#pauseReasons.size > 0;
  }

  public get currentIndex(): number {
    return this.#currentIndex;
  }

  public get slideCount(): number {
    return this.#slides.length;
  }

  // -------------------- Events / Integration --------------------

  #bindEvents(): void {
    // Pointer events (mouse + touch unified)
    this.#binder.bindDOM(
      this.container,
      'pointerdown',
      ((e: Event) => {
        const ev = e as PointerEvent;
        this.#isPointerDown = true;
        this.#pointerStartX = ev.clientX;
        this.#pointerEndX = ev.clientX;
        // Avoid scroll interference on touch
        (this.container as HTMLElement).style.touchAction = 'pan-y';
      }) as EventListener
    );

    this.#binder.bindDOM(
      this.container,
      'pointermove',
      ((e: Event) => {
        if (!this.#isPointerDown) return;
        const ev = e as PointerEvent;
        this.#pointerEndX = ev.clientX;
      }) as EventListener
    );

    this.#binder.bindDOM(
      this.container,
      'pointerup',
      (() => {
        if (!this.#isPointerDown) return;
        this.#isPointerDown = false;
        this.#handleSwipe(this.#pointerStartX, this.#pointerEndX);
      }) as EventListener
    );

    this.#binder.bindDOM(
      this.container,
      'pointerleave',
      (() => {
        this.#isPointerDown = false;
      }) as EventListener
    );

    // Keyboard
    this.#binder.bindDOM(
      document,
      'keydown',
      ((e: Event) => {
        const ev = e as KeyboardEvent;
        if (ev.key === 'ArrowRight') {
          this.next();
          this.#bumpTimer();
        } else if (ev.key === 'ArrowLeft') {
          this.prev();
          this.#bumpTimer();
        }
      }) as EventListener
    );

    // Hover pause (reason-based)
    this.#binder.bindDOM(
      this.container,
      'mouseenter',
      (() => {
        this.#pauseWithTelemetry('hover');
      }) as EventListener
    );
    this.#binder.bindDOM(
      this.container,
      'mouseleave',
      (() => {
        this.#resumeWithTelemetry('hover');
        this.#bumpTimer();
      }) as EventListener
    );

    // Visibility pause
    this.#binder.bindDOM(
      document,
      'visibilitychange',
      (() => {
        if (document.visibilityState === 'hidden') {
          this.#pauseWithTelemetry('hidden');
        } else {
          this.#resumeWithTelemetry('hidden');
          this.#bumpTimer();
        }
      }) as EventListener
    );

    // Screensaver (global inactivity)
    this.#binder.bindBus('user:inactive', () => {
      // pause with reason 'inactivity' (will not be overridden by hover/visible)
      const wasPaused = this.isPaused();
      this.#pauseReasons.add('inactivity');
      if (!wasPaused && this.isPaused()) {
        this.#dispatch('slideplayer:paused', { reasons: Array.from(this.#pauseReasons) });
      }
      eventBus.emit('slideplayer:paused-due-to-inactivity', { index: this.#currentIndex });
    });

    this.#binder.bindBus('user:active', () => {
      const wasPaused = this.isPaused();
      this.#pauseReasons.delete('inactivity');
      if (wasPaused && !this.isPaused()) {
        this.#dispatch('slideplayer:resumed', { reasons: Array.from(this.#pauseReasons) });
        eventBus.emit('slideplayer:resumed-after-inactivity', { index: this.#currentIndex });
      }
      this.#bumpTimer();
    });

    // Cleanup
    this.#binder.bindDOM(window, 'beforeunload', (() => this.destroy()) as EventListener);
  }

  #pauseWithTelemetry(reason: PauseReason): void {
    const wasPaused = this.isPaused();
    this.#pauseReasons.add(reason);
    if (!wasPaused && this.isPaused()) {
      this.#dispatch('slideplayer:paused', { reasons: Array.from(this.#pauseReasons) });
    }
  }

  #resumeWithTelemetry(reason: PauseReason): void {
    const wasPaused = this.isPaused();
    this.#pauseReasons.delete(reason);
    if (wasPaused && !this.isPaused()) {
      this.#dispatch('slideplayer:resumed', { reasons: Array.from(this.#pauseReasons) });
    }
  }

  // -------------------- Gestures --------------------

  #handleSwipe(startX: number, endX: number): void {
    const delta = endX - startX;
    if (delta < -SlidePlayer.SWIPE_THRESHOLD) {
      this.next();
    } else if (delta > SlidePlayer.SWIPE_THRESHOLD) {
      this.prev();
    }
    this.#bumpTimer();
  }

  // -------------------- Utilities --------------------

  #bumpTimer(): void {
    this.#lastTimestamp = performance.now();
  }

  #dispatch<T extends object>(type: string, detail: T): void {
    this.container.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }
}
