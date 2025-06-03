export class PartialFetcher {
    /**
     * Loads HTML from a URL and injects it into the target element.
     * @param {string} url - The URL of the partial HTML.
     * @param {string} targetSelector - The selector for the container to inject into.
     * @returns {Promise<void>}
     */
    static async load(url, targetSelector) {
        const response = await fetch(url);
        const html = await response.text();
        const container = document.querySelector(targetSelector);
        if (container) {
            container.innerHTML = html;
        }
    }
}
