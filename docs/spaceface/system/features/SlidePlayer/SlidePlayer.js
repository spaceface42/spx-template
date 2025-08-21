var _a;
import { eventBus } from '../../bin/EventBus.js';
import { EventBinder } from '../../bin/EventBinder.js';
import { AsyncImageLoader } from '../../sbin/AsyncImageLoader.js';
export class SlidePlayer {
    /** Swipe / drag minimum in px */
    static SWIPE_THRESHOLD = 50;
    container;
    interval;
    includePicture;
    dotsSelector;
    autoCreateDots;
    startPaused;
    // Core state
    #currentIndex = 0;
    #lastTimestamp = 0;
    #rafId = null;
    #destroyed = false;
    // Input state (pointer-unified)
    #isPointerDown = false;
    #pointerStartX = 0;
    #pointerEndX = 0;
    // Elements
    #slides = [];
    #dots = [];
    #dotsWrapper = null;
    // Pause system
    #pauseReasons = new Set();
    // Infra
    #loader;
    #binder;
    // Ready promise
    ready;
    constructor(containerOrSelector, { interval = 5000, includePicture = false, dotsSelector, autoCreateDots = true, startPaused = false } = {}) {
        const container = typeof containerOrSelector === 'string'
            ? document.querySelector(containerOrSelector)
            : containerOrSelector;
        if (!container)
            throw new Error('SlidePlayer: container element not found.');
        this.container = container;
        this.interval = interval;
        this.includePicture = includePicture;
        this.dotsSelector = dotsSelector;
        this.autoCreateDots = autoCreateDots;
        this.startPaused = startPaused;
        this.#loader = new AsyncImageLoader(this.container, { includePicture: this.includePicture });
        this.#binder = new EventBinder(true);
        // If requested, start in paused state (manual)
        if (this.startPaused)
            this.#pauseReasons.add('manual');
        this.ready = this.#init();
    }
    // -------------------- Init / Destroy --------------------
    async #init() {
        await this.#loader.waitForImagesToLoad();
        this.#slides = Array.from(this.container.querySelectorAll('.slide'));
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
    destroy() {
        if (this.#destroyed)
            return;
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
    #setupDots() {
        // Prefer provided selector inside container
        const selector = this.dotsSelector ?? '.dots';
        this.#dotsWrapper = this.container.querySelector(selector) || null;
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
            this.#binder.bindDOM(dot, 'click', (() => {
                this.goToSlide(i);
                this.#bumpTimer();
            }));
            this.#dotsWrapper.appendChild(dot);
            return dot;
        });
    }
    #setActiveSlide(index) {
        this.#slides[this.#currentIndex]?.classList.remove('active');
        this.#dots[this.#currentIndex]?.classList.remove('active');
        this.#currentIndex = index;
        this.#slides[this.#currentIndex]?.classList.add('active');
        this.#dots[this.#currentIndex]?.classList.add('active');
    }
    // -------------------- RAF Loop --------------------
    #animate = (timestamp) => {
        if (this.#destroyed)
            return;
        if (!this.#lastTimestamp)
            this.#lastTimestamp = timestamp;
        const elapsed = timestamp - this.#lastTimestamp;
        if (!this.isPaused() && elapsed >= this.interval) {
            this.next();
            this.#lastTimestamp = timestamp;
        }
        this.#rafId = requestAnimationFrame(this.#animate);
    };
    // -------------------- Public API --------------------
    goToSlide(index) {
        if (index < 0 || index >= this.#slides.length)
            return;
        this.#setActiveSlide(index);
        this.#bumpTimer();
        // DOM CustomEvent
        this.#dispatch('slideplayer:slideChanged', { index: this.#currentIndex });
        // EventBus
        eventBus.emit('slideplayer:slide-changed', { index: this.#currentIndex });
    }
    next() {
        this.goToSlide((this.#currentIndex + 1) % this.#slides.length);
    }
    prev() {
        const prevIndex = (this.#currentIndex - 1 + this.#slides.length) % this.#slides.length;
        this.goToSlide(prevIndex);
    }
    play() {
        const wasPaused = this.isPaused();
        this.#pauseReasons.delete('manual');
        if (wasPaused && !this.isPaused()) {
            this.#dispatch('slideplayer:resumed', { reasons: Array.from(this.#pauseReasons) });
        }
        this.#bumpTimer();
    }
    pause() {
        const wasPaused = this.isPaused();
        this.#pauseReasons.add('manual');
        if (!wasPaused && this.isPaused()) {
            this.#dispatch('slideplayer:paused', { reasons: Array.from(this.#pauseReasons) });
        }
    }
    isPaused() {
        return this.#pauseReasons.size > 0;
    }
    get currentIndex() {
        return this.#currentIndex;
    }
    get slideCount() {
        return this.#slides.length;
    }
    // -------------------- Events / Integration --------------------
    #bindEvents() {
        // Pointer events (mouse + touch unified)
        this.#binder.bindDOM(this.container, 'pointerdown', ((e) => {
            const ev = e;
            this.#isPointerDown = true;
            this.#pointerStartX = ev.clientX;
            this.#pointerEndX = ev.clientX;
            // Avoid scroll interference on touch
            this.container.style.touchAction = 'pan-y';
        }));
        this.#binder.bindDOM(this.container, 'pointermove', ((e) => {
            if (!this.#isPointerDown)
                return;
            const ev = e;
            this.#pointerEndX = ev.clientX;
        }));
        this.#binder.bindDOM(this.container, 'pointerup', (() => {
            if (!this.#isPointerDown)
                return;
            this.#isPointerDown = false;
            this.#handleSwipe(this.#pointerStartX, this.#pointerEndX);
        }));
        this.#binder.bindDOM(this.container, 'pointerleave', (() => {
            this.#isPointerDown = false;
        }));
        // Keyboard
        this.#binder.bindDOM(document, 'keydown', ((e) => {
            const ev = e;
            if (ev.key === 'ArrowRight') {
                this.next();
                this.#bumpTimer();
            }
            else if (ev.key === 'ArrowLeft') {
                this.prev();
                this.#bumpTimer();
            }
        }));
        // Hover pause (reason-based)
        this.#binder.bindDOM(this.container, 'mouseenter', (() => {
            this.#pauseWithTelemetry('hover');
        }));
        this.#binder.bindDOM(this.container, 'mouseleave', (() => {
            this.#resumeWithTelemetry('hover');
            this.#bumpTimer();
        }));
        // Visibility pause
        this.#binder.bindDOM(document, 'visibilitychange', (() => {
            if (document.visibilityState === 'hidden') {
                this.#pauseWithTelemetry('hidden');
            }
            else {
                this.#resumeWithTelemetry('hidden');
                this.#bumpTimer();
            }
        }));
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
        this.#binder.bindDOM(window, 'beforeunload', (() => this.destroy()));
    }
    #pauseWithTelemetry(reason) {
        const wasPaused = this.isPaused();
        this.#pauseReasons.add(reason);
        if (!wasPaused && this.isPaused()) {
            this.#dispatch('slideplayer:paused', { reasons: Array.from(this.#pauseReasons) });
        }
    }
    #resumeWithTelemetry(reason) {
        const wasPaused = this.isPaused();
        this.#pauseReasons.delete(reason);
        if (wasPaused && !this.isPaused()) {
            this.#dispatch('slideplayer:resumed', { reasons: Array.from(this.#pauseReasons) });
        }
    }
    // -------------------- Gestures --------------------
    #handleSwipe(startX, endX) {
        const delta = endX - startX;
        if (delta < -_a.SWIPE_THRESHOLD) {
            this.next();
        }
        else if (delta > _a.SWIPE_THRESHOLD) {
            this.prev();
        }
        this.#bumpTimer();
    }
    // -------------------- Utilities --------------------
    #bumpTimer() {
        this.#lastTimestamp = performance.now();
    }
    #dispatch(type, detail) {
        this.container.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
    }
}
_a = SlidePlayer;
