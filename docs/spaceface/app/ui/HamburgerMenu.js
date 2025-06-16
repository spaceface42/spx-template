import { EventBinder } from '/spaceface/system/bin/EventBinder.js';
import { resizeManager } from '/spaceface/system/bin/ResizeManager.js';

class HamburgerMenu {
    constructor(options = {}) {
        this.options = {
            menuSelector: '.menu-toggle',
            menuId: 'menu',
            breakpoint: 768,
            activeClass: 'active',
            closeOnItemClick: true,
            // New options for CSS class customization
            menuListClass: '', // Class for the <ul>
            menuItemClass: '', // Class for the <li>
            menuLinkClass: '', // Class for the <a>
            // New options for callbacks
            onMenuOpen: null,
            onMenuClose: null,
            onResize: null,
            ...options,
        };

        this.toggle = document.querySelector(this.options.menuSelector);
        this.menu = document.getElementById(this.options.menuId);

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

        this.unsubscribeResize = resizeManager.onWindow(this.handleResize.bind(this));

        this.handleResize();

        // Apply CSS classes
        if (this.options.menuListClass) {
            this.menu.classList.add(this.options.menuListClass);
        }
        this.menuItems.forEach(item => {
            if (this.options.menuItemClass) {
                item.parentNode.classList.add(this.options.menuItemClass); // Add to <li>
            }
            if (this.options.menuLinkClass) {
                item.classList.add(this.options.menuLinkClass); // Add to <a>
            }
        });
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        this.toggle.setAttribute('aria-expanded', this.isOpen);
        this.menu.classList.toggle(this.options.activeClass, this.isOpen);
        this.toggle.classList.toggle(this.options.activeClass, this.isOpen);

        if (this.isOpen) {
            this.firstFocusableElement.focus();
            if (this.options.onMenuOpen) {
                this.options.onMenuOpen(this); // Pass the instance
            }
        } else {
            if (this.options.onMenuClose) {
                this.options.onMenuClose(this); // Pass the instance
            }
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
        if (this.options.onResize) {
            this.options.onResize(this, isMobile); // Pass the instance and isMobile status
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