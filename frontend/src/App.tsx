import { useState, useEffect, useRef } from "react"
import WeightTracker from "./components/WeightTracker"
import type { User, WeightEntry } from "./types"

interface AppData {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
}

function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const fetchData = async () => {
    try {
      const secret = new URLSearchParams(window.location.search).get("secret")
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
      const secret = new URLSearchParams(window.location.search).get("secret")
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
      return result
    } catch (err) {
      throw err
    }
  }

  const deleteWeight = async (userId: number, date: string) => {
    try {
      const secret = new URLSearchParams(window.location.search).get("secret")
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

      return await response.json()
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchData()

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.hostname}:8080`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("WebSocket connected")
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === "weight_updated" || message.type === "weight_deleted") {
        fetchData()
      }
    }

    ws.onclose = () => {
      console.log("WebSocket disconnected")
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
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
      <WeightTracker
        users={data.users}
        weights={data.weights}
        dateColumns={data.dateColumns}
        onSaveWeight={saveWeight}
        onDeleteWeight={deleteWeight}
      />
    </div>
  )
}

export default App
