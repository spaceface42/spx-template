function generateId(prefix = 'id', length = 9) {
  return `${prefix}-${Math.random().toString(36).slice(2, 2 + length)}`;
}

function logMessage(level, ...args) {
  const styles = {
    info:  { emoji: '•', color: 'gray' },
    warn:  { emoji: '⚠️', color: 'orange' },
    error: { emoji: '❌', color: 'red' }
  };

  // Check if last arg is a config object
  const lastArg = args[args.length - 1];
  const hasConfig = typeof lastArg === 'object' &&
                   lastArg !== null &&
                   !Array.isArray(lastArg) &&
                   'production' in lastArg;

  // Extract config without modifying original args
  const config = hasConfig ? lastArg : { production: false };
  const messageArgs = hasConfig ? args.slice(0, -1) : args;

  // Skip info logs in production
  if (config.production && level === 'info') return;

  const message = messageArgs.join(' ');
  const { emoji, color } = styles[level] || styles.info;

  console.log(
    `%c[ spaceface ] %c${emoji} ${message}`,
    'color: gray; font-weight: normal;',
    `color: ${color}; font-weight: normal;`
  );
}

/**
 * Clamps a value between a minimum and maximum.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @returns {number} The clamped value.
 * @example
 * clamp(5, 1, 10); // 5
 * clamp(-2, 0, 8); // 0
 * clamp(12, 0, 8); // 8
 */
const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

/**
 * Performs linear interpolation between two numbers.
 * @param {number} a - The starting value.
 * @param {number} b - The target value.
 * @param {number} t - Interpolation factor, typically between 0 and 1.
 * @returns {number} The interpolated value.
 * @example
 * lerp(0, 10, 0.5); // 5
 * lerp(20, 30, 0.2); // 22
 */
const lerp = (a, b, t) => (1 - t) * a + t * b;

/**
 * Debounces a function, delaying its execution until after a specified delay
 * has elapsed since the last time it was invoked.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} A debounced version of the function.
 * @example
 * const debouncedSave = debounce(saveData, 300);
 * debouncedSave(data); // Will only execute after 300ms of inactivity
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Exporting utility functions for use in other modules.
export {
    generateId,
    clamp,
    lerp,
    logMessage,
    debounce
};
