import { EventBinder } from '/spaceface/system/bin/EventBinder.js'; // Import EventBinder
import { resizeManager } from '/spaceface/system/bin/ResizeManager.js'; // Import ResizeManager

export class HamburgerMenu {
    constructor() {
    this.toggle = document.querySelector('.menu-toggle');
    this.menu = document.getElementById('menu');
    this.focusableElements = this.menu.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select');
    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
    this.isOpen = false;
    this.eventBinder = new EventBinder(); // Create EventBinder instance

    this.init();
    }

    init() {
    this.eventBinder.bindDOM(this.toggle, 'click', this.toggleMenu.bind(this));
    this.menu.addEventListener('keydown', this.handleTab.bind(this));

    // Use resizeManager instead of direct window resize listener
    this.unsubscribeResize = resizeManager.onWindow(this.handleResize.bind(this));

    this.handleResize(); // Initial check
    }

    toggleMenu() {
    this.isOpen = !this.isOpen;
    this.toggle.setAttribute('aria-expanded', this.isOpen);
    this.menu.classList.toggle('active', this.isOpen);
    this.toggle.classList.toggle('active', this.isOpen);

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
    const isMobile = resizeManager.getWindow().width <= 768;
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

const hamburgerMenu = new HamburgerMenu();