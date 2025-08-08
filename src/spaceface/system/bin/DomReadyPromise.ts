/**
 * DomReadyPromise
 *
 * Utility for DOM readiness and waiting for elements.
 */
export class DomReadyPromise {
    /** Cached promise for DOM ready state */
    static #readyPromise: Promise<void> | null = null;

    /**
     * Resolves once DOM is fully parsed.
     * @returns {Promise<void>}
     */
    static ready(): Promise<void> {
        return (this.#readyPromise ||= 
            document.readyState === "loading"
                ? new Promise<void>((resolve) =>
                    document.addEventListener("DOMContentLoaded", () => resolve(), { once: true })
                )
                : Promise.resolve()
        );
    }

    /**
     * Waits for one or more elements matching selector(s).
     * Resolves when found or rejects on timeout/abort.
     * @param selectors - Single selector or array of selectors.
     * @param timeout - Max wait time in ms (0 for no timeout).
     * @param root - Optional root node (can be shadowRoot).
     * @param signal - Optional AbortSignal to cancel waiting.
     * @returns Promise<Element | Element[]>
     */
    static waitForElement(
        selectors: string | string[],
        timeout = 5000,
        root: ParentNode = document,
        signal?: AbortSignal
    ): Promise<Element | Element[]> {
        const isMultiple = Array.isArray(selectors);
        const selectorList = isMultiple ? selectors : [selectors];
        const found = new Map<string, Element>();

        return new Promise((resolve, reject) => {
            let aborted = false;
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            let observer: MutationObserver | null = null;

            /** Cleanup resources */
            const cleanup = () => {
                observer?.disconnect();
                if (timeoutId) clearTimeout(timeoutId);
                signal?.removeEventListener("abort", onAbort);
            };

            /** Abort handler */
            const onAbort = () => {
                aborted = true;
                cleanup();
                reject(new DOMException("waitForElement aborted", "AbortError"));
            };

            /** Element check */
            const check = (): boolean => {
                let allFound = true;
                for (const sel of selectorList) {
                    try {
                        const el = root.querySelector(sel);
                        if (el) found.set(sel, el);
                        else allFound = false;
                    } catch (err) {
                        cleanup();
                        reject(new Error(`Invalid selector "${sel}": ${err}`));
                        return true; // stop checking
                    }
                }
                if (allFound) {
                    cleanup();
                    resolve(
                        isMultiple
                            ? selectorList.map(s => found.get(s)!)
                            : found.get(selectorList[0])!
                    );
                    return true;
                }
                return false;
            };

            // Attach abort handling
            if (signal) {
                if (signal.aborted) return onAbort();
                signal.addEventListener("abort", onAbort, { once: true });
            }

            // Immediate check before observing
            if (check()) return;

            // Observe DOM changes
            let scheduled = false;
            const scheduleCheck = () => {
                if (!scheduled) {
                    scheduled = true;
                    requestAnimationFrame(() => {
                        scheduled = false;
                        check();
                    });
                }
            };
            observer = new MutationObserver(scheduleCheck);
            observer.observe(root, { childList: true, subtree: true });

            // Timeout handling (unless timeout = 0)
            if (timeout > 0) {
                timeoutId = setTimeout(() => {
                    cleanup();
                    if (!aborted) {
                        reject(
                            new Error(
                                `Element(s) "${selectorList.join(", ")}" not found in ${timeout}ms`
                            )
                        );
                    }
                }, timeout);
            }
        });
    }
}
