/**
 * Parses weight input supporting both comma and dot as decimal separators
 * @param input - The input string to parse
 * @returns The parsed number or null if invalid
 */
export function parseWeightInput(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null
  }

  // Trim whitespace
  const trimmed = input.trim()
  
  if (trimmed === '') {
    return null
  }

  // Replace comma with dot for decimal separator normalization
  const normalized = trimmed.replace(',', '.')
  
  // Check for valid number format (allow digits, single dot, optional leading/trailing spaces)
  // This regex allows: 123, 123.4, .5, 0.0, etc.
  const numberRegex = /^-?\d*\.?\d+$/
  
  if (!numberRegex.test(normalized)) {
    return null
  }

  const parsed = parseFloat(normalized)
  
  // Check if parsing resulted in a valid number
  if (isNaN(parsed)) {
    return null
  }

  // Round to one decimal place to match the application's precision
  return Math.round(parsed * 10) / 10
}

/**
 * Checks if a weight input represents a deletion request (explicit zero)
 * @param input - The input string to check
 * @returns True if the input represents zero
 */
export function isZeroWeight(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false
  }

  const trimmed = input.trim()
  const normalized = trimmed.replace(',', '.')
  
  return normalized === '0' || normalized === '0.0' || normalized === '0,0'
}

/**
 * Validates if a weight input is valid (positive number)
 * @param input - The input string to validate
 * @returns True if the input is a valid positive weight
 */
export function isValidWeight(input: string): boolean {
  const parsed = parseWeightInput(input)
  return parsed !== null && parsed > 0
}