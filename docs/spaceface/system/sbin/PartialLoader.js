/**
 * Modern HTML Partial Loader
 * Loads HTML partials marked with link[rel="partial"] tags
 * Uses fetch API, caching, and modern JavaScript features
 */
import { debounce } from './Utilities.js';

export class PartialLoader {
  constructor(options = {}) {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.options = {
      baseUrl: '',
      timeout: 10000,
      retryAttempts: 2,
      cacheEnabled: true,
      ...options
    };
  }

  /**
   * Initialize and load all partials in the document
   */
  async init(container = document) {
    const partialLinks = this.findPartialLinks(container);
    if (partialLinks.length === 0) return [];

    const loadPromises = partialLinks.map(link => this.loadPartial(link));
    return Promise.allSettled(loadPromises);
  }

  /**
   * Find all partial link elements
   */
  findPartialLinks(container) {
    return Array.from(container.querySelectorAll('link[rel="partial"][src]'));
  }

  /**
   * Load a single partial
   */
  async loadPartial(linkElement) {
    const src = linkElement.getAttribute('src');
    if (!src) {
      throw new Error('Partial link missing src attribute');
    }

    const url = this.resolveUrl(src);
    const cacheKey = url;

    try {
      // Check if already loading to prevent duplicate requests
      if (this.loadingPromises.has(cacheKey)) {
        return await this.loadingPromises.get(cacheKey);
      }

      // Check cache first
      if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
        const cachedHtml = this.cache.get(cacheKey);
        this.replaceElement(linkElement, cachedHtml);
        return { success: true, url, cached: true };
      }

      // Create loading promise
      const loadingPromise = this.fetchPartial(url);
      this.loadingPromises.set(cacheKey, loadingPromise);

      const html = await loadingPromise;
      
      // Cache the result
      if (this.options.cacheEnabled) {
        this.cache.set(cacheKey, html);
      }

      // Replace the link element with the loaded content
      this.replaceElement(linkElement, html);

      // Clean up loading promise
      this.loadingPromises.delete(cacheKey);

      return { success: true, url, cached: false };

    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      console.error(`Failed to load partial: ${url}`, error);
      this.handleError(linkElement, error);
      throw error;
    }
  }

  /**
   * Fetch partial content with timeout and retry logic
   */
  async fetchPartial(url, attempt = 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'text/html',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      if (!html.trim()) {
        throw new Error('Empty response received');
      }

      return html;

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Retry on network errors
      if (attempt < this.options.retryAttempts && 
          (error.name === 'AbortError' || error.name === 'TypeError')) {
        await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
        return this.fetchPartial(url, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Replace link element with HTML content using modern methods
   */
  replaceElement(linkElement, html) {
    // Method 1: Modern replaceWith() - cleanest approach
    if (linkElement.replaceWith) {
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      linkElement.replaceWith(...template.content.childNodes);
      return;
    }

    // Fallback: Legacy method for older browsers
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    linkElement.parentNode.replaceChild(template.content, linkElement);
  }

  /**
   * Alternative: Replace using insertAdjacentHTML (fastest)
   */
  replaceElementFast(linkElement, html) {
    linkElement.insertAdjacentHTML('beforebegin', html);
    linkElement.remove();
  }

  /**
   * Handle loading errors
   */
  handleError(linkElement, error) {
    const errorElement = document.createElement('div');
    errorElement.className = 'partial-error';
    errorElement.setAttribute('data-error', error.message);
    errorElement.innerHTML = `<!-- Partial load failed: ${error.message} -->`;
    linkElement.parentNode.replaceChild(errorElement, linkElement);
  }

  /**
   * Resolve relative URLs
   */
  resolveUrl(src) {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      return src;
    }
    
    const base = this.options.baseUrl.replace(/\/$/, '');
    const path = src.startsWith('/') ? src : `/${src}`;
    
    return base + path;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Preload partials (useful for performance optimization)
   */
  async preload(urls) {
    const preloadPromises = urls.map(async url => {
      const resolvedUrl = this.resolveUrl(url);
      if (!this.cache.has(resolvedUrl)) {
        try {
          const html = await this.fetchPartial(resolvedUrl);
          if (this.options.cacheEnabled) {
            this.cache.set(resolvedUrl, html);
          }
        } catch (error) {
          console.warn(`Failed to preload partial: ${resolvedUrl}`, error);
        }
      }
    });

    return Promise.allSettled(preloadPromises);
  }

  /**
   * Watch for new partials added to the DOM
   */
  watch(container = document.body) {
    if (!window.MutationObserver) return;

    const debouncedInit = debounce(() => {
        this.init(container).catch(console.error);
    }, 100);

    const observer = new MutationObserver(debouncedInit);

    observer.observe(container, {
        childList: true,
        subtree: true
    });

    return observer;
  }
}

// Universal export - works in both ESM and non-ESM environments
if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = PartialLoader;
} else if (typeof window !== 'undefined') {
  // Browser global
  window.PartialLoader = PartialLoader;
}
