export function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay = 300
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

export function throttle<T extends (...args: any[]) => void>(
    fn: T
): (...args: Parameters<T>) => void {
    let isThrottled = false;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (!isThrottled) {
            isThrottled = true;
            requestAnimationFrame(() => {
                fn.apply(this, args);
                isThrottled = false;
            });
        }
    };
}
