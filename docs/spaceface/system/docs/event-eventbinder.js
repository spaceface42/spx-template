import { EventBinder } from '../../utils/EventBinder.js';
import { eventBus } from '../../bin/EventBus.js';

export class MySlideshow {
  constructor(containerSelector, options = {}) {
    this.container = document.querySelector(containerSelector);
    this.options = options;
    
    // 1. Initialize EventBinder
    this.eventBinder = new EventBinder();
    
    this.currentIndex = 0;
    this.rafId = null;
    
    this.init();
  }

  async init() {
    // Your slideshow setup code here...
    
    // 2. Use EventBinder for all event listeners
    
    // DOM events
    this.eventBinder.bindDOM(this.container, 'click', this.onClick.bind(this));
    this.eventBinder.bindDOM(this.container, 'mouseenter', this.onMouseEnter.bind(this));
    this.eventBinder.bindDOM(this.container, 'mouseleave', this.onMouseLeave.bind(this));
    this.eventBinder.bindDOM(document, 'keydown', this.onKeyDown.bind(this));
    
    // Touch events
    this.eventBinder.bindDOM(this.container, 'touchstart', this.onTouchStart.bind(this), { passive: true });
    this.eventBinder.bindDOM(this.container, 'touchend', this.onTouchEnd.bind(this));
    
    // EventBus events
    this.eventBinder.bindBus('user:inactive', this.onUserInactive.bind(this));
    this.eventBinder.bindBus('user:active', this.onUserActive.bind(this));
    
    // 3. Optional: Auto-cleanup for component-level slideshows
    this.eventBinder.bindDOM(window, 'beforeunload', () => {
      this.destroy();
    });
  }

  // Your event handlers
  onClick(e) {
    // Handle clicks
  }

  onMouseEnter() {
    // Pause slideshow
  }

  onMouseLeave() {
    // Resume slideshow
  }

  onKeyDown(e) {
    // Handle keyboard navigation
  }

  onTouchStart(e) {
    // Handle touch start
  }

  onTouchEnd(e) {
    // Handle touch end
  }

  onUserInactive() {
    // Handle user inactivity
  }

  onUserActive() {
    // Handle user activity
  }

  // 4. Simple destroy method
  destroy() {
    // Cancel animation frame
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    // One-line cleanup for all listeners
    this.eventBinder.unbindAll();
    
    // Clean up other resources
    // this.loader?.destroy();
    // this.otherResource?.cleanup();
  }
}