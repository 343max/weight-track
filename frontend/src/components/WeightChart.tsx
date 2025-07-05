import { useState, useEffect, useRef } from "react"
import { LineChart } from "@mui/x-charts/LineChart"
import type { User, WeightEntry } from "../types"

interface WeightChartProps {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
}

export default function WeightChart({ users, weights, dateColumns }: WeightChartProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set(users.map((u) => u.id)))
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)

  useEffect(() => {
    setSelectedUsers(new Set(users.map((u) => u.id)))
  }, [users])

  useEffect(() => {
    if (scrollContainerRef.current && !hasScrolledRef.current && dateColumns.length > 0) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth
      hasScrolledRef.current = true
    }
  }, [dateColumns])

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

  // Calculate chart width based on number of data points
  const pointWidth = 60
  const chartWidth = Math.max(600, dateColumns.length * pointWidth)
  const chartHeight = 400

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Gewichtsverlauf</h2>

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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div ref={scrollContainerRef} className="overflow-x-auto">
          <div style={{ width: chartWidth, height: chartHeight }}>
            {series.length > 0 ? (
              <LineChart
                width={chartWidth}
                height={chartHeight}
                series={series}
                xAxis={[
                  {
                    scaleType: "point",
                    data: xLabels,
                  },
                ]}
                yAxis={[
                  {
                    label: "Gewicht (kg)",
                  },
                ]}
                margin={{ left: 60, right: 30, top: 30, bottom: 60 }}
                grid={{ vertical: true, horizontal: true }}
                tooltip={{ trigger: "item" }}
                sx={{
                  "& .MuiChartsAxis-tickLabel": {
                    fontSize: "12px",
                    fill: "currentColor",
                  },
                  "& .MuiChartsAxis-label": {
                    fontSize: "14px",
                    fill: "currentColor",
                  },
                  "& .MuiChartsGrid-line": {
                    stroke: "#e5e7eb",
                    strokeDasharray: "2,2",
                  },
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
    </div>
  )
}
