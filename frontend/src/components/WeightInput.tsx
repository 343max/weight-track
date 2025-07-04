import { useState, useEffect, useRef } from 'react'
import type { WeightChangeInfo } from '../types'

interface WeightInputProps {
  userId: number
  date: string
  initialWeight: number | null
  weightChangeInfo: WeightChangeInfo | null
  onSave: (userId: number, date: string, weight: number) => Promise<WeightChangeInfo>
  onDelete: (userId: number, date: string) => Promise<void>
}

function WeightInput({ userId, date, initialWeight, weightChangeInfo, onSave, onDelete }: WeightInputProps) {
  const [value, setValue] = useState(initialWeight?.toString() || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showShake, setShowShake] = useState(false)
  const [displayInfo, setDisplayInfo] = useState<WeightChangeInfo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastValidValueRef = useRef<string>('')

  useEffect(() => {
    if (initialWeight !== null) {
      setValue(initialWeight.toString())
      lastValidValueRef.current = initialWeight.toString()
    }
  }, [initialWeight])

  useEffect(() => {
    if (weightChangeInfo) {
      setDisplayInfo(weightChangeInfo)
    }
  }, [weightChangeInfo])

  const handleSave = async (weightValue: string) => {
    setIsSaving(true)
    try {
      if (!weightValue || weightValue.trim() === '') {
        // Delete the weight if field is empty and there was a previous value
        if (initialWeight !== null) {
          await onDelete(userId, date)
          setDisplayInfo(null)
          lastValidValueRef.current = ''
        }
        return
      }

      const numericValue = parseFloat(weightValue)
      if (isNaN(numericValue) || numericValue <= 0) {
        return
      }

      const result = await onSave(userId, date, numericValue)
      setDisplayInfo(result)
      lastValidValueRef.current = numericValue.toString()
    } catch (error) {
      console.error('Failed to save/delete weight:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newValue)
    }, 2000)
  }

  const handleBlur = () => {
    setIsEditing(false)
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Allow empty value (for deletion)
    if (!value || value.trim() === '') {
      handleSave(value)
      return
    }

    const numericValue = parseFloat(value)
    if (isNaN(numericValue) || numericValue <= 0) {
      setShowShake(true)
      setValue(lastValidValueRef.current)
      setTimeout(() => setShowShake(false), 500)
      return
    }

    handleSave(value)
  }

  const handleFocus = () => {
    setIsEditing(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
  }

  const renderWeightChange = () => {
    if (!displayInfo || !displayInfo.previousWeight || isEditing) {
      return null
    }

    const current = displayInfo.weight.weight_kg
    const previous = displayInfo.previousWeight.weight_kg
    const change = current - previous

    if (change === 0) {
      return <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">(–)</span>
    }

    const isLoss = change < 0
    const colorClass = isLoss ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    const arrow = isLoss ? '↓' : '↑'
    const absChange = Math.abs(change).toFixed(1)

    return (
      <span className={`${colorClass} text-xs ml-1`}>
        ({arrow} {absChange})
      </span>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <input
        ref={inputRef}
        type="number"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={`
          weight-input text-center text-sm p-1 border rounded
          bg-transparent border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${showShake ? 'shake' : ''}
          ${isSaving ? 'opacity-50' : ''}
        `}
        placeholder="--"
        step="0.1"
        min="0"
        disabled={isSaving}
      />
      {renderWeightChange()}
    </div>
  )
}

export default WeightInput