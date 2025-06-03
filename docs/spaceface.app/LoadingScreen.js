/**
 * LoadingScreen - A fast, modern vanilla JS loading screen component
 * Lightweight, performant, and customizable
 */
export class LoadingScreen {
  constructor(options = {}) {
    this.options = {
      text: 'Loading...',
      spinnerType: 'pulse', // 'pulse', 'spin', 'dots', 'bars'
      theme: 'dark', // 'dark', 'light'
      blur: true,
      fadeSpeed: 200,
      zIndex: 9999,
      ...options
    };
    
    this.element = null;
    this.isVisible = false;
    this.fadeTimeout = null;
  }

  // Create the loading screen element
  createElement() {
    if (this.element) return this.element;

    const loader = document.createElement('div');
    loader.className = 'loading-screen';
    loader.innerHTML = `
      <div class="loading-backdrop"></div>
      <div class="loading-content">
        <div class="loading-spinner ${this.options.spinnerType}"></div>
        <div class="loading-text">${this.options.text}</div>
      </div>
    `;

    // Add styles
    this.injectStyles();
    
    this.element = loader;
    return loader;
  }

  // Inject CSS styles
  injectStyles() {
    if (document.querySelector('#loading-screen-styles')) return;

    const style = document.createElement('style');
    style.id = 'loading-screen-styles';
    style.textContent = `
      .loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${this.options.zIndex};
        opacity: 0;
        visibility: hidden;
        transition: opacity ${this.options.fadeSpeed}ms ease, visibility ${this.options.fadeSpeed}ms ease;
        pointer-events: none;
      }

      .loading-screen.visible {
        opacity: 1;
        visibility: visible;
        pointer-events: all;
      }

      .loading-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${this.options.theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
        ${this.options.blur ? 'backdrop-filter: blur(4px);' : ''}
      }

      .loading-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        z-index: 1;
      }

      .loading-text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 1rem;
        font-weight: 500;
        color: ${this.options.theme === 'dark' ? '#ffffff' : '#333333'};
        text-align: center;
        opacity: 0.9;
      }

      /* Spinner Animations */
      .loading-spinner {
        width: 40px;
        height: 40px;
        position: relative;
      }

      /* Pulse Spinner */
      .loading-spinner.pulse {
        border-radius: 50%;
        background: ${this.options.theme === 'dark' ? '#ffffff' : '#333333'};
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(0.8); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 1; }
      }

      /* Spin Spinner */
      .loading-spinner.spin {
        border: 3px solid ${this.options.theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
        border-top: 3px solid ${this.options.theme === 'dark' ? '#ffffff' : '#333333'};
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* Dots Spinner */
      .loading-spinner.dots {
        display: flex;
        gap: 4px;
      }

      .loading-spinner.dots::before,
      .loading-spinner.dots::after,
      .loading-spinner.dots {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${this.options.theme === 'dark' ? '#ffffff' : '#333333'};
        animation: dots 1.4s ease-in-out infinite both;
      }

      .loading-spinner.dots::before { animation-delay: -0.32s; }
      .loading-spinner.dots::after { animation-delay: -0.16s; }

      @keyframes dots {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }

      /* Bars Spinner */
      .loading-spinner.bars {
        display: flex;
        gap: 2px;
        align-items: end;
      }

      .loading-spinner.bars::before,
      .loading-spinner.bars::after,
      .loading-spinner.bars {
        content: '';
        width: 4px;
        height: 20px;
        background: ${this.options.theme === 'dark' ? '#ffffff' : '#333333'};
        animation: bars 1.2s ease-in-out infinite;
      }

      .loading-spinner.bars::before { animation-delay: -0.24s; }
      .loading-spinner.bars::after { animation-delay: -0.12s; }

      @keyframes bars {
        0%, 40%, 100% { transform: scaleY(0.4); }
        20% { transform: scaleY(1); }
      }
    `;

    document.head.appendChild(style);
  }

  // Show loading screen
  show(text) {
    if (text) this.updateText(text);
    
    if (!this.element) {
      this.createElement();
      document.body.appendChild(this.element);
    }

    // Force reflow for smooth animation
    this.element.offsetHeight;
    
    clearTimeout(this.fadeTimeout);
    this.element.classList.add('visible');
    this.isVisible = true;

    return this;
  }

  // Hide loading screen
  hide() {
    if (!this.element || !this.isVisible) return this;

    this.element.classList.remove('visible');
    this.isVisible = false;

    this.fadeTimeout = setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, this.options.fadeSpeed);

    return this;
  }

  // Update loading text
  updateText(text) {
    if (this.element) {
      const textEl = this.element.querySelector('.loading-text');
      if (textEl) textEl.textContent = text;
    }
    return this;
  }

  // Check if currently visible
  get visible() {
    return this.isVisible;
  }

  // Destroy instance and clean up
  destroy() {
    this.hide();
    clearTimeout(this.fadeTimeout);
    
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    this.element = null;
    this.isVisible = false;
  }

  // Static method for quick usage
  static show(text = 'Loading...', options = {}) {
    const loader = new LoadingScreen(options);
    return loader.show(text);
  }
}

// Usage Examples:
/*
// Basic usage
const loader = new LoadingScreen();
loader.show('Loading...');
setTimeout(() => loader.hide(), 3000);

// With options
const customLoader = new LoadingScreen({
  text: 'Please wait...',
  spinnerType: 'spin',
  theme: 'light',
  fadeSpeed: 300
});

// Quick static usage
LoadingScreen.show('Fetching data...');

// Promise-based usage
async function loadData() {
  const loader = new LoadingScreen();
  loader.show('Loading data...');
  
  try {
    const data = await fetch('/api/data');
    loader.updateText('Processing...');
    // Process data
    return data;
  } finally {
    loader.hide();
  }
}
*/