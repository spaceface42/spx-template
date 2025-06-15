import { EventBinder } from '/spaceface/system/bin/EventBinder.js'; // Import EventBinder
import { resizeManager } from '/spaceface/system/bin/ResizeManager.js'; // Import ResizeManager

class HamburgerMenu {
  constructor(options = {}) {
    this.options = {
      menuSelector: '.menu-toggle',
      menuId: 'menu',
      breakpoint: 768,
      activeClass: 'active',
      closeOnItemClick: true, // New option to control close on item click
      ...options, // Override defaults with user options
    };

    this.toggle = document.querySelector(this.options.menuSelector);
    this.menu = document.getElementById(this.options.menuId);
    this.menuItems = Array.from(this.menu.querySelectorAll('a')); // Get all menu items as an array
    this.focusableElements = this.menu.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select');
    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
    this.isOpen = false;
    this.eventBinder = new EventBinder(); // Create EventBinder instance
    this.menuItemClickHandlers = []; // Array to store bound click handlers

    this.init();
  }

  init() {
    this.eventBinder.bindDOM(this.toggle, 'click', this.toggleMenu.bind(this));
    this.menu.addEventListener('keydown', this.handleTab.bind(this));

    // Add click listener to menu items
    if (this.options.closeOnItemClick) {
      this.menuItems.forEach(item => {
        const boundHandler = this.toggleMenu.bind(this); // Bind the handler
        this.eventBinder.bindDOM(item, 'click', boundHandler); // Bind using EventBinder
        this.menuItemClickHandlers.push(boundHandler); // Store the bound handler
      });
    }

    // Use resizeManager instead of direct window resize listener
    this.unsubscribeResize = resizeManager.onWindow(this.handleResize.bind(this));

    this.handleResize(); // Initial check
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
    this.toggle.setAttribute('aria-expanded', this.isOpen);
    this.menu.classList.toggle(this.options.activeClass, this.isOpen);
    this.toggle.classList.toggle(this.options.activeClass, this.isOpen);

    if (this.isOpen) {
      this.firstFocusableElement.focus();
    }
  }

  handleTab(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === this.firstFocusableElement) {
          e.preventDefault();
          this.lastFocusableElement.focus();
        }
      } else {
        if (document.activeElement === this.lastFocusableElement) {
          e.preventDefault();
          this.firstFocusableElement.focus();
        }
      }
    }
  }

  handleResize() {
    const isMobile = resizeManager.getWindow().width <= this.options.breakpoint;
    if (!isMobile && this.isOpen) {
      this.toggleMenu(); // Close menu on desktop
    }
  }

  destroy() {
    this.eventBinder.unbindAll(); // Unbind all DOM events
    if (this.unsubscribeResize) {
      this.unsubscribeResize(); // Unsubscribe from resizeManager
    }
  }
}

export { HamburgerMenu };