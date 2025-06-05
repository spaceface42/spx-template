export const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
export const lerp = (a, b, t) => (1 - t) * a + t * b;
