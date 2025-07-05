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
      tableRef.current.scrollLeft = tableRef.current.scrollWidth
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
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div>
      <div>
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Weight Tracker</h1>
        </div>
        <div ref={tableRef} className="overflow-x-auto bg-white dark:bg-gray-800">
          <table className="table-auto relative">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white dark:bg-gray-800"></th>
                {dateColumns.map((date) => (
                  <th
                    key={date}
                    className="w-[80px] min-w-[80px] max-w-[80px] p-4 text-center font-semibold border-r border-blue-500 last:border-r-0"
                  >
                    <span className="text-white text-sm">{formatDate(date)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800">
                    <span className="font-bold" style={{ color: user.color }}>
                      {user.name}
                    </span>
                  </td>
                  {dateColumns.map((date) => (
                    <td
                      key={`${user.id}-${date}`}
                      className="first:sticky w-[80px] min-w-[80px] max-w-[80px] border-r border-gray-200 dark:border-gray-600 last:border-r-0 bg-white dark:bg-gray-800"
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
