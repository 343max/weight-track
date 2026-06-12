import { useState, useEffect } from 'react'
import WeightTable from './components/WeightTable'
import WeightChart from './components/WeightChart'
import Ranking from './components/Ranking'
import Export from './components/Export'
import PasswordChange from './components/PasswordChange'
import LoginForm from './components/LoginForm'
import DebugShare from './components/DebugShare'
import type { User, WeightEntry } from './types'

interface AppData {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
}

function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tabs = ['zahlen', 'ranking', 'grafiken', 'export', 'password', 'debug'] as const
  type Tab = (typeof tabs)[number]

  const getTabFromHash = (): Tab => {
    const hash = window.location.hash.slice(1)
    return tabs.includes(hash as Tab) ? (hash as Tab) : 'zahlen'
  }

  const [activeTab, setActiveTab] = useState<Tab>(getTabFromHash)
  const [chartKey, setChartKey] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/data', {
        credentials: 'include',
      })

      if (response.status === 401) {
        setIsAuthenticated(false)
        setLoading(false)
        return false
      }

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const appData = await response.json()
      setData(appData)
      setError(null)
      setIsAuthenticated(true)
      setLoading(false)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
      return false
    }
  }

  const fetchData = async () => {
    if (!isAuthenticated) return

    try {
      const response = await fetch('/api/data', {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false)
          return
        }
        throw new Error('Failed to fetch data')
      }

      const appData = await response.json()
      setData(appData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const saveWeight = async (userId: number, date: string, weight: number) => {
    try {
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          date,
          weight,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false)
          return
        }
        throw new Error('Failed to save weight')
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
      const response = await fetch('/api/weight', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          date,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false)
          return
        }
        throw new Error('Failed to delete weight')
      }

      // Refresh data to show updated value immediately
      await fetchData()

      return await response.json()
    } catch (err) {
      throw err
    }
  }

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        await checkAuth()
        return true
      }
      return false
    } catch (err) {
      console.error('Login failed:', err)
      return false
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  // Sync tab changes to URL hash
  useEffect(() => {
    const onHashChange = () => setActiveTab(getTabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return <LoginForm onLogin={handleLogin} />
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
    <div className="bg-white dark:bg-gray-900 h-screen flex flex-col overflow-hidden">
      {/* Tab Bar */}
      <div className="z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => {
              window.location.hash = '#zahlen'
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'zahlen'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Zahlen
          </button>
          <button
            onClick={() => {
              window.location.hash = '#ranking'
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ranking'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Ranking
          </button>
          <button
            onClick={() => {
              window.location.hash = '#grafiken'
              setChartKey((prev) => prev + 1)
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'grafiken'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Grafiken
          </button>
          <button
            onClick={() => {
              window.location.hash = '#export'
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => {
              window.location.hash = '#password'
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Password
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'zahlen' ? (
          <WeightTable
            users={data.users}
            weights={data.weights}
            dateColumns={data.dateColumns}
            onSaveWeight={saveWeight}
            onDeleteWeight={deleteWeight}
          />
        ) : activeTab === 'ranking' ? (
          <Ranking />
        ) : activeTab === 'grafiken' ? (
          <WeightChart
            key={chartKey}
            users={data.users}
            weights={data.weights}
            dateColumns={data.dateColumns}
          />
        ) : activeTab === 'export' ? (
          <Export users={data.users} weights={data.weights} dateColumns={data.dateColumns} />
        ) : activeTab === 'debug' ? (
          <DebugShare />
        ) : (
          <PasswordChange />
        )}
      </div>
    </div>
  )
}

export default App
