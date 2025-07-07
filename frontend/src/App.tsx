import { useState, useEffect } from "react"
import WeightTable from "./components/WeightTable"
import WeightChart from "./components/WeightChart"
import Export from "./components/Export"
import type { User, WeightEntry } from "./types"

// Cookie utility functions
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

const getCookie = (name: string): string | null => {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    if (c) {
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
  }
  return null
}

const getSecret = (): string | null => {
  // First check URL parameter
  const urlSecret = new URLSearchParams(window.location.search).get("secret")
  if (urlSecret) {
    // Store in cookie for 1 year
    setCookie("weight_tracker_secret", urlSecret, 365)
    return urlSecret
  }
  
  // Fallback to cookie
  return getCookie("weight_tracker_secret")
}

interface AppData {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
}

function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"zahlen" | "grafiken" | "export">("zahlen")
  const [chartKey, setChartKey] = useState(0)

  const fetchData = async () => {
    try {
      const secret = getSecret()
      if (!secret) {
        throw new Error("Secret parameter is required")
      }

      const response = await fetch(`/api/data?secret=${secret}`)
      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }

      const appData = await response.json()
      setData(appData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const saveWeight = async (userId: number, date: string, weight: number) => {
    try {
      const secret = getSecret()
      if (!secret) {
        throw new Error("Secret parameter is required")
      }

      const response = await fetch(`/api/weight?secret=${secret}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          date,
          weight,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save weight")
      }

      const result = await response.json()
      
      // Refresh data to show updated value immediately
      await fetchData()
      
      return result
    } catch (err) {
      throw err
    }
  }

  const deleteWeight = async (userId: number, date: string) => {
    try {
      const secret = getSecret()
      if (!secret) {
        throw new Error("Secret parameter is required")
      }

      const response = await fetch(`/api/weight?secret=${secret}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          date,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete weight")
      }

      // Refresh data to show updated value immediately
      await fetchData()

      return await response.json()
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-lg text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-300">No data available</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Tab Bar */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab("zahlen")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "zahlen"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Zahlen
          </button>
          <button
            onClick={() => {
              setActiveTab("grafiken")
              setChartKey(prev => prev + 1)
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "grafiken"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Grafiken
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "export"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Export
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "zahlen" ? (
          <WeightTable
            users={data.users}
            weights={data.weights}
            dateColumns={data.dateColumns}
            onSaveWeight={saveWeight}
            onDeleteWeight={deleteWeight}
          />
        ) : activeTab === "grafiken" ? (
          <WeightChart
            key={chartKey}
            users={data.users}
            weights={data.weights}
            dateColumns={data.dateColumns}
          />
        ) : (
          <Export
            users={data.users}
            weights={data.weights}
            dateColumns={data.dateColumns}
          />
        )}
      </div>
    </div>
  )
}

export default App
