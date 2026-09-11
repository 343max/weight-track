import { useState, useEffect } from 'react'
import type { RankingData, RankingEntry } from '../types'

type PeriodKey = keyof RankingData

const PERIOD_ORDER: PeriodKey[] = ['weeks12', 'weeks24', 'weeks52', 'allTime']

const PERIOD_LABELS: Record<PeriodKey, string> = {
  weeks12: '12 Wochen',
  weeks24: '24 Wochen',
  weeks52: '52 Wochen',
  allTime: 'All Time',
}

function rankWithTies(
  entries: RankingEntry[],
  deltaOf: (entry: RankingEntry) => number,
): (string | number)[] {
  if (entries.length === 0) return []

  const ranks: (string | number)[] = []
  let currentRank = 1
  let i = 0

  while (i < entries.length) {
    const groupStart = i
    const groupDelta = deltaOf(entries[i]!)

    // Find all entries with the same delta
    while (i < entries.length && deltaOf(entries[i]!) === groupDelta) {
      i++
    }

    const medal =
      currentRank === 1 ? '🥇' : currentRank === 2 ? '🥈' : currentRank === 3 ? '🥉' : currentRank

    for (let j = groupStart; j < i; j++) {
      ranks.push(medal)
    }

    currentRank += i - groupStart
  }

  return ranks
}

function deltaColorClass(value: number): string {
  if (value < 0) return 'text-green-600 dark:text-green-400'
  if (value > 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

function RankingTable({
  title,
  entries,
  deltaOf,
  deltaColumnLabel,
}: {
  title: string
  entries: RankingEntry[]
  deltaOf: (entry: RankingEntry) => number
  deltaColumnLabel: string
}) {
  const sorted = [...entries].sort((a, b) => deltaOf(a) - deltaOf(b))
  const ranks = rankWithTies(sorted, deltaOf)

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400 "></th>
              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                User
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                Start
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                Ende
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-400">
                {deltaColumnLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => {
              const delta = deltaOf(entry)
              return (
                <tr key={entry.userId} className="border-t border-gray-100 dark:border-gray-700/50">
                  <td className="pl-2 py-2 text-center text-gray-800 dark:text-gray-200">
                    {ranks[i]}
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: entry.userColor }}
                      />
                      <span className="text-gray-800 dark:text-gray-200">{entry.userName}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                    {entry.startWeight.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 tabular-nums">
                    {entry.endWeight.toFixed(1)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums font-medium ${deltaColorClass(delta)}`}
                  >
                    {delta < 0 ? '−' : delta > 0 ? '+' : ''}
                    {Math.abs(delta).toFixed(1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Ranking() {
  const [data, setData] = useState<RankingData | null>(null)
  const [period, setPeriod] = useState<PeriodKey>('weeks12')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRanking() {
      try {
        const response = await fetch('/api/ranking', { credentials: 'include' })
        if (!response.ok) throw new Error('Failed to fetch ranking')
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchRanking()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-600 dark:text-red-400">
        Error: {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        No data available
      </div>
    )
  }

  const entries = data[period]

  return (
    <div className="h-full overflow-y-auto p-4 bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-6">
          {PERIOD_ORDER.map((key) => {
            const active = period === key
            return (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                aria-pressed={active}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {PERIOD_LABELS[key]}
              </button>
            )
          })}
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keine Daten in diesem Zeitraum
          </p>
        ) : (
          <>
            <RankingTable
              title="Veränderung in kg"
              entries={entries}
              deltaOf={(entry) => entry.deltaKg}
              deltaColumnLabel="Δ kg"
            />
            <RankingTable
              title="Veränderung in %"
              entries={entries}
              deltaOf={(entry) => entry.deltaPercent}
              deltaColumnLabel="Δ %"
            />
          </>
        )}
      </div>
    </div>
  )
}
