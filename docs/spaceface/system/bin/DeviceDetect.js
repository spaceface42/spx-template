import { eventBus } from './EventBus.js';
import { EventBinder } from './EventBinder.js';

/**
 * DeviceDetect
 *
 * Utility class for detecting device type (mobile/desktop),
 * updating body classes, and handling swipe and resize/orientation events.
 *
 * - Adds "is-mobile" or "is-desktop" class to <body> based on device.
 * - Emits events on swipe (mobile) and resize/orientation change.
 * - Detects left/right swipe gestures on mobile devices.
 *
 * @example
 * const detector = new DeviceDetect({
 *   onSwipe: direction => console.log('Swiped:', direction),
 *   onResize: () => console.log('Resized or orientation changed')
 * });
 */
export class DeviceDetect {
  /**
   * @param {Object} [options]
   * @param {function} [options.onSwipe] - Callback for swipe events ("left" or "right").
   * @param {function} [options.onResize] - Callback for resize/orientation events.
   * @param {boolean} [options.debug] - Enable debug mode for EventBinder.
   */
  constructor({ onSwipe, onResize, debug = false } = {}) {
    this.onSwipe = onSwipe;
    this.onResize = onResize;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.eventBinder = new EventBinder(debug);

    this.setDeviceClass();
    this.bindEvents();
  }

  isMobileDevice() {
    return matchMedia("(pointer: coarse)").matches || /Mobi|Android/i.test(navigator.userAgent);
  }

  setDeviceClass() {
    const isMobile = this.isMobileDevice();
    const body = document.body;
    body.classList.toggle("is-mobile", isMobile);
    body.classList.toggle("is-desktop", !isMobile);
  }

  bindEvents() {
    // Window resize
    this.eventBinder.bindDOM(window, "resize", () => {
      this.setDeviceClass();
      this.onResize?.();
      eventBus.emit("device:resize");
    });

    // Orientation change
    this.eventBinder.bindDOM(window, "orientationchange", () => {
      this.onResize?.();
      eventBus.emit("device:orientationchange");
    });

    // Swipe detection (mobile only)
    if (this.isMobileDevice()) {
      this.enableSwipeDetection();
    }
  }

  enableSwipeDetection() {
    this.eventBinder.bindDOM(window, "touchstart", e => {
      this.touchStartX = e.changedTouches[0].screenX;
    });

    this.eventBinder.bindDOM(window, "touchend", e => {
      this.touchEndX = e.changedTouches[0].screenX;
      const delta = this.touchEndX - this.touchStartX;
      if (Math.abs(delta) > 50) {
        const direction = delta < 0 ? "left" : "right";
        this.onSwipe?.(direction);
        eventBus.emit("device:swipe", { direction });
      }
    });
  }

  /**
   * Unbind all events (call when cleaning up)
   */
  destroy() {
    this.eventBinder.unbindAll();
  }
}
