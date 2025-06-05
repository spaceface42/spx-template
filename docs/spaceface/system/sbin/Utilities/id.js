export function generateId(prefix = 'id', length = 9) {
    return `${prefix}-${Math.random().toString(36).slice(2, 2 + length)}`;
}
