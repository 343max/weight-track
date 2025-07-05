import { useState } from "react"
import type { User, WeightEntry } from "../types"

interface ExportProps {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
}

export default function Export({ users, weights, dateColumns }: ExportProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadCSV = () => {
    const csvData = generateCSV()
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `weight-data-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadJSON = () => {
    const jsonData = generateJSON()
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `weight-data-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadSQLite = async () => {
    try {
      setIsDownloading(true)
      const secret = new URLSearchParams(window.location.search).get("secret")
      if (!secret) {
        throw new Error("Secret parameter is required")
      }

      const response = await fetch(`/api/export/sqlite?secret=${secret}`)
      if (!response.ok) {
        throw new Error("Failed to download SQLite file")
      }

      const blob = await response.blob()
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `weight-tracker-${new Date().toISOString().split('T')[0]}.db`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Failed to download SQLite file:", error)
      alert("Fehler beim Herunterladen der Datenbankdatei")
    } finally {
      setIsDownloading(false)
    }
  }

  const generateCSV = (): string => {
    const headers = ['Benutzer', 'Farbe', ...dateColumns]
    const rows = [headers.join(',')]

    users.forEach(user => {
      const row = [
        `"${user.name}"`,
        `"${user.color}"`,
        ...dateColumns.map(date => {
          const key = `${user.id}-${date}`
          const weight = weights[key]
          return weight ? weight.weight_kg.toString() : ''
        })
      ]
      rows.push(row.join(','))
    })

    return rows.join('\n')
  }

  const generateJSON = () => {
    return {
      exportDate: new Date().toISOString(),
      users: users,
      weights: Object.values(weights),
      dateColumns: dateColumns
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const totalEntries = Object.keys(weights).length
  const dateRange = dateColumns.length > 0 
    ? `${formatDate(dateColumns[0])} - ${formatDate(dateColumns[dateColumns.length - 1])}`
    : 'Keine Daten'

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Daten exportieren</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Exportieren Sie Ihre Gewichtsdaten in verschiedenen Formaten oder laden Sie die gesamte Datenbankdatei herunter.
        </p>
      </div>

      {/* Data Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Datenübersicht</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Benutzer</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalEntries}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Gewichtseinträge</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{dateColumns.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Zeiträume</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">Zeitraum: {dateRange}</div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-4">
        {/* CSV Export */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">CSV-Export</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Exportieren Sie alle Daten als CSV-Datei für Excel oder andere Tabellenkalkulationsprogramme.
              </p>
            </div>
            <button
              onClick={downloadCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              CSV herunterladen
            </button>
          </div>
        </div>

        {/* JSON Export */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">JSON-Export</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Exportieren Sie alle Daten im JSON-Format für die Weiterverarbeitung oder Backup.
              </p>
            </div>
            <button
              onClick={downloadJSON}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              JSON herunterladen
            </button>
          </div>
        </div>

        {/* SQLite Database Export */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">SQLite-Datenbank</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Laden Sie die komplette SQLite-Datenbankdatei herunter. Enthält alle Daten und kann als vollständiges Backup verwendet werden.
              </p>
            </div>
            <button
              onClick={downloadSQLite}
              disabled={isDownloading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {isDownloading ? 'Lädt...' : 'SQLite herunterladen'}
            </button>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Benutzer in den Daten</h3>
        <div className="space-y-2">
          {users.map(user => {
            const userEntries = Object.values(weights).filter(w => w.user_id === user.id).length
            return (
              <div key={user.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: user.color }}
                  ></div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {userEntries} Einträge
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}