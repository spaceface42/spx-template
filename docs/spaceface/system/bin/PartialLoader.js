import { debounce } from "./timing.js";
import { DomReadyPromise } from "./DomReadyPromise.js";
import { eventBus } from "./EventBus.js";
export class PartialLoader {
    cache = new Map();
    loadingPromises = new Map();
    loadedPartials = new Map();
    options;
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
    logDebug(msg, data) {
        if (this.options.debug)
            console.debug(`[PartialLoader] ${msg}`, data);
    }
    async init(container = document) {
        const links = Array.from(container.querySelectorAll('link[rel="partial"][src]'));
        if (!links.length)
            return [];
        this.logDebug("Found partial links", links);
        const results = await Promise.allSettled(links.map(link => this.loadPartial(link)));
        eventBus.emit("partials:allLoaded", { count: results.length });
        return results;
    }
    async loadPartial(link) {
        const src = link.getAttribute("src");
        if (!src)
            throw new Error("Partial link missing src");
        const url = this.resolveUrl(src);
        const cacheKey = url;
        try {
            if (this.loadingPromises.has(cacheKey))
                return await this.loadingPromises.get(cacheKey);
            if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
                this.insertHTML(link, this.cache.get(cacheKey));
                return { success: true, url, cached: true };
            }
            const promise = this.fetchPartial(url);
            this.loadingPromises.set(cacheKey, promise);
            const html = await promise;
            if (this.options.cacheEnabled)
                this.cache.set(cacheKey, html);
            this.insertHTML(link, html);
            eventBus.emit(`partial:loaded`, { url });
            return { success: true, url, cached: false };
        }
        catch (error) {
            this.showError(link, error);
            eventBus.emit(`partial:error`, { url, error });
            throw error;
        }
        finally {
            this.loadingPromises.delete(cacheKey);
        }
    }
    async loadPartials(partials) {
        await Promise.all(partials.map(async ({ id, url, container }) => {
            try {
                const html = await (await fetch(url)).text();
                const wrapper = document.createElement("div");
                wrapper.id = `partial-${id}`;
                wrapper.innerHTML = html;
                container.appendChild(wrapper);
                await DomReadyPromise.waitForElement(`#partial-${id}`);
                this.runScripts(wrapper);
                this.loadedPartials.set(id, true);
                eventBus.emit(`partial:loaded`, { id, url });
            }
            catch (error) {
                eventBus.emit(`partial:error`, { id, url, error });
            }
        }));
        eventBus.emit("partials:allLoaded", { count: partials.length });
    }
    async fetchPartial(url, attempt = 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.options.timeout);
        try {
            const res = await fetch(url, { signal: controller.signal, headers: { Accept: "text/html" } });
            clearTimeout(timeout);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const html = (await res.text()).trim();
            if (!html)
                throw new Error("Empty response");
            return html;
        }
        catch (err) {
            clearTimeout(timeout);
            if (attempt < this.options.retryAttempts) {
                await this.delay(Math.min(2 ** attempt * 100, 5000));
                return this.fetchPartial(url, attempt + 1);
            }
            throw err;
        }
    }
    insertHTML(replaceEl, html) {
        const template = document.createElement("template");
        template.innerHTML = html;
        replaceEl.replaceWith(...template.content.childNodes);
        this.runScripts(template.content);
    }
    runScripts(container) {
        container.querySelectorAll("script").forEach(script => {
            const s = document.createElement("script");
            if (script.src)
                s.src = script.src;
            else
                s.textContent = script.textContent;
            Array.from(script.attributes).forEach(attr => s.setAttribute(attr.name, attr.value));
            document.body.appendChild(s);
            document.body.removeChild(s);
        });
    }
    showError(el, error) {
        const div = document.createElement("div");
        div.className = "partial-error";
        div.textContent = `Partial load failed: ${error.message}`;
        el.replaceWith(div);
    }
    isPartialLoaded(id) {
        return this.loadedPartials.has(id);
    }
    resolveUrl(src) {
        if (/^(https?:)?\/\//.test(src))
            return src;
        return this.options.baseUrl.replace(/\/$/, "") + (src.startsWith("/") ? src : `/${src}`);
    }
    delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    watch(container = document.body) {
        if (!window.MutationObserver)
            return;
        const observer = new MutationObserver(debounce(() => this.init(container), 100));
        observer.observe(container, { childList: true, subtree: true });
        return observer;
    }
}
