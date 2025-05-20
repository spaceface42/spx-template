// Place this at the very top of your file, before any class definitions
/**
 * Clamps a value between a minimum and maximum.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @returns {number} The clamped value.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}