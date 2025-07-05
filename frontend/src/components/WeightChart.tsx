import { useState, useEffect, useRef } from "react"
import type { User, WeightEntry } from "../types"

interface WeightChartProps {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
}

export default function WeightChart({ users, weights, dateColumns }: WeightChartProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set(users.map(u => u.id)))
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)
  
  useEffect(() => {
    setSelectedUsers(new Set(users.map(u => u.id)))
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

  const getWeightData = (userId: number): Array<{ date: string; weight: number }> => {
    return dateColumns
      .map(date => {
        const key = `${userId}-${date}`
        const weight = weights[key]
        return weight ? { date, weight: weight.weight_kg } : null
      })
      .filter(Boolean) as Array<{ date: string; weight: number }>
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

  // Calculate chart dimensions and scales
  const pointWidth = 60 // Width per date point
  const chartWidth = Math.max(600, dateColumns.length * pointWidth)
  const chartHeight = 400
  const margin = { top: 20, right: 80, bottom: 40, left: 60 }
  const innerWidth = chartWidth - margin.left - margin.right
  const innerHeight = chartHeight - margin.top - margin.bottom

  // Get all weight values for scaling
  const allWeights = Object.values(weights).map(w => w.weight_kg)
  const minWeight = Math.min(...allWeights) * 0.98
  const maxWeight = Math.max(...allWeights) * 1.02

  // Create scales
  const xScale = (index: number) => (index / (dateColumns.length - 1)) * innerWidth
  const yScale = (weight: number) => innerHeight - ((weight - minWeight) / (maxWeight - minWeight)) * innerHeight

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Gewichtsverlauf</h2>
        
        {/* User toggle buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => toggleUser(user.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                selectedUsers.has(user.id)
                  ? 'bg-opacity-100 text-white'
                  : 'bg-opacity-20 text-gray-600 dark:text-gray-400'
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
          <svg width={chartWidth} height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Horizontal grid lines */}
            {Array.from({ length: 6 }, (_, i) => {
              const y = (i / 5) * innerHeight
              const weight = maxWeight - ((i / 5) * (maxWeight - minWeight))
              return (
                <g key={i}>
                  <line
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={-10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {weight.toFixed(1)}
                  </text>
                </g>
              )
            })}

            {/* Vertical grid lines and labels */}
            {dateColumns.map((date, index) => {
              const x = xScale(index)
              return (
                <g key={date}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={innerHeight}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={x}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    {formatDate(date)}
                  </text>
                </g>
              )
            })}

            {/* Data lines */}
            {users
              .filter(user => selectedUsers.has(user.id))
              .map(user => {
                const userData = getWeightData(user.id)
                if (userData.length < 2) return null

                const pathData = userData
                  .map((point, index) => {
                    const dateIndex = dateColumns.indexOf(point.date)
                    const x = xScale(dateIndex)
                    const y = yScale(point.weight)
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                  })
                  .join(' ')

                return (
                  <g key={user.id}>
                    {/* Line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={user.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Data points */}
                    {userData.map((point, index) => {
                      const dateIndex = dateColumns.indexOf(point.date)
                      const x = xScale(dateIndex)
                      const y = yScale(point.weight)
                      
                      return (
                        <circle
                          key={`${user.id}-${point.date}`}
                          cx={x}
                          cy={y}
                          r={4}
                          fill={user.color}
                          stroke="white"
                          strokeWidth={2}
                        >
                          <title>{`${user.name}: ${point.weight.toFixed(1)}kg (${formatDate(point.date)})`}</title>
                        </circle>
                      )
                    })}
                  </g>
                )
              })}
          </g>
        </svg>
        </div>
      </div>
    </div>
  )
}