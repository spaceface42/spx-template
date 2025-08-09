import { debounce } from "./timing.js";
import { DomReadyPromise } from "./DomReadyPromise.js";
import { eventBus } from "./EventBus.js";
export class PartialLoader {
    cache = new Map();
    loadingPromises = new Map();
    loadedPartials = new Map();
    options;
    maxCacheSize = 50; // LRU cache limit
    constructor(options = {}) {
        this.options = {
            baseUrl: "",
            timeout: 10_000,
            retryAttempts: 3,
            cacheEnabled: true,
            debug: false,
            ...options,
        };
    }
    logDebug(message, data) {
        if (this.options.debug) {
            console.debug(`[PartialLoader DEBUG]: ${message}`, data);
        }
    }
    async init(container = document) {
        const partialLinks = this.findPartialLinks(container);
        if (partialLinks.length === 0)
            return [];
        this.logDebug("Initializing partials", partialLinks);
        const loadPromises = partialLinks.map(link => this._loadPartialElement(link));
        const results = await Promise.allSettled(loadPromises);
        eventBus.emit("partials:allLoaded", { partials: partialLinks });
        this.logDebug("All partials loaded", results);
        return results;
    }
    async loadPartials(partials) {
        const promises = partials.map(async ({ id, url, container }) => {
            try {
                const tempDiv = document.createElement("div");
                tempDiv.id = `partial-${id}`;
                await this._loadPartialByUrl(url, tempDiv);
                container.appendChild(tempDiv);
                await DomReadyPromise.waitForElement(`#partial-${id}`);
                this.loadedPartials.set(id, true);
                eventBus.emit(`partial:loaded:${id}`, { id, url, container });
            }
            catch (error) {
                console.error(`Error loading partial: ${url}`, error);
                eventBus.emit(`partial:error:${id}`, { id, url, error });
            }
        });
        await Promise.all(promises);
        eventBus.emit("partials:allLoaded", { partials });
    }
    findPartialLinks(container) {
        return Array.from(container.querySelectorAll('link[rel="partial"][src]'));
    }
    async _loadPartialElement(linkElement) {
        const src = linkElement.getAttribute("src");
        if (!src)
            throw new Error("Partial link missing src attribute");
        const url = this.resolveUrl(src);
        try {
            await this._loadPartialByUrl(url, linkElement);
            return { success: true, url, cached: this.cache.has(url) };
        }
        catch (error) {
            this.handleError(linkElement, error);
            throw error;
        }
    }
    async _loadPartialByUrl(url, targetElement) {
        const cacheKey = url;
        // Already loading?
        if (this.loadingPromises.has(cacheKey)) {
            await this.loadingPromises.get(cacheKey);
            return;
        }
        // From cache
        if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
            this.replaceElement(targetElement, this.cache.get(cacheKey));
            this.logDebug(`Loaded from cache: ${url}`);
            return;
        }
        // Fetch new
        const loadingPromise = this.fetchPartial(url);
        this.loadingPromises.set(cacheKey, loadingPromise);
        const html = await loadingPromise;
        this.loadingPromises.delete(cacheKey);
        if (this.options.cacheEnabled) {
            this.addToCache(cacheKey, html);
        }
        this.replaceElement(targetElement, html);
        this.logDebug(`Partial loaded: ${url}`);
        eventBus.emit(`partial:loaded:${url}`, { url, targetElement });
    }
    async fetchPartial(url, attempt = 1) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { Accept: "text/html", "Cache-Control": "no-cache" },
            });
            clearTimeout(timeoutId);
            if (!response.ok)
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            const html = await response.text();
            if (!html.trim())
                throw new Error("Empty response received");
            return html;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (attempt < this.options.retryAttempts &&
                ((error instanceof DOMException && error.name === "AbortError") || error instanceof TypeError)) {
                const delayTime = Math.min(2 ** attempt * 100, 5000);
                this.logDebug(`Retrying fetch for ${url} (attempt ${attempt})`);
                await this.delay(delayTime);
                return this.fetchPartial(url, attempt + 1);
            }
            throw error;
        }
    }
    replaceElement(target, html) {
        const htmlString = html.trim();
        if (!htmlString)
            return;
        const template = document.createElement("template");
        template.innerHTML = htmlString;
        target.replaceWith(...template.content.childNodes);
        // Execute any scripts from the replaced content
        if (target.parentElement) {
            this.executeScripts(target.parentElement);
        }
    }
    executeScripts(container) {
        const scripts = container.querySelectorAll("script");
        scripts.forEach(oldScript => {
            const newScript = document.createElement("script");
            // Copy all attributes
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            // Inline script content
            if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.replaceWith(newScript);
        });
    }
    handleError(target, error) {
        const errorElement = document.createElement("div");
        errorElement.className = "partial-error";
        errorElement.dataset.error = error.message;
        errorElement.innerHTML = `<!-- Partial load failed: ${error.message} -->`;
        target.replaceWith(errorElement);
    }
    resolveUrl(src) {
        if (/^(https?:)?\/\//.test(src))
            return src;
        const base = this.options.baseUrl.replace(/\/$/, "");
        const path = src.startsWith("/") ? src : `/${src}`;
        return base + path;
    }
    addToCache(key, value) {
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, value);
    }
    isPartialLoaded(id) {
        return this.loadedPartials.has(id);
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async preload(urls) {
        const preloadPromises = urls.map(async (url) => {
            const resolvedUrl = this.resolveUrl(url);
            if (!this.cache.has(resolvedUrl)) {
                try {
                    const html = await this.fetchPartial(resolvedUrl);
                    if (this.options.cacheEnabled) {
                        this.addToCache(resolvedUrl, html);
                    }
                }
                catch (error) {
                    console.warn(`Failed to preload partial: ${resolvedUrl}`, error);
                }
            }
        });
        return Promise.allSettled(preloadPromises);
    }
    watch(container = document.body) {
        if (!window.MutationObserver)
            return;
        const debouncedInit = debounce(() => {
            this.init(container).catch(console.error);
        }, 100);
        const observer = new MutationObserver(debouncedInit);
        observer.observe(container, { childList: true, subtree: true });
        return observer;
    }
}
