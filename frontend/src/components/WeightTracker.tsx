import { useState, useEffect, useRef } from 'react'
import type { User, WeightEntry, WeightChangeInfo } from '../types'
import WeightInput from './WeightInput'

interface WeightTrackerProps {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
  onSaveWeight: (userId: number, date: string, weight: number) => Promise<WeightChangeInfo>
}

function WeightTracker({ users, weights, dateColumns, onSaveWeight }: WeightTrackerProps) {
  const tableRef = useRef<HTMLDivElement>(null)
  const [weightChanges, setWeightChanges] = useState<Record<string, WeightChangeInfo>>({})

  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.scrollLeft = tableRef.current.scrollWidth
    }
  }, [dateColumns])

  const handleSaveWeight = async (userId: number, date: string, weight: number) => {
    try {
      const result = await onSaveWeight(userId, date, weight)
      const key = `${userId}-${date}`
      setWeightChanges(prev => ({
        ...prev,
        [key]: result
      }))
      return result
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
    return weightChanges[key] || null
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-4 h-screen overflow-hidden">
      <div className="h-full overflow-hidden">
        <div
          ref={tableRef}
          className="overflow-x-auto h-full"
          style={{ scrollbarWidth: 'thin' }}
        >
          <table className="border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="sticky-col border border-gray-300 dark:border-gray-600 p-2 text-left bg-gray-100 dark:bg-gray-800 min-w-[120px]">
                  <span className="text-gray-900 dark:text-gray-100 font-medium">Name</span>
                </th>
                {dateColumns.map((date) => (
                  <th
                    key={date}
                    className="weight-col border border-gray-300 dark:border-gray-600 p-2 text-center bg-gray-100 dark:bg-gray-800"
                  >
                    <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">
                      {formatDate(date)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td
                    className="sticky-col border border-gray-300 dark:border-gray-600 p-2 font-medium bg-white dark:bg-gray-900"
                    style={{ backgroundColor: user.color + '20' }}
                  >
                    <span className="text-gray-900 dark:text-gray-100">{user.name}</span>
                  </td>
                  {dateColumns.map((date) => (
                    <td
                      key={`${user.id}-${date}`}
                      className="weight-col border border-gray-300 dark:border-gray-600 p-1 text-center bg-white dark:bg-gray-900"
                    >
                      <WeightInput
                        userId={user.id}
                        date={date}
                        initialWeight={getWeightForUserAndDate(user.id, date)}
                        weightChangeInfo={getWeightChangeInfo(user.id, date)}
                        onSave={handleSaveWeight}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default WeightTracker