import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { generateShareImage } from './ShareImage'

interface ShareButtonProps {
  weight: number
  change: number
  entries: number[]
  color: string
  onDismiss: () => void
  anchorRef: React.RefObject<HTMLDivElement | null>
}

function canShareFiles(): boolean {
  if (typeof navigator === 'undefined') return false
  if (typeof navigator.share !== 'function') return false
  return true
}

export function ShareButton({
  weight,
  change,
  entries,
  color,
  onDismiss,
  anchorRef,
}: ShareButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  if (!canShareFiles()) return null

  const dismiss = useCallback(() => {
    onDismissRef.current()
  }, [])

  // Compute fixed position based on anchor cell
  useEffect(() => {
    const updatePos = () => {
      const anchor = anchorRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      setPos({
        top: rect.top + rect.height / 2,
        left: rect.left,
      })
    }
    updatePos()
    window.addEventListener('scroll', updatePos, { passive: true, capture: true })
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, { capture: true })
      window.removeEventListener('resize', updatePos)
    }
  }, [anchorRef])

  // Dismiss on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        dismiss()
      }
    }
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
    }
  }, [dismiss])

  // Dismiss on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dismiss])

  const blob = useMemo(() => {
    return generateShareImage(weight, change, entries, color)
  }, [])

  const handleShare = async () => {
    try {
      const file = new File([await blob], 'weight.png', { type: 'image/png' })
      await navigator.share({
        files: [file],
      })
      dismiss()
    } catch (err) {}
  }

  if (!pos) return null

  return createPortal(
    <button
      ref={buttonRef}
      onClick={handleShare}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        transform: 'translateX(-50%) translateY(-50%)',
        zIndex: 50,
      }}
      className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform text-gray-600 dark:text-gray-300 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70"
      aria-label="Share weight"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    </button>,
    document.body,
  )
}
