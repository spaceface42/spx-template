/**
 * Modern HTML Partial Loader
 * Loads HTML partials marked with link[rel="partial"] tags
 * Uses fetch API, caching, and modern JavaScript features
 */
import { debounce } from '../usr/bin/timing.js';
import { DomReadyPromise } from './DomReadyPromise.js';
import { eventBus } from './EventBus.js';

export class PartialLoader {
    constructor(options = {}) {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.options = {
            baseUrl: '',
            timeout: 10000,
            retryAttempts: 3,
            cacheEnabled: true,
            debug: false, // Debugging flag
            ...options
        };
        this.loadedPartials = new Map(); // Track loaded partials by ID
    }

    /**
     * Log debug messages if debugging is enabled.
     * @param {string} message - The debug message.
     * @param {any} data - Additional data to log.
     */
    logDebug(message, data = null) {
        if (this.options.debug) {
            console.log(`[PartialLoader DEBUG]: ${message}`, data);
        }
    }

    /**
     * Initialize and load all partials in the document
     */
    async init(container = document) {
        const partialLinks = this.findPartialLinks(container);
        if (partialLinks.length === 0) return [];

        this.logDebug('Initializing partials', partialLinks);

        const loadPromises = partialLinks.map(link => this.loadPartial(link));
        const results = await Promise.allSettled(loadPromises);

        eventBus.emit('partials:allLoaded', { partials: partialLinks });
        this.logDebug('All partials loaded', results);

        return results;
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
                this.logDebug(`Loaded from cache: ${url}`);
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

            this.logDebug(`Partial loaded: ${url}`);
            eventBus.emit(`partial:loaded:${url}`, { url, linkElement });

            return { success: true, url, cached: false };

        } catch (error) {
            this.loadingPromises.delete(cacheKey);
            console.error(`Failed to load partial: ${url}`, error);
            this.handleError(linkElement, error);
            eventBus.emit(`partial:error:${url}`, { url, error });
            throw error;
        }
    }

    /**
     * Load multiple partials into their respective containers.
     * @param {Array<Object>} partials - Array of partials to load. Each partial should have { id, url, container }.
     */
    async loadPartials(partials) {
        const promises = partials.map(async ({ id, url, container }) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch partial: ${url}`);

                const html = await response.text();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                // Append the partial to the container
                container.appendChild(tempDiv);

                // Wait for the DOM of the partial to be fully loaded
                await DomReadyPromise.waitForElement(tempDiv);

                // Execute scripts inside the partial
                this.executeScripts(tempDiv);

                // Mark the partial as loaded
                this.loadedPartials.set(id, true);

                // Emit an event for the loaded partial
                eventBus.emit(`partial:loaded:${id}`, { id, url, container });
            } catch (error) {
                console.error(`Error loading partial: ${url}`, error);
                eventBus.emit(`partial:error:${id}`, { id, url, error });
            }
        });

        await Promise.all(promises); // Wait for all partials to load
        eventBus.emit('partials:allLoaded', { partials });
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
                const delayTime = Math.min(Math.pow(2, attempt) * 100, 5000); // Exponential backoff with max delay
                this.logDebug(`Retrying fetch for ${url} (attempt ${attempt})`);
                await this.delay(delayTime);
                return this.fetchPartial(url, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Replace link element with HTML content using modern methods
     */
    replaceElement(linkElement, html) {
        if (!(linkElement instanceof Element)) {
            throw new Error('replaceElement: linkElement must be a DOM element');
        }

        const htmlString = html.trim();
        if (!htmlString) return;

        const template = document.createElement('template');
        template.innerHTML = htmlString;

        linkElement.replaceWith(...template.content.childNodes);
    }


    /**
     * Execute scripts inside the fetched partial.
     * @param {HTMLElement} partial - The partial DOM element.
     */
    executeScripts(partial) {
        const scripts = partial.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
            document.body.removeChild(newScript); // Clean up after execution
        });
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
     * Check if a specific partial is loaded.
     * @param {string} id - The ID of the partial.
     * @returns {boolean} True if the partial is loaded, false otherwise.
     */
    isPartialLoaded(id) {
        return this.loadedPartials.has(id);
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
