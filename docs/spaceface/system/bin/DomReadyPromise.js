/**
 * DomReadyPromise
 *
 * Utility for DOM readiness and waiting for elements.
 */
export class DomReadyPromise {
    static #readyPromise = null;
    /**
     * Resolves once DOM is fully parsed.
     * @returns {Promise<void>}
     */
    static ready() {
        return (this.#readyPromise ||=
            document.readyState === "loading"
                ? new Promise((res) => document.addEventListener("DOMContentLoaded", () => res(), { once: true }))
                : Promise.resolve());
    }
    /**
     * Waits for one or more elements matching selector(s).
     * @param selectors - Single selector or array of selectors.
     * @param timeout - Max wait time in ms.
     * @param root - Optional root node (can be shadowRoot).
     * @param signal - Optional AbortSignal to cancel waiting.
     * @returns Promise<Element | Element[]>
     */
    static waitForElement(selectors, timeout = 5000, root = document, signal) {
        const isMultiple = Array.isArray(selectors);
        const selectorList = isMultiple ? selectors : [selectors];
        return new Promise((resolve, reject) => {
            const found = new Map();
            let aborted = false;
            const check = () => {
                let allFound = true;
                for (const sel of selectorList) {
                    const el = root.querySelector(sel);
                    if (el)
                        found.set(sel, el);
                    else
                        allFound = false;
                }
                if (allFound) {
                    cleanup();
                    resolve(isMultiple
                        ? selectorList.map((s) => found.get(s))
                        : found.get(selectorList[0]));
                }
            };
            const cleanup = () => {
                observer.disconnect();
                clearTimeout(timeoutId);
                if (signal)
                    signal.removeEventListener("abort", onAbort);
            };
            const onAbort = () => {
                aborted = true;
                cleanup();
                reject(new DOMException("waitForElement aborted", "AbortError"));
            };
            if (signal) {
                if (signal.aborted)
                    return onAbort();
                signal.addEventListener("abort", onAbort, { once: true });
            }
            check(); // initial
            const observer = new MutationObserver(check);
            observer.observe(root, { childList: true, subtree: true });
            const timeoutId = setTimeout(() => {
                cleanup();
                if (!aborted) {
                    reject(new Error(`Element(s) "${selectorList.join(", ")}" not found in ${timeout}ms`));
                }
            }, timeout);
        });
    }
}
