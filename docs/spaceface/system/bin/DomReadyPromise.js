/**
 * DomReadyPromise
 * Utility for DOM readiness and waiting for elements.
 */
export class DomReadyPromise {
    static #readyPromise = null;
    /**
     * Resolves once DOM is fully parsed.
     */
    static ready() {
        return this.#readyPromise ||= (document.readyState === 'loading'
            ? new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
            })
            : Promise.resolve());
    }
    /**
     * Waits for one or more elements matching selector(s).
     */
    static waitForElement(selectors, { timeout = 5000, root = document, signal } = {}) {
        const isMultiple = Array.isArray(selectors);
        const selectorList = isMultiple ? selectors : [selectors];
        return new Promise((resolve, reject) => {
            let timeoutId;
            const observer = new MutationObserver(() => check());
            const cleanup = () => {
                observer.disconnect();
                if (timeoutId !== undefined)
                    clearTimeout(timeoutId);
                if (signal)
                    signal.removeEventListener('abort', onAbort);
            };
            const resolveFound = (elements) => {
                cleanup();
                resolve(isMultiple ? elements : elements[0]);
            };
            const check = () => {
                const elements = selectorList.map(sel => root.querySelector(sel));
                if (elements.every((el) => Boolean(el))) {
                    resolveFound(elements);
                    return true;
                }
                return false;
            };
            const onAbort = () => {
                cleanup();
                reject(new DOMException('waitForElement aborted', 'AbortError'));
            };
            if (signal) {
                if (signal.aborted)
                    return onAbort();
                signal.addEventListener('abort', onAbort, { once: true });
            }
            if (check())
                return; // already found
            observer.observe(root, { childList: true, subtree: true });
            if (timeout > 0 && timeout !== Infinity) {
                timeoutId = window.setTimeout(() => {
                    cleanup();
                    reject(new Error(`Element(s) "${selectorList.join(', ')}" not found in ${timeout}ms`));
                }, timeout);
            }
        });
    }
}
