import type { User, WeightEntry } from '../types'

interface ExportProps {
  users: User[]
  weights: Record<string, WeightEntry>
  dateColumns: string[]
}

export default function Export({ users, weights, dateColumns }: ExportProps) {

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
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json;charset=utf-8;',
    })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `weight-data-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateCSV = (): string => {
    const headers = ['Benutzer', 'Farbe', ...dateColumns]
    const rows = [headers.join(',')]

    users.forEach((user) => {
      const row = [
        `"${user.name}"`,
        `"${user.color}"`,
        ...dateColumns.map((date) => {
          const key = `${user.id}-${date}`
          const weight = weights[key]
          return weight ? weight.weight_kg.toString() : ''
        }),
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
      dateColumns: dateColumns,
    }
  }

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
      </div>
    </div>
  )
}
