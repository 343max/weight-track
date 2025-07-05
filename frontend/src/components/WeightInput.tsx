import { useState, useEffect, useRef } from "react"
import type { WeightChangeInfo } from "../types"

interface WeightInputProps {
  userId: number
  date: string
  initialWeight: number | null
  weightChangeInfo: WeightChangeInfo | null
  onSave: (userId: number, date: string, weight: number) => Promise<WeightChangeInfo>
  onDelete: (userId: number, date: string) => Promise<void>
}

function WeightInput({ userId, date, initialWeight, weightChangeInfo, onSave, onDelete }: WeightInputProps) {
  const [value, setValue] = useState(initialWeight?.toString() || "")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showShake, setShowShake] = useState(false)
  const [displayInfo, setDisplayInfo] = useState<WeightChangeInfo | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastValidValueRef = useRef<string>("")

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
      if (!weightValue || weightValue.trim() === "") {
        // Delete the weight if field is empty and there was a previous value
        if (initialWeight !== null) {
          await onDelete(userId, date)
          setDisplayInfo(null)
          lastValidValueRef.current = ""
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
      console.error("Failed to save/delete weight:", error)
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

    // If empty or invalid, dismiss the input without action
    if (!value || value.trim() === "") {
      setValue(lastValidValueRef.current)
      return
    }

    const numericValue = parseFloat(value)

    // Handle explicit "0" as deletion request
    if (value.trim() === "0") {
      if (initialWeight !== null) {
        handleSave("") // Trigger deletion
      } else {
        setValue(lastValidValueRef.current) // Dismiss if no existing weight
      }
      return
    }

    // Dismiss invalid inputs
    if (isNaN(numericValue) || numericValue <= 0) {
      setShowShake(true)
      setValue(lastValidValueRef.current)
      setTimeout(() => setShowShake(false), 500)
      return
    }

    handleSave(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
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
      ? "text-green-600 dark:text-green-400 font-semibold"
      : "text-red-600 dark:text-red-400 font-semibold"
    const arrow = isLoss ? "↓" : "↑"
    const absChange = Math.abs(change).toFixed(1)

    return (
      <div className={`${colorClass} text-xs text-center mt-1`}>
        {arrow} {absChange}
      </div>
    )
  }

  const handleClick = () => {
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
      <div className="flex flex-col items-center justify-center p-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`
            w-20 min-w-[80px] max-w-[80px] text-center text-sm p-2 border-2 rounded-lg
            bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            shadow-sm
            ${showShake ? "animate-shake" : ""}
            ${isSaving ? "opacity-50" : ""}
          `}
          placeholder="--"
          step="0.1"
          min="0"
          disabled={isSaving}
          autoFocus
        />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[60px]"
      onClick={handleClick}
    >
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {initialWeight !== null ? initialWeight.toFixed(1) : "--"}
        </div>
        {renderWeightChange()}
      </div>
      {isSaving && <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">Saving...</div>}
    </div>
  )
}

export default WeightInput
