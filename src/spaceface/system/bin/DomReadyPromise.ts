import { WaitForElementOptions, WaitForElementResult } from './types.js';

/**
 * DomReadyPromise
 * Utility for DOM readiness and waiting for elements.
 */
export class DomReadyPromise {
    static #readyPromise: Promise<void> | null = null;

    /**
     * Resolves once DOM is fully parsed.
     */
    static ready(): Promise<void> {
        return this.#readyPromise ||= (
            document.readyState === 'loading'
                ? new Promise<void>(resolve => {
                    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
                })
                : Promise.resolve()
        );
    }

    /**
     * Waits for one or more elements matching selector(s).
     */
    static waitForElement<T extends Element = Element>(
        selectors: string | string[],
        { timeout = 5000, root = document, signal }: WaitForElementOptions = {}
    ): WaitForElementResult<T> {
        const isMultiple = Array.isArray(selectors);
        const selectorList = isMultiple ? selectors : [selectors];

        return new Promise((resolve, reject) => {
            let timeoutId: number | undefined;
            const observer = new MutationObserver(() => check());

            const cleanup = (): void => {
                observer.disconnect();
                if (timeoutId !== undefined) clearTimeout(timeoutId);
                if (signal) signal.removeEventListener('abort', onAbort);
            };

            const resolveFound = (elements: T[]): void => {
                cleanup();
                resolve(isMultiple ? elements : elements[0]);
            };

            const check = (): boolean => {
                const elements = selectorList.map(sel => root.querySelector<T>(sel));
                if (elements.every((el): el is T => Boolean(el))) {
                    resolveFound(elements);
                    return true;
                }
                return false;
            };

            const onAbort = (): void => {
                cleanup();
                reject(new DOMException('waitForElement aborted', 'AbortError'));
            };

            if (signal) {
                if (signal.aborted) return onAbort();
                signal.addEventListener('abort', onAbort, { once: true });
            }

            if (check()) return; // already found

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
