/**
 * Modern HTML Partial Loader
 * Loads HTML partials marked with link[rel="partial"] tags
 * Uses fetch API, caching, and modern JavaScript features
 */
import { debounce } from "./timing.js";
import { DomReadyPromise } from "./DomReadyPromise.js";
import { eventBus } from "./EventBus.js";

type PartialLoaderOptions = {
    baseUrl?: string;
    timeout?: number;
    retryAttempts?: number;
    cacheEnabled?: boolean;
    debug?: boolean;
};

type PartialInfo = { id: string; url: string; container: HTMLElement };

export class PartialLoader {
    private cache = new Map<string, string>();
    private loadingPromises = new Map<string, Promise<any>>();
    private loadedPartials = new Map<string, boolean>();
    private options: Required<PartialLoaderOptions>;

    constructor(options: PartialLoaderOptions = {}) {
        this.options = {
            baseUrl: "",
            timeout: 10000,
            retryAttempts: 3,
            cacheEnabled: true,
            debug: false,
            ...options,
        };
    }

    logDebug(message: string, data: any = null) {
        if (this.options.debug) {
            console.log(`[PartialLoader DEBUG]: ${message}`, data);
        }
    }

    async init(
        container: ParentNode = document
    ): Promise<PromiseSettledResult<any>[]> {
        const partialLinks = this.findPartialLinks(container);
        if (partialLinks.length === 0) return [];

        this.logDebug("Initializing partials", partialLinks);

        const loadPromises = partialLinks.map((link) => this.loadPartial(link));
        const results = await Promise.allSettled(loadPromises);

        eventBus.emit("partials:allLoaded", { partials: partialLinks });
        this.logDebug("All partials loaded", results);

        return results;
    }

    findPartialLinks(container: ParentNode): HTMLLinkElement[] {
        return Array.from(
            container.querySelectorAll('link[rel="partial"][src]')
        ) as HTMLLinkElement[];
    }

    async loadPartial(
        linkElement: HTMLLinkElement
    ): Promise<{ success: boolean; url: string; cached: boolean }> {
        const src = linkElement.getAttribute("src");
        if (!src) {
            throw new Error("Partial link missing src attribute");
        }

        const url = this.resolveUrl(src);
        const cacheKey = url;

        try {
            if (this.loadingPromises.has(cacheKey)) {
                return await this.loadingPromises.get(cacheKey)!;
            }

            if (this.options.cacheEnabled && this.cache.has(cacheKey)) {
                const cachedHtml = this.cache.get(cacheKey)!;
                this.replaceElement(linkElement, cachedHtml);
                this.logDebug(`Loaded from cache: ${url}`);
                return { success: true, url, cached: true };
            }

            const loadingPromise = this.fetchPartial(url);
            this.loadingPromises.set(cacheKey, loadingPromise);

            const html = await loadingPromise;

            if (this.options.cacheEnabled) {
                this.cache.set(cacheKey, html);
            }

            this.replaceElement(linkElement, html);

            this.loadingPromises.delete(cacheKey);

            this.logDebug(`Partial loaded: ${url}`);
            eventBus.emit(`partial:loaded:${url}`, { url, linkElement });

            return { success: true, url, cached: false };
        } catch (error: any) {
            this.loadingPromises.delete(cacheKey);
            console.error(`Failed to load partial: ${url}`, error);
            this.handleError(linkElement, error);
            eventBus.emit(`partial:error:${url}`, { url, error });
            throw error;
        }
    }

    async loadPartials(partials: PartialInfo[]): Promise<void> {
        const promises = partials.map(async ({ id, url, container }) => {
            try {
                const response = await fetch(url);
                if (!response.ok)
                    throw new Error(`Failed to fetch partial: ${url}`);

                const html = await response.text();
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = html;

                // Give tempDiv a unique id
                tempDiv.id = `partial-${id}`;
                container.appendChild(tempDiv);

                // Wait for the element using its selector string
                await DomReadyPromise.waitForElement(`#partial-${id}`);

                this.executeScripts(tempDiv);

                this.loadedPartials.set(id, true);

                eventBus.emit(`partial:loaded:${id}`, { id, url, container });
            } catch (error: any) {
                console.error(`Error loading partial: ${url}`, error);
                eventBus.emit(`partial:error:${id}`, { id, url, error });
            }
        });

        await Promise.all(promises);
        eventBus.emit("partials:allLoaded", { partials });
    }

    async fetchPartial(url: string, attempt = 1): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.options.timeout
        );

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    Accept: "text/html",
                    "Cache-Control": "no-cache",
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const html = await response.text();

            if (!html.trim()) {
                throw new Error("Empty response received");
            }

            return html;
        } catch (error: any) {
            clearTimeout(timeoutId);

            if (
                attempt < this.options.retryAttempts &&
                (error.name === "AbortError" || error.name === "TypeError")
            ) {
                const delayTime = Math.min(Math.pow(2, attempt) * 100, 5000);
                this.logDebug(`Retrying fetch for ${url} (attempt ${attempt})`);
                await this.delay(delayTime);
                return this.fetchPartial(url, attempt + 1);
            }

            throw error;
        }
    }

    replaceElement(linkElement: Element, html: string): void {
        if (!(linkElement instanceof Element)) {
            throw new Error(
                "replaceElement: linkElement must be a DOM element"
            );
        }

        const htmlString = html.trim();
        if (!htmlString) return;

        const template = document.createElement("template");
        template.innerHTML = htmlString;

        linkElement.replaceWith(...template.content.childNodes);
    }

    executeScripts(partial: HTMLElement): void {
        const scripts = partial.querySelectorAll("script");
        scripts.forEach((script) => {
            const newScript = document.createElement("script");
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
            document.body.removeChild(newScript);
        });
    }

    handleError(linkElement: Element, error: Error): void {
        const errorElement = document.createElement("div");
        errorElement.className = "partial-error";
        errorElement.setAttribute("data-error", error.message);
        errorElement.innerHTML = `<!-- Partial load failed: ${error.message} -->`;
        if (linkElement.parentNode) {
            linkElement.parentNode.replaceChild(errorElement, linkElement);
        }
    }

    isPartialLoaded(id: string): boolean {
        return this.loadedPartials.has(id);
    }

    resolveUrl(src: string): string {
        if (
            src.startsWith("http://") ||
            src.startsWith("https://") ||
            src.startsWith("//")
        ) {
            return src;
        }

        const base = this.options.baseUrl.replace(/\/$/, "");
        const path = src.startsWith("/") ? src : `/${src}`;

        return base + path;
    }

    delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async preload(urls: string[]): Promise<PromiseSettledResult<void>[]> {
        const preloadPromises = urls.map(async (url) => {
            const resolvedUrl = this.resolveUrl(url);
            if (!this.cache.has(resolvedUrl)) {
                try {
                    const html = await this.fetchPartial(resolvedUrl);
                    if (this.options.cacheEnabled) {
                        this.cache.set(resolvedUrl, html);
                    }
                } catch (error) {
                    console.warn(
                        `Failed to preload partial: ${resolvedUrl}`,
                        error
                    );
                }
            }
        });

        return Promise.allSettled(preloadPromises);
    }

    watch(
        container: HTMLElement | Document = document.body
    ): MutationObserver | undefined {
        if (!window.MutationObserver) return;

        const debouncedInit = debounce(() => {
            this.init(container).catch(console.error);
        }, 100);

        const observer = new MutationObserver(debouncedInit);

        observer.observe(container, {
            childList: true,
            subtree: true,
        });

        return observer;
    }
}
