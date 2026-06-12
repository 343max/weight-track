/**
 * Generates a shareable PNG image showing a weight trend sparkline,
 * current weight, and week-over-week change.
 */

function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export async function generateShareImage(
  weight: number,
  change: number,
  entries: number[],
  color: string,
): Promise<Blob> {
  const scale = 2
  const W = 600 * scale
  const H = 340 * scale
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // -- Background --
  const dark = isDarkMode()
  ctx.fillStyle = dark ? '#1f2937' : '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // -- Sparkline --
  const sparklineData = entries.length === 0 ? [weight] : entries
  if (sparklineData.length > 1) {
    const paddingX = 80 * scale
    const paddingY = 100 * scale
    const chartW = W - paddingX * 2
    const chartH = H - paddingY * 2

    const min = Math.min(...sparklineData)
    const max = Math.max(...sparklineData)
    const range = max - min || 1
    const yPad = range * 0.15

    const points = sparklineData.map((val, i) => ({
      x: paddingX + (i / (sparklineData.length - 1)) * chartW,
      y: paddingY + chartH - ((val - (min - yPad)) / (range + yPad * 2)) * chartH,
    }))

    // Line
    ctx.strokeStyle = hexToRgba(color, dark ? 0.2 : 0.18)
    ctx.lineWidth = 8 * scale
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(points[0]!.x, points[0]!.y)
    for (const p of points) {
      ctx.lineTo(p.x, p.y)
    }
    ctx.lineTo(points[points.length - 1]!.x, points[points.length - 1]!.y)
    ctx.stroke()

    // Data points
    ctx.fillStyle = hexToRgba(color, dark ? 0.35 : 0.3)
    for (const p of points) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 10 * scale, 0, Math.PI * 2)
      ctx.fill()
    }

    // Last point (current) — more visible
    const last = points[points.length - 1]!
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(last.x, last.y, 12 * scale, 0, Math.PI * 2)
    ctx.fill()
  }

  // -- Weight number --
  const weightText = weight.toFixed(1)
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const weightFontSize = 130 * scale
  ctx.font = `bold ${weightFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  ctx.fillText(weightText, W / 2, H * 0.42)

  // -- Change indicator --
  if (change !== 0) {
    const isLoss = change < 0
    const arrow = isLoss ? '↓' : '↑'
    const changeColor = isLoss ? '#22c55e' : '#ef4444'
    const changeText = `${arrow} ${Math.abs(change).toFixed(1)}`

    ctx.fillStyle = changeColor
    const changeFontSize = 52 * scale
    ctx.font = `600 ${changeFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillText(changeText, W / 2, H * 0.68)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create image blob'))
    }, 'image/png')
  })
}
