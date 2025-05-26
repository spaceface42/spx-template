export default class ScreensaverOverlay {
  constructor(options = {}) {
    // Configuration
    this.config = {
      selector: '.screensaver',
      layoutsSelector: '.screensaver-layouts',
      layoutSelector: '.screensaver-layout',
      delayAttribute: 'data-delay',
      inactivityDelayAttribute: 'data-ssdelay',
      apiEndpoint: 'custom-api/get-layouts',
      defaultDelay: 5000, // 5 seconds between layout changes
      defaultInactivityDelay: 30000, // 30 seconds of inactivity
      ...options
    };

    // State
    this.isActive = false;
    this.inactivityTimer = null;
    this.layoutTimer = null;
    this.isInitialized = false;

    // DOM elements
    this.overlay = null;
    this.layoutsContainer = null;
    this.layouts = null;

    // Bind methods
    this.handleUserActivity = this.handleUserActivity.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.cycleLayouts = this.cycleLayouts.bind(this);

    this.init();
  }

  async init() {
    try {
      this.findElements();
      await this.loadLayouts();
      this.setupEventListeners();
      this.updateDimensions();
      this.startInactivityTimer();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize screensaver:', error);
    }
  }

  findElements() {
    this.overlay = document.querySelector(this.config.selector);
    if (!this.overlay) {
      throw new Error(`Screensaver element not found: ${this.config.selector}`);
    }

    this.layoutsContainer = document.querySelector(this.config.layoutsSelector);
    if (!this.layoutsContainer) {
      throw new Error(`Layouts container not found: ${this.config.layoutsSelector}`);
    }

    // Get delay values from data attributes
    this.layoutDelay = parseInt(this.overlay.getAttribute(this.config.delayAttribute)) || this.config.defaultDelay;
    this.inactivityDelay = parseInt(this.overlay.getAttribute(this.config.inactivityDelayAttribute)) || this.config.defaultInactivityDelay;
  }

  async loadLayouts() {
    // Skip API call if layouts already exist
    const existingLayouts = document.querySelectorAll(this.config.layoutSelector);
    if (existingLayouts.length > 0) {
      this.layouts = existingLayouts;
      return;
    }

    try {
      const response = await fetch(this.config.apiEndpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch layouts: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.layoutsContainer.innerHTML = data.layouts;
      this.layouts = document.querySelectorAll(this.config.layoutSelector);
    } catch (error) {
      console.warn('Failed to load layouts from API:', error);
      this.layouts = document.querySelectorAll(this.config.layoutSelector);
    }
  }

  setupEventListeners() {
    // User activity events
    const activityEvents = ['mousemove', 'click', 'scroll', 'touchstart', 'keydown'];
    activityEvents.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, { passive: true });
    });

    // Window resize
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  handleUserActivity() {
    if (this.isActive) {
      this.hide();
    }
    this.startInactivityTimer();
  }

  handleResize() {
    this.updateDimensions();
  }

  updateDimensions() {
    if (!this.overlay) return;

    // Update width and height displays
    const widthEl = this.overlay.querySelector('.width');
    const heightEl = this.overlay.querySelector('.height');
    
    if (widthEl) widthEl.textContent = window.innerWidth;
    if (heightEl) heightEl.textContent = window.innerHeight;

    // Update image cover classes
    this.overlay.querySelectorAll('.image').forEach(img => {
      const column = img.closest('.column');
      if (!column) return;

      const columnWidth = column.offsetWidth;
      const columnHeight = column.offsetHeight;
      const imageProp = parseFloat(img.getAttribute('data-prop')) || 1;

      if (columnWidth * imageProp > columnHeight) {
        img.classList.add('cover');
      } else {
        img.classList.remove('cover');
      }
    });
  }

  startInactivityTimer() {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      this.show();
    }, this.inactivityDelay);
  }

  clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  show() {
    if (this.isActive || !this.layouts || this.layouts.length === 0) return;

    this.overlay.classList.add('temp-shown');
    this.isActive = true;

    // Start layout cycling
    this.layoutTimer = setInterval(this.cycleLayouts, this.layoutDelay);
    
    // Preload first layout
    this.preloadLayout(this.layouts[0]);
  }

  hide() {
    if (!this.isActive) return;

    this.overlay.classList.remove('temp-shown');
    this.isActive = false;

    if (this.layoutTimer) {
      clearInterval(this.layoutTimer);
      this.layoutTimer = null;
    }
  }

  cycleLayouts() {
    if (!this.layouts || this.layouts.length === 0) return;

    const currentLayout = document.querySelector(`${this.config.layoutSelector}:not(.hide)`);
    let nextLayout;

    if (currentLayout) {
      // Find next layout
      const currentIndex = Array.from(this.layouts).indexOf(currentLayout);
      const nextIndex = (currentIndex + 1) % this.layouts.length;
      nextLayout = this.layouts[nextIndex];
      
      // Hide current layout
      currentLayout.classList.add('hide');
    } else {
      // No current layout, show first one
      nextLayout = this.layouts[0];
    }

    // Show next layout
    if (nextLayout) {
      nextLayout.classList.remove('hide');
      
      // Preload current and next layout images
      this.preloadLayout(nextLayout);
      
      const nextIndex = Array.from(this.layouts).indexOf(nextLayout);
      const followingIndex = (nextIndex + 1) % this.layouts.length;
      this.preloadLayout(this.layouts[followingIndex]);
    }
  }

  preloadLayout(layout) {
    if (!layout) return;

    const images = layout.querySelectorAll('img:not(.lazypreload):not(.lazyloaded)');
    images.forEach(img => {
      img.classList.add('lazypreload');
    });
  }

  destroy() {
    // Clean up timers
    this.clearInactivityTimer();
    if (this.layoutTimer) {
      clearInterval(this.layoutTimer);
    }

    // Remove event listeners
    const activityEvents = ['mousemove', 'click', 'scroll', 'touchstart', 'keydown'];
    activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity);
    });
    window.removeEventListener('resize', this.handleResize);

    // Hide overlay
    if (this.overlay) {
      this.overlay.classList.remove('temp-shown');
    }

    this.isInitialized = false;
  }

  // Public API methods
  getConfig() {
    return { ...this.config };
  }

  isScreensaverActive() {
    return this.isActive;
  }

  forceShow() {
    this.clearInactivityTimer();
    this.show();
  }

  forceHide() {
    this.hide();
    this.startInactivityTimer();
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isInitialized) {
      // Re-read delay values if they changed
      if (this.overlay) {
        this.layoutDelay = parseInt(this.overlay.getAttribute(this.config.delayAttribute)) || this.config.defaultDelay;
        this.inactivityDelay = parseInt(this.overlay.getAttribute(this.config.inactivityDelayAttribute)) || this.config.defaultInactivityDelay;
      }
    }
  }
}