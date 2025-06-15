import { EventBinder } from '/spaceface/system/bin/EventBinder.js'; // Import EventBinder
import { resizeManager } from '/spaceface/system/bin/ResizeManager.js'; // Import ResizeManager

class HamburgerMenu {
    constructor(options = {}) {
        this.options = {
            menuSelector: '.menu-toggle',
            menuId: 'menu',
            breakpoint: 768,
            activeClass: 'active',
            closeOnItemClick: true,
            ...options,
        };

        console.log('Options:', this.options);

        this.toggle = document.querySelector(this.options.menuSelector);
        this.menu = document.getElementById(this.options.menuId);

        console.log('Toggle Element:', this.toggle);
        console.log('Menu Element:', this.menu);

        if (!this.toggle || !this.menu) {
            console.error('HamburgerMenu: Toggle or menu element not found.');
            return;
        }

        this.menuItems = Array.from(this.menu.querySelectorAll('a'));
        this.focusableElements = this.menu.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select');
        this.firstFocusableElement = this.focusableElements[0];
        this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
        this.isOpen = false;
        this.eventBinder = new EventBinder();
        this.menuItemClickHandlers = [];

        this.init();
    }

    init() {
        this.eventBinder.bindDOM(this.toggle, 'click', this.toggleMenu.bind(this));
        this.menu.addEventListener('keydown', this.handleTab.bind(this));

        if (this.options.closeOnItemClick) {
            this.menuItems.forEach(item => {
                const boundHandler = this.toggleMenu.bind(this);
                this.eventBinder.bindDOM(item, 'click', boundHandler);
                this.menuItemClickHandlers.push(boundHandler);
            });
        }

        // Use resizeManager instead of direct window resize listener
        this.unsubscribeResize = resizeManager.onWindow(this.handleResize.bind(this));

        this.handleResize();
    }

    toggleMenu() {
        console.log('toggleMenu called'); // ADDED: Log when toggleMenu is called
        this.isOpen = !this.isOpen;
        this.toggle.setAttribute('aria-expanded', this.isOpen);
        this.menu.classList.toggle(this.options.activeClass, this.isOpen);
        this.toggle.classList.toggle(this.options.activeClass, this.isOpen);

        console.log('isOpen:', this.isOpen); // ADDED: Log the value of isOpen
        console.log('Menu classList:', this.menu.classList); // ADDED: Log the menu's classList
        console.log('Toggle classList:', this.toggle.classList); // ADDED: Log the toggle's classList

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
            this.toggleMenu();
        }
    }

    destroy() {
        this.eventBinder.unbindAll();
        if (this.unsubscribeResize) {
            this.unsubscribeResize();
        }
    }
}

export { HamburgerMenu };