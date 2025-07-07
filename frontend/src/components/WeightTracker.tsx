import { useState, useEffect, useRef } from "react"
import type { User, WeightEntry, WeightChangeInfo } from "../types"
import { WeightInput } from "./WeightInput"

interface WeightTrackerProps {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
  onSaveWeight: (userId: number, date: string, weight: number) => Promise<WeightChangeInfo>
  onDeleteWeight: (userId: number, date: string) => Promise<any>
}

function WeightTracker({ users, weights, dateColumns, onSaveWeight, onDeleteWeight }: WeightTrackerProps) {
  const tableRef = useRef<HTMLDivElement>(null)
  const [weightChanges, setWeightChanges] = useState<Record<string, WeightChangeInfo>>({})
  const hasScrolledRef = useRef(false)

  useEffect(() => {
    if (tableRef.current && !hasScrolledRef.current) {
      tableRef.current.scrollTop = 0
      hasScrolledRef.current = true
    }
  }, [dateColumns])

  const handleSaveWeight = async (userId: number, date: string, weight: number) => {
    try {
      const result = await onSaveWeight(userId, date, weight)
      const key = `${userId}-${date}`
      setWeightChanges((prev) => ({
        ...prev,
        [key]: result,
      }))
      return result
    } catch (error) {
      throw error
    }
  }

  const handleDeleteWeight = async (userId: number, date: string) => {
    try {
      await onDeleteWeight(userId, date)
      const key = `${userId}-${date}`
      setWeightChanges((prev) => {
        const newChanges = { ...prev }
        delete newChanges[key]
        return newChanges
      })
    } catch (error) {
      throw error
    }
  }

  const getWeightForUserAndDate = (userId: number, date: string): number | null => {
    const key = `${userId}-${date}`
    const weight = weights[key]
    return weight ? weight.weight_kg : null
  }

  const getWeightChangeInfo = (userId: number, date: string): WeightChangeInfo | null => {
    const key = `${userId}-${date}`

    // First check if we have it in our local state (from recent saves)
    if (weightChanges[key]) {
      return weightChanges[key]
    }

    // Otherwise, calculate it from the existing data
    const currentWeight = weights[key]
    if (!currentWeight) {
      return null
    }

    // Find the previous weight for this user
    const userWeights = Object.values(weights)
      .filter((w) => w.user_id === userId && w.date < date)
      .sort((a, b) => b.date.localeCompare(a.date))

    const previousWeight = userWeights[0] || null

    return {
      weight: currentWeight,
      previousWeight: previousWeight,
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const currentYear = new Date().getFullYear()
    const dateYear = date.getFullYear()
    const dayOfWeek = date.getDay()

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")

    // German weekday abbreviations
    const germanWeekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]

    let formattedDate = ""
    if (dateYear === currentYear) {
      formattedDate = `${day}.${month}`
    } else {
      const year = dateYear.toString().slice(-2)
      formattedDate = `${day}.${month}.${year}`
    }

    // If it's not Friday (day 5), prepend the German weekday
    if (dayOfWeek !== 5) {
      formattedDate = `${germanWeekdays[dayOfWeek]} ${formattedDate}`
    }

    return formattedDate
  }

  return (
    <div>
      <div>
        <div ref={tableRef} className="overflow-y-auto bg-white dark:bg-gray-800">
          <table className="table-auto relative overflow-x-auto">
            <thead>
              <tr>
                <th className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-4 text-left font-semibold"></th>
                {users.map((user, index) => (
                  <th
                    key={user.id}
                    className={`sticky top-0 z-10 w-[80px] min-w-[80px] max-w-[80px] p-4 text-center font-semibold ${
                      index % 2 === 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-blue-100 dark:bg-blue-800/20"
                    }`}
                  >
                    <span className="font-bold text-sm" style={{ color: user.color }}>
                      {user.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...dateColumns].reverse().map((date) => (
                <tr key={date}>
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-2 py-2 text-right">
                    <span className="text-gray-800 dark:text-white text-sm font-medium">{formatDate(date)}</span>
                  </td>
                  {users.map((user, userIndex) => (
                    <td
                      key={`${user.id}-${date}`}
                      className={`w-[80px] min-w-[80px] max-w-[80px] ${
                        userIndex % 2 === 0 ? "bg-blue-50 dark:bg-blue-900/20" : "bg-blue-100 dark:bg-blue-800/20"
                      }`}
                    >
                      <WeightInput
                        userId={user.id}
                        date={date}
                        initialWeight={getWeightForUserAndDate(user.id, date)}
                        weightChangeInfo={getWeightChangeInfo(user.id, date)}
                        onSave={handleSaveWeight}
                        onDelete={handleDeleteWeight}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>{" "}
      </div>
    </div>
  )
}

export default WeightTracker
