/**
 * Safe number conversion - returns 0 for any invalid input
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return fallback;
  return num;
}

/**
 * Safe division - returns 0 if divisor is 0 or result is invalid
 */
export function safeDivide(numerator: unknown, denominator: unknown, fallback: number = 0): number {
  const a = safeNumber(numerator);
  const b = safeNumber(denominator);
  if (b === 0) return fallback;
  const result = a / b;
  if (Number.isNaN(result) || !Number.isFinite(result)) return fallback;
  return result;
}

/**
 * Safe multiplication - returns 0 if result is invalid
 */
export function safeMultiply(a: unknown, b: unknown, fallback: number = 0): number {
  const numA = safeNumber(a);
  const numB = safeNumber(b);
  const result = numA * numB;
  if (Number.isNaN(result) || !Number.isFinite(result)) return fallback;
  return result;
}

/**
 * Safe addition - returns 0 if result is invalid
 */
export function safeAdd(...values: unknown[]): number {
  let sum = 0;
  for (const v of values) {
    sum += safeNumber(v);
  }
  return Number.isFinite(sum) ? sum : 0;
}

/**
 * Format currency for display - always returns valid string
 */
export function formatNaira(value: unknown): string {
  const num = safeNumber(value);
  return num.toLocaleString();
}

export function formatDollar(value: unknown): string {
  const num = safeNumber(value);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Safe percentage calculation
 */
export function safePercent(part: unknown, whole: unknown, fallback: number = 0): number {
  return safeDivide(part, whole, fallback) * 100;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
