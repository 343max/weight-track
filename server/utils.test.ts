import { expect, describe, it } from 'bun:test'
import { getLastFriday, getAllFridaysBetween, generateDateColumns, getWindowStart } from './utils'

describe('Date utilities', () => {
  describe('getLastFriday', () => {
    it('should return the same date if given date is Friday', () => {
      const friday = new Date('2025-07-04') // Friday
      expect(getLastFriday(friday)).toBe('2025-07-04')
    })

    it('should return previous Friday if given date is Saturday', () => {
      const saturday = new Date('2025-07-05') // Saturday
      expect(getLastFriday(saturday)).toBe('2025-07-04')
    })

    it('should return previous Friday if given date is Sunday', () => {
      const sunday = new Date('2024-07-07') // Sunday
      expect(getLastFriday(sunday)).toBe('2024-07-05')
    })

    it('should return previous Friday if given date is Monday', () => {
      const monday = new Date('2024-07-08') // Monday
      expect(getLastFriday(monday)).toBe('2024-07-05')
    })

    it('should return previous Friday if given date is Tuesday', () => {
      const tuesday = new Date('2024-07-09') // Tuesday
      expect(getLastFriday(tuesday)).toBe('2024-07-05')
    })

    it('should return previous Friday if given date is Wednesday', () => {
      const wednesday = new Date('2024-07-10') // Wednesday
      expect(getLastFriday(wednesday)).toBe('2024-07-05')
    })

    it('should return previous Friday if given date is Thursday', () => {
      const thursday = new Date('2024-07-11') // Thursday
      expect(getLastFriday(thursday)).toBe('2024-07-05')
    })
  })

  describe('getWindowStart', () => {
    it('should return previous Friday when end date is Friday and window is 1 week', () => {
      // 2025-07-04 is a Friday
      const result = getWindowStart('2025-07-04', 1)
      expect(result).toBe('2025-06-27') // previous Friday
    })

    it('should return 4 weeks before when window is 4 weeks', () => {
      const result = getWindowStart('2025-07-04', 4)
      expect(result).toBe('2025-06-06') // 4 Fridays back
    })

    it('should handle crossing month boundaries', () => {
      // 2025-03-07 is a Friday
      const result = getWindowStart('2025-03-07', 2)
      expect(result).toBe('2025-02-21') // crosses into February
    })

    it('should handle crossing year boundaries', () => {
      // 2025-01-10 is a Friday
      const result = getWindowStart('2025-01-10', 4)
      expect(result).toBe('2024-12-13') // crosses into December 2024
    })

    it('should return same date for 0 weeks', () => {
      const result = getWindowStart('2025-07-04', 0)
      expect(result).toBe('2025-07-04')
    })

    it('should handle 52 weeks (full year)', () => {
      // 2025-07-04 is a Friday, 52 weeks back is 2024-07-05 (also Friday)
      const result = getWindowStart('2025-07-04', 52)
      expect(result).toBe('2024-07-05')
    })

    it('should handle today being Friday with 1 week window', () => {
      // Use getLastFriday to get a real "today is Friday" date
      const today = new Date()
      const todayFriday = getLastFriday(today)
      const result = getWindowStart(todayFriday, 1)

      // Result should be exactly 7 days before
      const expected = new Date(todayFriday)
      expected.setDate(expected.getDate() - 7)
      expect(result).toBe(expected.toISOString().split('T')[0]!)
    })
  })

  describe('getAllFridaysBetween', () => {
    it('should return all Fridays between two dates', () => {
      const result = getAllFridaysBetween('2024-07-01', '2024-07-15')
      expect(result).toEqual(['2024-07-05', '2024-07-12'])
    })

    it('should return empty array if no Fridays in range', () => {
      const result = getAllFridaysBetween('2024-07-06', '2024-07-10')
      expect(result).toEqual([])
    })

    it('should include Friday if it is the start date', () => {
      const result = getAllFridaysBetween('2024-07-05', '2024-07-10')
      expect(result).toEqual(['2024-07-05'])
    })

    it('should include Friday if it is the end date', () => {
      const result = getAllFridaysBetween('2024-07-01', '2024-07-05')
      expect(result).toEqual(['2024-07-05'])
    })
  })

  describe('generateDateColumns', () => {
    it('should return just current Friday for empty input', () => {
      const result = generateDateColumns([])
      expect(result.length).toBe(1)
      // The single date should be a valid ISO date string
      expect(result[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should include the existing date in the result', () => {
      const result = generateDateColumns(['2020-01-03'])
      expect(result[0]).toBe('2020-01-03')
      // Should have generated Fridays from 2020-01-03 up to current Friday
      expect(result.length).toBeGreaterThan(1)
    })

    it('should not duplicate existing dates', () => {
      const result = generateDateColumns(['2020-01-03', '2020-01-10'])
      expect(result[0]).toBe('2020-01-03')
      expect(result[1]).toBe('2020-01-10')
    })
  })
})
