export interface Profile {
  id?: number
  name: string
  mode: 'serge' | 'olena' | 'custom'
  ageGroup: '20-30' | '31-40' | '41-50' | '51-60' | '60+'
  gender?: 'male' | 'female' | 'other'
  activityLevel: 1 | 2 | 3 | 4
  goals: string[]
  schedule: {
    daysPerWeek: '1-2' | '3-4' | '5+' | 'flexible'
    timeOfDay: 'morning' | 'day' | 'evening' | 'flexible'
    targetMinutes: number
  }
  medical: {
    inRecovery: boolean
    restrictions: string[]       // 'surgery'|'heart'|'joints'|'pain'|'pregnancy'
    eventDate?: string           // ISO date
    prohibitions: string         // 'не бігти, пульс <120'
    restrictionUntil?: string    // ISO date | 'doctor' | 'permanent'
    doctorNotes?: string
  }
  partner?: number
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id?: number
  profileId: number
  partnerProfileId?: number
  mode: 'solo' | 'together'
  date: string
  startTime?: string
  duration: number               // хвилини
  distance?: number              // км
  steps?: number
  pace?: number
  avgHeartRate?: number
  maxHeartRate?: number
  notes?: string
  isRestDay: boolean
  restDayType?: 'auto' | 'manual' | 'planned'
  safetyLevel: 'green' | 'yellow' | 'red'
}

export interface CheckIn {
  id?: number
  activityId: number
  profileId: number
  type: 'before' | 'after'
  date: string
  // before
  sleep?: 1 | 2 | 3 | 4 | 5
  fatigue?: 1 | 2 | 3 | 4 | 5
  pain: boolean
  painDetails?: string
  painZone?: string
  readiness?: 1 | 2 | 3 | 4 | 5
  mood?: 1 | 2 | 3 | 4 | 5
  conditions?: 'outdoor' | 'indoor' | 'gym'
  operationZoneDiscomfort?: boolean  // ⚠️ тільки для Олени — перевіряється першим
  // after
  difficulty?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  fatigueAfter?: 1 | 2 | 3 | 4 | 5
  discomfortAfter?: boolean
  discomfortDetails?: string
  feeling?: 'better' | 'same' | 'worse'
  nextTimeChange?: string
  notesAfter?: string
  redFlags: string[]
}

export interface Recommendation {
  id?: number
  profileId: number
  date: string
  targetDuration: number
  paceType: 'comfortable' | 'normal' | 'with-acceleration' | 'rest'
  cautionLevel: 'green' | 'yellow' | 'red'
  reason: string
  safetyNotes?: string
  nextStep?: string
  casperPhrase: string
}

export interface SafetyFlag {
  id?: number
  profileId: number
  date: string
  level: 'yellow' | 'red'
  symptom: string
  source: 'before-checkin' | 'after-checkin' | 'manual'
  action: string
  resolved: boolean
  resolvedAt?: string
}

export interface WeeklySummary {
  id?: number
  profileId: number
  weekId: string                 // 'YYYY-Www'
  totalMinutes: number
  totalSessions: number
  avgDifficulty: number
  avgMoodBefore: number
  avgMoodAfter: number
  jointMinutes?: number
  jointSessions?: number
  casperInsight: string
  nextFocus: string
}

export interface AppStateEntry {
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}
