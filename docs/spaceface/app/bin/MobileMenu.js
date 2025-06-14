export  class MobileMenu {
  constructor({ menuSelector = '#menu', toggleSelector = '#menu-toggle', breakpoint = 768 } = {}) {
    this.menu = document.querySelector(menuSelector);
    this.toggle = document.querySelector(toggleSelector);
    this.breakpoint = breakpoint;
    this._isMobile = window.innerWidth <= this.breakpoint;
    this._menuVisible = false;

    if (!this.menu || !this.toggle) return;

    this._bindEvents();
    this._handleResize(); // set initial state
  }

  _bindEvents() {
    this._toggleHandler = this.toggleMenu.bind(this);
    this._resizeHandler = this._handleResize.bind(this);

    this.toggle.addEventListener('click', this._toggleHandler);
    window.addEventListener('resize', this._resizeHandler);
  }

  _handleResize() {
    const wasMobile = this._isMobile;
    this._isMobile = window.innerWidth <= this.breakpoint;

    if (this._isMobile !== wasMobile) {
      if (!this._isMobile) {
        this.showMenu(); // always show on desktop
      } else {
        this.hideMenu(); // start hidden on mobile
      }
    }
  }

  toggleMenu() {
    this._menuVisible ? this.hideMenu() : this.showMenu();
  }

  showMenu() {
    this.menu.classList.remove('menu--hidden');
    this._menuVisible = true;
  }

  hideMenu() {
    this.menu.classList.add('menu--hidden');
    this._menuVisible = false;
  }

  destroy() {
    this.toggle.removeEventListener('click', this._toggleHandler);
    window.removeEventListener('resize', this._resizeHandler);
  }
}
