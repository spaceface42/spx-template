/**
 * Utility class for waiting until the DOM is fully parsed and ready.
 * Usage:
 *   await DomReady.ready();
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