/**
 * DomReadyPromise
 *
 * Utility class for waiting until the DOM is fully parsed and ready,
 * or for waiting until a specific element appears in the DOM.
 *
 * @example
 * // Wait for DOM ready
 * await DomReadyPromise.ready();
 *
 * // Wait for a specific element to appear (with timeout)
 * const el = await DomReadyPromise.waitForElement('#my-element', 3000);
 */
export class DomReadyPromise {
    /**
     * Returns a Promise that resolves when the DOM is ready.
     * @returns {Promise<void>}
     */
    static ready() {
        if (document.readyState === 'loading') {
            return new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
            });
        }
        // DOM is already ready
        return Promise.resolve();
    }

    /**
     * Waits for an element matching the selector to appear in the DOM.
     * Resolves with the element, or rejects if not found within the timeout.
     *
     * @param {string} selector - CSS selector for the element to wait for.
     * @param {number} [timeout=5000] - Timeout in milliseconds.
     * @returns {Promise<Element>} Resolves with the found element.
     * @throws {Error} If the element does not appear within the timeout.
     */
    static waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            let timeoutId;
            let observer;

            const cleanup = () => {
                if (observer) observer.disconnect();
                if (timeoutId) clearTimeout(timeoutId);
            };

            timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);

            observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    cleanup();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
}