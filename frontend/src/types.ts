export interface User {
  id: number
  name: string
  color: string
}

export interface Weight {
  id: number
  user_id: number
  date: string
  weight_kg: number
}

export interface WeightEntry extends Weight {
  user_name: string
  user_color: string
}

export interface WeightChangeInfo {
  weight: Weight
  previousWeight: Weight | null
}
