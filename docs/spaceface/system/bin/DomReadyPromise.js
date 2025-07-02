/**
 * DomReadyPromise
 *
 * Utility for detecting DOM readiness or waiting for elements to appear.
 */
export class DomReadyPromise {
    static #readyPromise = null;

    /**
     * Resolves once DOM is fully parsed.
     * @returns {Promise<void>}
     */
    static ready() {
        return this.#readyPromise ||= (
            document.readyState === 'loading'
                ? new Promise(res => document.addEventListener('DOMContentLoaded', res, { once: true }))
                : Promise.resolve()
        );
    }

    /**
     * Waits for an element matching the selector.
     * @param {string} selector - CSS selector to find.
     * @param {number} timeout - Max wait time in ms.
     * @returns {Promise<Element>}
     */
    static waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);

            const timeoutId = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element "${selector}" not found in ${timeout}ms`));
            }, timeout);

            const observer = new MutationObserver(() => {
                const found = document.querySelector(selector);
                if (found) {
                    clearTimeout(timeoutId);
                    observer.disconnect();
                    resolve(found);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
}
