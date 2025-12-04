/**
 * Data Validation Utilities
 * 
 * Helper functions to ensure data is safe for display in components
 */

/**
 * Safely format a number, handling NaN, null, and undefined
 */
export function safeNumber(value: number | null | undefined, defaultValue: number = 0): number {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }
  return value;
}

/**
 * Safely format a number with toLocaleString, handling edge cases
 */
export function safeToLocaleString(
  value: number | null | undefined,
  defaultValue: string = '0'
): string {
  const safeValue = safeNumber(value, 0);
  try {
    return safeValue.toLocaleString();
  } catch {
    return defaultValue;
  }
}

/**
 * Safely format a number with toFixed, handling edge cases
 */
export function safeToFixed(
  value: number | null | undefined,
  decimals: number = 1,
  defaultValue: string = '0'
): string {
  const safeValue = safeNumber(value, 0);
  try {
    return safeValue.toFixed(decimals);
  } catch {
    return defaultValue;
  }
}

/**
 * Safely calculate percentage, handling division by zero
 */
export function safePercentage(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
  decimals: number = 1
): string {
  const num = safeNumber(numerator, 0);
  const den = safeNumber(denominator, 0);
  
  if (den === 0) {
    return '0';
  }
  
  const percentage = (num / den) * 100;
  return safeToFixed(percentage, decimals);
}

/**
 * Validate that a required field exists and is valid
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): T {
  if (value === null || value === undefined) {
    throw new Error(`Required field ${fieldName} is missing`);
  }
  return value;
}

/**
 * Check if a value is a valid number (not NaN, null, or undefined)
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && value !== null && value !== undefined;
}

