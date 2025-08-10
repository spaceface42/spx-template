export function generateId(prefix: string = 'id', length: number = 9): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 2 + length)}`;
}
