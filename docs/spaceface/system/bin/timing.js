/**
 * Creates a debounced function that delays invoking `func` until after `delay` milliseconds
 * have elapsed since the last time the debounced function was called.
 * @param func - The function to debounce.
 * @param delay - Delay in milliseconds.
 * @param immediate - If true, trigger the function on the leading edge, instead of the trailing.
 */
export function debounce(func, delay = 300, immediate = false) {
    let timeout;
    function debounced(...args) {
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            timeout = undefined;
            if (!immediate)
                func.apply(this, args);
        }, delay);
        if (callNow)
            func.apply(this, args);
    }
    debounced.cancel = () => {
        clearTimeout(timeout);
        timeout = undefined;
    };
    return debounced;
}
/**
 * Creates a throttled function that only invokes `func` at most once per every `delay` milliseconds.
 * @param func - The function to throttle.
 * @param delay - Delay in milliseconds.
 * @param options - Control leading/trailing invocation.
 */
export function throttle(func, delay = 100, options = {}) {
    const { leading = true, trailing = true } = options;
    let lastCall = 0;
    let timeout;
    let lastArgs;
    let lastThis;
    function invoke() {
        lastCall = leading ? Date.now() : 0;
        func.apply(lastThis, lastArgs);
        lastArgs = lastThis = undefined;
    }
    function throttled(...args) {
        const now = Date.now();
        if (!lastCall && !leading)
            lastCall = now;
        const remaining = delay - (now - lastCall);
        lastArgs = args;
        lastThis = this;
        if (remaining <= 0 || remaining > delay) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
            invoke();
        }
        else if (!timeout && trailing) {
            timeout = setTimeout(() => {
                timeout = undefined;
                if (trailing && lastArgs)
                    invoke();
            }, remaining);
        }
    }
    throttled.cancel = () => {
        clearTimeout(timeout);
        timeout = undefined;
        lastCall = 0;
        lastArgs = lastThis = undefined;
    };
    return throttled;
}
