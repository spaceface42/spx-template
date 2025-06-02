// DeviceDetect.js
export class DeviceDetect {
  constructor({ onSwipe, onResize } = {}) {
    this.onSwipe = onSwipe;
    this.onResize = onResize;
    this.touchStartX = 0;
    this.touchEndX = 0;

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
