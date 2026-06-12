import { useState, useEffect, useRef } from 'react'
import type { User, WeightChangeInfo } from '../types'
import { parseWeightInput, isZeroWeight, isValidWeight } from '../utils/weightParser'
import { ShareButton } from './ShareButton'

interface WeightInputProps {
  userId: number
  date: string
  initialWeight: number | null
  weightChangeInfo: WeightChangeInfo | null
  onSave: (userId: number, date: string, weight: number) => Promise<WeightChangeInfo>
  onDelete: (userId: number, date: string) => Promise<void>
  isLatestColumn: boolean
  user: User
  recentEntries: number[]
}

export function WeightInput({
  userId,
  date,
  initialWeight,
  weightChangeInfo,
  onSave,
  onDelete,
  isLatestColumn,
  user,
  recentEntries,
}: WeightInputProps) {
  const [value, setValue] = useState(initialWeight?.toString() || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [displayInfo, setDisplayInfo] = useState<WeightChangeInfo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cellRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  const handleSave = async (weightValue: string): Promise<WeightChangeInfo | null> => {
    setIsSaving(true)
    try {
      if (!weightValue || weightValue.trim() === '') {
        // Delete the weight if field is empty and there was a previous value
        if (initialWeight !== null) {
          await onDelete(userId, date)
          setDisplayInfo(null)
          lastValidValueRef.current = ''
        }
        return null
      }

      const numericValue = parseWeightInput(weightValue)
      if (numericValue === null || numericValue <= 0) {
        return null
      }

      const result = await onSave(userId, date, numericValue)
      setDisplayInfo(result)
      lastValidValueRef.current = numericValue.toString()
      return result
    } catch (error) {
      console.error('Failed to save/delete weight:', error)
      return null
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

  const handleBlur = async () => {
    setIsEditing(false)
    setShowShare(false)

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // If empty or invalid, dismiss the input without action
    if (!value || value.trim() === '') {
      setValue(lastValidValueRef.current)
      return
    }

    // Handle explicit "0" as deletion request
    if (isZeroWeight(value)) {
      if (initialWeight !== null) {
        await handleSave('') // Trigger deletion
      } else {
        setValue(lastValidValueRef.current) // Dismiss if no existing weight
      }
      return
    }

    // Dismiss invalid inputs
    if (!isValidWeight(value)) {
      setValue(lastValidValueRef.current)
      return
    }

    const result = await handleSave(value)

    // Show share button only for latest column with a previous weight entry.
    if (result && result.previousWeight && isLatestColumn) {
      setShowShare(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
  }

  const renderWeightChange = () => {
    // Don't show during editing
    if (isEditing) {
      return null
    }

    // Use weightChangeInfo prop if available, otherwise use displayInfo
    const changeInfo = weightChangeInfo || displayInfo

    if (!changeInfo || !changeInfo.previousWeight || !changeInfo.weight) {
      return null
    }

    const current = changeInfo.weight.weight_kg
    const previous = changeInfo.previousWeight.weight_kg
    const change = current - previous

    if (change === 0) {
      return <div className="text-gray-500 dark:text-gray-400 text-xs text-center mt-1">(–)</div>
    }

    const isLoss = change < 0
    const colorClass = isLoss
      ? 'text-green-600 dark:text-green-400 font-semibold'
      : 'text-red-600 dark:text-red-400 font-semibold'
    const arrow = isLoss ? '↓' : '↑'
    const absChange = Math.abs(change).toFixed(1)

    return (
      <div className={`${colorClass} text-xs text-center mt-1`}>
        {arrow} {absChange}
      </div>
    )
  }

  const handleClick = () => {
    setShowShare(false)
    setIsEditing(true)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, 0)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="text-center w-full dark:text-white"
        placeholder="--"
        step="0.1"
        min="0"
        disabled={isSaving}
        autoFocus
      />
    )
  }

  return (
    <>
      {showShare && (
        <ShareButton
          weight={initialWeight ?? 0}
          change={
            displayInfo && displayInfo.previousWeight
              ? displayInfo.weight.weight_kg - displayInfo.previousWeight.weight_kg
              : 0
          }
          entries={recentEntries}
          color={user.color}
          onDismiss={() => setShowShare(false)}
          anchorRef={cellRef}
        />
      )}
      <div ref={cellRef} className="text-center p-2 relative" onClick={handleClick}>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {initialWeight !== null ? initialWeight.toFixed(1) : '--'}
        </div>
        {renderWeightChange()}
      </div>
    </>
  )
}
