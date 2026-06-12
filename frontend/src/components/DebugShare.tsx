import { useEffect, useState } from 'react'
import { generateShareImage } from './ShareImage'

const CONFIGS = [
  { weight: 98.3, change: -0.7, entries: [98.8, 97.8, 99, 98.3], color: '#3b82f6' },
  { weight: 68.7, change: 0.5, entries: [67.0, 68.2, 68.1, 68.7], color: '#ef4444' },
  { weight: 95.1, change: -2.8, entries: [98.5, 97.0, 96.2, 95.1], color: '#22c55e' },
  { weight: 74.2, change: 0, entries: [75.0, 74.5, 74.2, 74.2], color: '#f59e0b' },
]

export default function DebugShare() {
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    const urls: string[] = []
    Promise.all(
      CONFIGS.map((c) =>
        generateShareImage(c.weight, c.change, c.entries, c.color),
      ),
    ).then((blobs) => {
      blobs.forEach((blob) => urls.push(URL.createObjectURL(blob)))
      setImages(urls)
    })
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [])

  if (images.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Generating share images…
      </div>
    )
  }

  return (
    <div className="p-6 h-full overflow-auto bg-gray-100 dark:bg-gray-950">
      <div className="grid grid-cols-2 gap-4 max-w-5xl mx-auto">
        {images.map((url, i) => (
          <div
            key={i}
            className="rounded overflow-hidden shadow-lg bg-white dark:bg-gray-800"
          >
            <img src={url} alt={`Share ${i + 1}`} className="w-full block" />
          </div>
        ))}
      </div>
    </div>
  )
}
