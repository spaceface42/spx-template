// Place this at the very top of your file, before any class definitions
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
 * @function
 * @param {number} a - The starting value.
 * @param {number} b - The target value.
 * @param {number} n - Normalization factor, typically between 0 and 1.
 * @returns {number} - Result of the linear interpolation.
 */
const lerp = (a, b, n) => (1 - n) * a + n * b;

// Exporting utility functions for use in other modules.
export {
    clamp,
    lerp
};

