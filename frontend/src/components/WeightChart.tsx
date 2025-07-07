import { useState, useEffect } from "react"
import { LineChart } from "@mui/x-charts/LineChart"
import type { User, WeightEntry } from "../types"

interface WeightChartProps {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
}

export default function WeightChart({ users, weights, dateColumns }: WeightChartProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set(users.map((u) => u.id)))

  useEffect(() => {
    setSelectedUsers(new Set(users.map((u) => u.id)))
  }, [users])

  const toggleUser = (userId: number) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const currentYear = new Date().getFullYear()
    const dateYear = date.getFullYear()

    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")

    if (dateYear === currentYear) {
      return `${day}.${month}`
    } else {
      const year = dateYear.toString().slice(-2)
      return `${day}.${month}.${year}`
    }
  }

  // Prepare data for MUI X Charts
  const chartData = () => {
    const selectedUsersList = users.filter((user) => selectedUsers.has(user.id))

    // Create series data for each user
    const series = selectedUsersList.map((user) => {
      const userData = dateColumns.map((date) => {
        const key = `${user.id}-${date}`
        const weight = weights[key]
        return weight ? weight.weight_kg : null
      })

      return {
        id: user.id,
        label: user.name,
        data: userData,
        color: user.color,
        connectNulls: false,
      }
    })

    // Create x-axis labels
    const xLabels = dateColumns.map((date) => formatDate(date))

    return { series, xLabels }
  }

  const { series, xLabels } = chartData()

  const chartHeight = 400

  return (
    <div className="p-4">
      <div className="mb-6">
        {/* User toggle buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => toggleUser(user.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                selectedUsers.has(user.id)
                  ? "bg-opacity-100 text-white"
                  : "bg-opacity-20 text-gray-600 dark:text-gray-400"
              }`}
              style={{ backgroundColor: selectedUsers.has(user.id) ? user.color : `${user.color}33` }}
            >
              {user.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-gray-900 dark:text-white">
        <div style={{ width: "100%", height: chartHeight }}>
          {series.length > 0 ? (
            <LineChart
              height={chartHeight}
              series={series}
              xAxis={[
                {
                  scaleType: "point",
                  data: xLabels,
                  tickLabelStyle: {
                    fill: "currentColor",
                  },
                },
              ]}
              yAxis={[{ 
                position: "right", 
                width: 30,
                tickLabelStyle: {
                  fill: "currentColor",
                },
              }]}
              slotProps={{
                /* @ts-expect-error */
                legend: { hidden: true },
              }}
              sx={{
                '& .MuiChartsAxis-tickLabel': {
                  fill: 'currentColor',
                },
                '& .MuiChartsAxis-line': {
                  stroke: 'currentColor',
                },
                '& .MuiChartsAxis-tick': {
                  stroke: 'currentColor',
                },
                color: 'inherit',
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Keine Daten verfügbar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
