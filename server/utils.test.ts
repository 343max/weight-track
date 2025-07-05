import { expect, describe, it } from "bun:test"
import { getLastFriday, getAllFridaysBetween, generateDateColumns } from "./utils"

describe("Date utilities", () => {
  describe("getLastFriday", () => {
    it("should return the same date if given date is Friday", () => {
      const friday = new Date("2025-07-04") // Friday
      expect(getLastFriday(friday)).toBe("2025-07-04")
    })

    it("should return previous Friday if given date is Saturday", () => {
      const saturday = new Date("2025-07-05") // Saturday
      expect(getLastFriday(saturday)).toBe("2025-07-04")
    })

    it("should return previous Friday if given date is Sunday", () => {
      const sunday = new Date("2024-07-07") // Sunday
      expect(getLastFriday(sunday)).toBe("2024-07-05")
    })

    it("should return previous Friday if given date is Monday", () => {
      const monday = new Date("2024-07-08") // Monday
      expect(getLastFriday(monday)).toBe("2024-07-05")
    })

    it("should return previous Friday if given date is Tuesday", () => {
      const tuesday = new Date("2024-07-09") // Tuesday
      expect(getLastFriday(tuesday)).toBe("2024-07-05")
    })

    it("should return previous Friday if given date is Wednesday", () => {
      const wednesday = new Date("2024-07-10") // Wednesday
      expect(getLastFriday(wednesday)).toBe("2024-07-05")
    })

    it("should return previous Friday if given date is Thursday", () => {
      const thursday = new Date("2024-07-11") // Thursday
      expect(getLastFriday(thursday)).toBe("2024-07-05")
    })
  })

  describe("getAllFridaysBetween", () => {
    it("should return all Fridays between two dates", () => {
      const result = getAllFridaysBetween("2024-07-01", "2024-07-15")
      expect(result).toEqual(["2024-07-05", "2024-07-12"])
    })

    it("should return empty array if no Fridays in range", () => {
      const result = getAllFridaysBetween("2024-07-06", "2024-07-10")
      expect(result).toEqual([])
    })

    it("should include Friday if it is the start date", () => {
      const result = getAllFridaysBetween("2024-07-05", "2024-07-10")
      expect(result).toEqual(["2024-07-05"])
    })

    it("should include Friday if it is the end date", () => {
      const result = getAllFridaysBetween("2024-07-01", "2024-07-05")
      expect(result).toEqual(["2024-07-05"])
    })
  })

  describe("generateDateColumns", () => {
    it("should generate columns from first entry date to current Friday", () => {
      // Test with actual current date (July 4, 2025 - Friday)
      const result = generateDateColumns("2025-05-30")
      expect(result).toEqual(["2025-05-30", "2025-06-06", "2025-06-13", "2025-06-20", "2025-06-27", "2025-07-04"])
    })

    it("should return just current Friday if no first entry date", () => {
      // Test with actual current date (July 4, 2025 - Friday)
      const result = generateDateColumns(null)
      expect(result).toEqual(["2025-07-04"])
    })
  })
})
