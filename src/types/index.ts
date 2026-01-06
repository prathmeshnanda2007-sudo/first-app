// User types
export interface User {
  id: string
  email: string
  displayName: string
  createdAt: string
}

// Check-in types
export interface CheckIn {
  id: string
  userId: string
  date: string
  mood: number // 1-10
  energy: number // 1-10
  sleep: number // 1-10
  stress: number // 1-10
  journalEntry?: string
  dailyGoal?: string
  createdAt: string
}

// AI Analysis types
export interface MoodAnalysis {
  weeklyAverage: number
  monthlyAverage: number
  trend: 'improving' | 'stable' | 'declining'
  stressPattern: string
  suggestions: string[]
  wellnessScore: number
}

// Chart data types
export interface ChartData {
  date: string
  mood: number
  energy: number
  stress: number
  sleep: number
}

// Report types
export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  averageMood: number
  averageEnergy: number
  averageStress: number
  averageSleep: number
  checkInsCount: number
  insights: string[]
}
