/**
 * DomReadyPromise
 * Utility for DOM readiness and waiting for elements.
 */
export class DomReadyPromise {
    static #readyPromise = null;
    static ready() {
        return this.#readyPromise ??= (document.readyState !== 'loading'
            ? Promise.resolve()
            : new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
            }));
    }
    static waitForElement(selectors, { timeout = 5000, root = document, signal } = {}) {
        const isMultiple = Array.isArray(selectors);
        const selectorList = isMultiple ? selectors : [selectors];
        const length = selectorList.length;
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
                const found = [];
                for (let i = 0; i < length; i++) {
                    const el = root.querySelector(selectorList[i]);
                    if (!el)
                        return false;
                    found.push(el);
                }
                resolveFound(found);
                return true;
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
                return; // already found, no need to observe
            observer.observe(root, { childList: true, subtree: true });
            if (timeout > 0 && timeout !== Infinity) {
                timeoutId = window.setTimeout(() => {
                    cleanup();
                    reject(new DOMException(`Element(s) "${selectorList.join(', ')}" not found in ${timeout}ms`, 'TimeoutError'));
                }, timeout);
            }
        });
    }
}
