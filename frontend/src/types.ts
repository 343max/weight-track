export interface User {
  id: number
  name: string
  color: string
}

interface Weight {
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

export interface RankingEntry {
  userId: number
  userName: string
  userColor: string
  startWeight: number
  endWeight: number
  deltaKg: number
}

export interface RankingData {
  weeks12: RankingEntry[]
  weeks24: RankingEntry[]
  weeks52: RankingEntry[]
  allTime: RankingEntry[]
}
