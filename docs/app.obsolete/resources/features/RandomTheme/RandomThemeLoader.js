// ThemeLoader.js

export class RandomThemeLoader {
  constructor(cssFiles) {
    if (!Array.isArray(cssFiles) || cssFiles.length === 0) {
      throw new Error('ThemeLoader requires a non-empty array of CSS file URLs.');
    }

    this.cssFiles = cssFiles;
    this.linkId = 'dynamic-theme-link';
  }

  loadRandomTheme() {
    const randomIndex = Math.floor(Math.random() * this.cssFiles.length);
    const selectedTheme = this.cssFiles[randomIndex];

    return this._injectStylesheet(selectedTheme);
  }

  _injectStylesheet(href) {
    return new Promise((resolve, reject) => {
      // Remove existing theme link if it exists
      const existingLink = document.getElementById(this.linkId);
      if (existingLink) {
        existingLink.remove();
      }

      const link = document.createElement('link');
      link.id = this.linkId;
      link.rel = 'stylesheet';
      link.href = href;
      
      // Add event listeners for Promise resolution
      link.onload = () => resolve(href);
      link.onerror = () => reject(new Error(`Failed to load theme: ${href}`));

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        document.head.appendChild(link);
      });
    });
  }
}