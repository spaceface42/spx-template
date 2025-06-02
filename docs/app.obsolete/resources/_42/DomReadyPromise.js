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
}