export class PartialFetcher {
    /**
     * Loads HTML from a URL and injects it into the target element safely.
     * @param {string} url - The URL of the partial HTML.
     * @param {string} targetSelector - The selector for the container to inject into.
     * @returns {Promise<void>}
     */
    static async load(url, targetSelector) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status}`);
            }

            const html = (await response.text()).trim();
            const container = document.querySelector(targetSelector);

            if (!container) {
                throw new Error(`Target container not found: ${targetSelector}`);
            }

            const template = document.createElement('template');
            template.innerHTML = html;

            container.replaceChildren(...template.content.childNodes);
        } catch (error) {
            console.error('[PartialFetcher]', error);
        }
    }
}
