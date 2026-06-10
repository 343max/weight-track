import { useState, useEffect } from 'react'
import { LineChart } from '@mui/x-charts/LineChart'
import type { User, WeightEntry } from '../types'

interface WeightChartProps {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
}

export default function WeightChart({ users, weights, dateColumns }: WeightChartProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set(users.map((u) => u.id)))
  const [timeRange, setTimeRange] = useState<'all' | 'year' | '3months'>('all')

  useEffect(() => {
    setSelectedUsers(new Set(users.map((u) => u.id)))
  }, [users])

  const filteredDateColumns = (() => {
    if (timeRange === 'all') return dateColumns
    const now = new Date()
    const cutoff = new Date()
    if (timeRange === 'year') {
      cutoff.setFullYear(now.getFullYear() - 1)
    } else {
      cutoff.setMonth(now.getMonth() - 3)
    }
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return dateColumns.filter((date) => date >= cutoffStr)
  })()

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

    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')

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
      const userData = filteredDateColumns.map((date) => {
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
        showMark: true,
      }
    })

    // Create x-axis labels
    const xLabels = filteredDateColumns.map((date) => formatDate(date))

    return { series, xLabels }
  }

  const { series, xLabels } = chartData()

  const chartHeight = 400

  return (
    <div className="p-4">
      <div className="mb-6">
        {/* User toggle buttons + range selector */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedUsers.has(user.id)
                    ? 'bg-opacity-100 text-white'
                    : 'bg-opacity-20 text-gray-600 dark:text-gray-400'
                }`}
                style={{
                  backgroundColor: selectedUsers.has(user.id) ? user.color : `${user.color}33`,
                }}
              >
                {user.name}
              </button>
            ))}
          </div>
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 shrink-0">
            {(['all', 'year', '3months'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {range === 'all' ? 'Alle' : range === 'year' ? '1 Jahr' : '3 Monate'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm text-gray-900 dark:text-white">
        <div style={{ width: '100%', height: chartHeight }}>
          {series.length > 0 ? (
            <LineChart
              height={chartHeight}
              series={series}
              xAxis={[
                {
                  scaleType: 'point',
                  data: xLabels,
                  tickLabelStyle: {
                    fill: 'currentColor',
                  },
                },
              ]}
              yAxis={[
                {
                  position: 'right',
                  width: 30,
                  tickLabelStyle: {
                    fill: 'currentColor',
                  },
                },
              ]}
              slotProps={{
                /* @ts-expect-error */
                legend: { hidden: true },
              }}
              slots={{
                mark: (props) => <circle cx={props.x} cy={props.y} r={3} fill={props.color} />,
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
                '& .MuiChartsXAxis-line': {
                  stroke: 'currentColor',
                },
                '& .MuiChartsYAxis-line': {
                  stroke: 'currentColor',
                },
                '& .MuiChartsXAxis-tick': {
                  stroke: 'currentColor',
                },
                '& .MuiChartsYAxis-tick': {
                  stroke: 'currentColor',
                },
                '& .MuiChartsAxis-root': {
                  '& line': {
                    stroke: 'currentColor',
                  },
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
