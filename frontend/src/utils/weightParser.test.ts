import { describe, it, expect } from 'bun:test'
import { parseWeightInput, isZeroWeight, isValidWeight } from './weightParser'

describe('parseWeightInput', () => {
  describe('valid inputs with dot decimal separator', () => {
    it('should parse integer values', () => {
      expect(parseWeightInput('72')).toBe(72.0)
      expect(parseWeightInput('100')).toBe(100.0)
      expect(parseWeightInput('0')).toBe(0.0)
    })

    it('should parse decimal values', () => {
      expect(parseWeightInput('72.5')).toBe(72.5)
      expect(parseWeightInput('100.25')).toBe(100.3) // Rounded to 1 decimal
      expect(parseWeightInput('0.1')).toBe(0.1)
      expect(parseWeightInput('0.05')).toBe(0.1) // Rounded to 1 decimal
    })

    it('should parse values with leading dot', () => {
      expect(parseWeightInput('.5')).toBe(0.5)
      expect(parseWeightInput('.25')).toBe(0.3) // Rounded to 1 decimal
    })
  })

  describe('valid inputs with comma decimal separator', () => {
    it('should parse integer values with comma context', () => {
      expect(parseWeightInput('72')).toBe(72.0)
    })

    it('should parse decimal values with comma', () => {
      expect(parseWeightInput('72,5')).toBe(72.5)
      expect(parseWeightInput('100,25')).toBe(100.3) // Rounded to 1 decimal
      expect(parseWeightInput('0,1')).toBe(0.1)
      expect(parseWeightInput('0,05')).toBe(0.1) // Rounded to 1 decimal
    })
  })

  describe('inputs with whitespace', () => {
    it('should handle leading and trailing whitespace', () => {
      expect(parseWeightInput(' 72.5 ')).toBe(72.5)
      expect(parseWeightInput('  100,25  ')).toBe(100.3)
      expect(parseWeightInput('\t72\t')).toBe(72.0)
    })
  })

  describe('invalid inputs', () => {
    it('should return null for empty or whitespace-only strings', () => {
      expect(parseWeightInput('')).toBe(null)
      expect(parseWeightInput('   ')).toBe(null)
      expect(parseWeightInput('\t\n')).toBe(null)
    })

    it('should return null for non-numeric strings', () => {
      expect(parseWeightInput('abc')).toBe(null)
      expect(parseWeightInput('72kg')).toBe(null)
      expect(parseWeightInput('weight')).toBe(null)
    })

    it('should return null for invalid number formats', () => {
      expect(parseWeightInput('72.5.1')).toBe(null) // Multiple dots
      expect(parseWeightInput('72,5,1')).toBe(null) // Multiple commas
      expect(parseWeightInput('72.5,1')).toBe(null) // Both separators
      expect(parseWeightInput('.')).toBe(null) // Just a dot
      expect(parseWeightInput(',')).toBe(null) // Just a comma
    })

    it('should return null for null/undefined inputs', () => {
      expect(parseWeightInput(null as any)).toBe(null)
      expect(parseWeightInput(undefined as any)).toBe(null)
    })
  })

  describe('edge cases', () => {
    it('should handle very small numbers', () => {
      expect(parseWeightInput('0.01')).toBe(0.0) // Rounded to 1 decimal
      expect(parseWeightInput('0,01')).toBe(0.0) // Rounded to 1 decimal
    })

    it('should handle large numbers', () => {
      expect(parseWeightInput('999.9')).toBe(999.9)
      expect(parseWeightInput('1000,1')).toBe(1000.1)
    })
  })
})

describe('isZeroWeight', () => {
  it('should return true for explicit zero values', () => {
    expect(isZeroWeight('0')).toBe(true)
    expect(isZeroWeight('0.0')).toBe(true)
    expect(isZeroWeight('0,0')).toBe(true)
  })

  it('should return true for zero with whitespace', () => {
    expect(isZeroWeight(' 0 ')).toBe(true)
    expect(isZeroWeight(' 0.0 ')).toBe(true)
    expect(isZeroWeight(' 0,0 ')).toBe(true)
  })

  it('should return false for non-zero values', () => {
    expect(isZeroWeight('1')).toBe(false)
    expect(isZeroWeight('0.1')).toBe(false)
    expect(isZeroWeight('0,1')).toBe(false)
    expect(isZeroWeight('72.5')).toBe(false)
  })

  it('should return false for invalid inputs', () => {
    expect(isZeroWeight('')).toBe(false)
    expect(isZeroWeight('abc')).toBe(false)
    expect(isZeroWeight(null as any)).toBe(false)
    expect(isZeroWeight(undefined as any)).toBe(false)
  })
})

describe('isValidWeight', () => {
  it('should return true for positive numbers', () => {
    expect(isValidWeight('72')).toBe(true)
    expect(isValidWeight('72.5')).toBe(true)
    expect(isValidWeight('72,5')).toBe(true)
    expect(isValidWeight('0.1')).toBe(true)
    expect(isValidWeight('0,1')).toBe(true)
  })

  it('should return false for zero', () => {
    expect(isValidWeight('0')).toBe(false)
    expect(isValidWeight('0.0')).toBe(false)
    expect(isValidWeight('0,0')).toBe(false)
  })

  it('should return false for negative numbers', () => {
    expect(isValidWeight('-1')).toBe(false)
    expect(isValidWeight('-72.5')).toBe(false)
  })

  it('should return false for invalid inputs', () => {
    expect(isValidWeight('')).toBe(false)
    expect(isValidWeight('abc')).toBe(false)
    expect(isValidWeight('72kg')).toBe(false)
    expect(isValidWeight(null as any)).toBe(false)
  })
})

describe('integration scenarios', () => {
  it('should handle typical user input scenarios', () => {
    // European user typing weight
    expect(parseWeightInput('75,2')).toBe(75.2)
    expect(isValidWeight('75,2')).toBe(true)
    expect(isZeroWeight('75,2')).toBe(false)

    // US user typing weight
    expect(parseWeightInput('75.2')).toBe(75.2)
    expect(isValidWeight('75.2')).toBe(true)
    expect(isZeroWeight('75.2')).toBe(false)

    // User typing zero for deletion
    expect(parseWeightInput('0')).toBe(0.0)
    expect(isValidWeight('0')).toBe(false)
    expect(isZeroWeight('0')).toBe(true)

    // User making typos
    expect(parseWeightInput('7a2')).toBe(null)
    expect(isValidWeight('7a2')).toBe(false)
    expect(isZeroWeight('7a2')).toBe(false)
  })
})