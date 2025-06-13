export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

export function throttle(fn) {
    let isThrottled = false;
    return function throttled(...args) {
        if (!isThrottled) {
            isThrottled = true;
            requestAnimationFrame(() => {
                fn.apply(this, args);
                isThrottled = false;
            });
        }
    };
}
