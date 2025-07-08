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
      const response = await fetch("/api/export/sqlite", {
        credentials: "include"
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/"
          return
        }
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
      <div className="space-y-4">
        {/* CSV Export */}
        <button
          onClick={downloadCSV}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-medium transition-colors text-lg"
        >
          CSV herunterladen
        </button>

        {/* JSON Export */}
        <button
          onClick={downloadJSON}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-medium transition-colors text-lg"
        >
          JSON herunterladen
        </button>

        {/* SQLite Database Export */}
        <button
          onClick={downloadSQLite}
          disabled={isDownloading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-medium transition-colors text-lg"
        >
          {isDownloading ? 'Lädt...' : 'SQLite herunterladen'}
        </button>
      </div>
    </div>
  )
}