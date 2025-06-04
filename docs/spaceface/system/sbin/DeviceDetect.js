/**
 * DeviceDetect
 *
 * Utility class for detecting device type (mobile/desktop),
 * updating body classes, and handling swipe and resize/orientation events.
 *
 * - Adds "is-mobile" or "is-desktop" class to <body> based on device.
 * - Calls optional callbacks on swipe (mobile) and resize/orientation change.
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
   */
  constructor({ onSwipe, onResize } = {}) {
    this.onSwipe = onSwipe;
    this.onResize = onResize;
    this.touchStartX = 0;
    this.touchEndX = 0;

    this.setDeviceClass();
    this.bindEvents();
  }

  /**
   * Detect if the device is mobile (touch-capable or user agent).
   * @returns {boolean}
   */
  isMobileDevice() {
    return matchMedia("(pointer: coarse)").matches || /Mobi|Android/i.test(navigator.userAgent);
  }

  /**
   * Set "is-mobile" or "is-desktop" class on <body> based on device type.
   */
  setDeviceClass() {
    const isMobile = this.isMobileDevice();
    const body = document.body;

    body.classList.toggle("is-mobile", isMobile);
    body.classList.toggle("is-desktop", !isMobile);
  }

  /**
   * Bind resize, orientation, and (if mobile) swipe event listeners.
   */
  bindEvents() {
    window.addEventListener("resize", () => {
      this.setDeviceClass();
      this.onResize?.();
    });

    window.addEventListener("orientationchange", () => {
      this.onResize?.();
    });

    if (this.isMobileDevice()) {
      this.enableSwipeDetection();
    }
  }

  /**
   * Enable swipe detection on mobile devices.
   * Calls onSwipe callback with "left" or "right" if swipe detected.
   */
  enableSwipeDetection() {
    window.addEventListener("touchstart", e => {
      this.touchStartX = e.changedTouches[0].screenX;
    });

    window.addEventListener("touchend", e => {
      this.touchEndX = e.changedTouches[0].screenX;
      const delta = this.touchEndX - this.touchStartX;
      if (Math.abs(delta) > 50) {
        this.onSwipe?.(delta < 0 ? "left" : "right");
      }
    });
  }
}
