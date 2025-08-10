import { WaitForElementOptions, WaitForElementResult } from '../types/bin.js';

/**
 * DomReadyPromise
 * Utility for DOM readiness and waiting for elements.
 */
export class DomReadyPromise {
    static #readyPromise: Promise<void> | null = null;

    static ready(): Promise<void> {
        return this.#readyPromise ??= (
            document.readyState !== 'loading'
                ? Promise.resolve()
                : new Promise<void>(resolve => {
                    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
                })
        );
    }

    static waitForElement<T extends Element>(
        selector: string,
        options?: WaitForElementOptions
    ): Promise<T>;
    static waitForElement<T extends Element>(
        selectors: string[],
        options?: WaitForElementOptions
    ): Promise<T[]>;
    static waitForElement<T extends Element>(
        selectors: string | string[],
        { timeout = 5000, root = document, signal }: WaitForElementOptions = {}
    ): Promise<T | T[]> {
        const isMultiple = Array.isArray(selectors);
        const selectorList = isMultiple ? selectors : [selectors];
        const length = selectorList.length;

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
                const found: T[] = [];
                for (let i = 0; i < length; i++) {
                    const el = root.querySelector<T>(selectorList[i]);
                    if (!el) return false;
                    found.push(el);
                }
                resolveFound(found);
                return true;
            };

            const onAbort = (): void => {
                cleanup();
                reject(new DOMException('waitForElement aborted', 'AbortError'));
            };

            if (signal) {
                if (signal.aborted) return onAbort();
                signal.addEventListener('abort', onAbort, { once: true });
            }

            if (check()) return; // already found, no need to observe

            observer.observe(root, { childList: true, subtree: true });

            if (timeout > 0 && timeout !== Infinity) {
                timeoutId = window.setTimeout(() => {
                    cleanup();
                    reject(new DOMException(
                        `Element(s) "${selectorList.join(', ')}" not found in ${timeout}ms`,
                        'TimeoutError'
                    ));
                }, timeout);
            }
        });
    }
}
