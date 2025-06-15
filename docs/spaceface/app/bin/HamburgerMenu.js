
import { debounce } from './spaceface/system/usr/bin/timing.js';
import { EventBinder } from './spaceface/system/bin/EventBinder.js'; // Import EventBinder

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

    // Debounce the handleResize method
    this.debouncedHandleResize = debounce(this.handleResize.bind(this), 150);
    this.eventBinder.bindDOM(window, 'resize', this.debouncedHandleResize);

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
    const isMobile = window.innerWidth <= 768;
    if (!isMobile && this.isOpen) {
        this.toggleMenu(); // Close menu on desktop
    }
    }

    destroy() {
    this.eventBinder.unbindAll(); // Unbind all events
    }
}


