import { useState, useEffect, useRef } from 'react'
import type { User, WeightEntry, WeightChangeInfo } from '../types'
import WeightInput from './WeightInput'

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

  const handleDeleteWeight = async (userId: number, date: string) => {
    try {
      await onDeleteWeight(userId, date)
      const key = `${userId}-${date}`
      setWeightChanges(prev => {
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
    <div className="p-6 h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="h-full overflow-hidden">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Weight Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your weekly progress with friends</p>
        </div>
        <div
          ref={tableRef}
          className="overflow-x-auto h-[calc(100%-120px)] rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          style={{ scrollbarWidth: 'thin' }}
        >
          <table className="border-collapse w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <th className="sticky-col p-4 text-left font-semibold min-w-[140px] bg-gradient-to-r from-blue-600 to-indigo-600 border-r border-blue-500">
                  <span className="text-white">Name</span>
                </th>
                {dateColumns.map((date) => (
                  <th
                    key={date}
                    className="weight-col p-4 text-center font-semibold min-w-[100px] border-r border-blue-500 last:border-r-0"
                  >
                    <span className="text-white text-sm">
                      {formatDate(date)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td
                    className="sticky-col p-4 font-semibold border-r border-gray-200 dark:border-gray-600"
                    style={{ 
                      backgroundColor: user.color + '30',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: user.color }}
                      ></div>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{user.name}</span>
                    </div>
                  </td>
                  {dateColumns.map((date) => (
                    <td
                      key={`${user.id}-${date}`}
                      className="weight-col border-r border-gray-200 dark:border-gray-600 last:border-r-0 bg-white dark:bg-gray-800"
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
        </div>
      </div>
    </div>
  )
}

export default WeightTracker