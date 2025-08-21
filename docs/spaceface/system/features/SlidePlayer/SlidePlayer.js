import { eventBus } from '../../bin/EventBus.js';
import { EventBinder } from '../../bin/EventBinder.js';
import { AsyncImageLoader } from '../../sbin/AsyncImageLoader.js';
export class SlidePlayer {
    static SWIPE_THRESHOLD = 50;
    container;
    interval;
    includePicture;
    currentIndex = 0;
    lastTimestamp = 0;
    rafId = null;
    _destroyed = false;
    touchStartX = 0;
    touchEndX = 0;
    mouseStartX = 0;
    mouseEndX = 0;
    isDragging = false;
    slides = [];
    dots = [];
    dotsWrapper = null;
    pauseReasons = new Set();
    loader;
    eventBinder;
    ready;
    constructor(containerSelector, { interval = 5000, includePicture = false } = {}) {
        this.container =
            typeof containerSelector === 'string'
                ? document.querySelector(containerSelector)
                : containerSelector;
        if (!this.container)
            throw new Error('Container element not found.');
        this.interval = interval;
        this.includePicture = includePicture;
        this.loader = new AsyncImageLoader(this.container, { includePicture });
        this.eventBinder = new EventBinder(true);
        this.ready = this.init();
    }
    // ---------- Init / teardown ----------
    async init() {
        await this.loader.waitForImagesToLoad();
        this.slides = Array.from(this.container.querySelectorAll('.slide'));
        if (this.slides.length === 0) {
            console.warn('[SlidePlayer] No .slide elements inside container.');
            return;
        }
        // Create or re-create dots
        this.dotsWrapper = this.container.querySelector('.dots');
        if (!this.dotsWrapper) {
            this.dotsWrapper = document.createElement('div');
            this.dotsWrapper.className = 'dots';
            this.container.appendChild(this.dotsWrapper);
        }
        else {
            this.dotsWrapper.innerHTML = '';
        }
        this.dots = [];
        this.slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.dataset.index = i.toString();
            // Keep EventListener type happy without losing strong typing
            this.eventBinder.bindDOM(dot, 'click', (() => {
                this.goToSlide(i);
                this.bumpTimer();
            }));
            this.dotsWrapper.appendChild(dot);
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
    async destroy() {
        if (this._destroyed)
            return;
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
    bindEvents() {
        // Touch (use Event and narrow with instanceof for TS)
        this.eventBinder.bindDOM(this.container, 'touchstart', ((e) => {
            if (e instanceof TouchEvent) {
                this.touchStartX = e.changedTouches[0].screenX;
            }
        }), { passive: true });
        this.eventBinder.bindDOM(this.container, 'touchend', ((e) => {
            if (e instanceof TouchEvent) {
                this.touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(this.touchStartX, this.touchEndX);
            }
        }));
        // Mouse
        this.eventBinder.bindDOM(this.container, 'mousedown', this.onMouseDown);
        this.eventBinder.bindDOM(this.container, 'mousemove', this.onMouseMove);
        this.eventBinder.bindDOM(this.container, 'mouseup', this.onMouseUp);
        this.eventBinder.bindDOM(this.container, 'mouseleave', this.onMouseLeave);
        // Keyboard
        this.eventBinder.bindDOM(document, 'keydown', this.onKeyDown);
        // Pause on hover (reason-based so it won't override inactivity)
        this.eventBinder.bindDOM(this.container, 'mouseenter', (() => this.pause('hover')));
        this.eventBinder.bindDOM(this.container, 'mouseleave', (() => this.resume('hover')));
        // Pause while tab hidden; resume when visible (won't override inactivity)
        this.eventBinder.bindDOM(document, 'visibilitychange', (() => {
            if (document.visibilityState === 'hidden') {
                this.pause('hidden');
            }
            else {
                this.resume('hidden');
                this.bumpTimer();
            }
        }));
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
        this.eventBinder.bindDOM(window, 'beforeunload', (() => this.destroy()));
    }
    // ---------- RAF loop ----------
    animate = (timestamp) => {
        if (this._destroyed)
            return;
        if (!this.lastTimestamp)
            this.lastTimestamp = timestamp;
        const elapsed = timestamp - this.lastTimestamp;
        if (!this.isPaused() && elapsed >= this.interval) {
            this.nextSlide();
            this.lastTimestamp = timestamp;
        }
        this.rafId = requestAnimationFrame(this.animate);
    };
    // ---------- Public navigation ----------
    goToSlide(index) {
        if (index < 0 || index >= this.slides.length)
            return;
        this.setActiveSlide(index);
        this.bumpTimer();
        eventBus.emit('slideplayer:slide-changed', { index: this.currentIndex });
    }
    nextSlide() {
        this.goToSlide((this.currentIndex + 1) % this.slides.length);
    }
    prevSlide() {
        const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }
    // ---------- Private helpers ----------
    setActiveSlide(index) {
        this.slides[this.currentIndex]?.classList.remove('active');
        this.dots[this.currentIndex]?.classList.remove('active');
        this.currentIndex = index;
        this.slides[this.currentIndex]?.classList.add('active');
        this.dots[this.currentIndex]?.classList.add('active');
    }
    handleSwipe(startX, endX) {
        const delta = endX - startX;
        if (delta < -SlidePlayer.SWIPE_THRESHOLD) {
            this.nextSlide();
        }
        else if (delta > SlidePlayer.SWIPE_THRESHOLD) {
            this.prevSlide();
        }
        this.bumpTimer();
    }
    bumpTimer() {
        this.lastTimestamp = performance.now();
    }
    // Pause system with reasons so different subsystems don’t fight each other
    isPaused() {
        return this.pauseReasons.size > 0;
    }
    pause(reason) {
        this.pauseReasons.add(reason);
    }
    resume(reason) {
        this.pauseReasons.delete(reason);
    }
    // ---------- Handlers ----------
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
            this.bumpTimer();
        }
        else if (e.key === 'ArrowLeft') {
            this.prevSlide();
            this.bumpTimer();
        }
    };
}
