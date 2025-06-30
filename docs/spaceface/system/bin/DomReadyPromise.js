/**
 * DomReadyPromise
 *
 * Utility class for waiting until the DOM is fully parsed and ready,
 * or until a specific element appears in the DOM.
 */
export class DomReadyPromise {
    static #readyPromise = null;

    /**
     * Returns a cached Promise that resolves when the DOM is ready.
     * @returns {Promise<void>}
     */
    static ready() {
        if (this.#readyPromise) return this.#readyPromise;

        if (document.readyState === 'loading') {
            this.#readyPromise = new Promise(resolve =>
                document.addEventListener('DOMContentLoaded', resolve, { once: true })
            );
        } else {
            this.#readyPromise = Promise.resolve();
        }

        return this.#readyPromise;
    }

    /**
     * Waits for an element matching the selector to appear in the DOM.
     * Resolves with the element, or rejects if not found within the timeout.
     *
     * @param {string} selector - CSS selector to wait for.
     * @param {number} [timeout=5000] - Max time to wait (ms).
     * @returns {Promise<Element>} Resolves with the found element.
     */
    static waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const initial = document.querySelector(selector);
            if (initial) return resolve(initial);

            let observer;
            let timeoutId = setTimeout(() => {
                if (observer) observer.disconnect();
                reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
            }, timeout);

            observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    clearTimeout(timeoutId);
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
}
