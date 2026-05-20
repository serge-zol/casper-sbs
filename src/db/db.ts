import Dexie, { type EntityTable } from 'dexie'
import type {
  Profile,
  Activity,
  CheckIn,
  Recommendation,
  SafetyFlag,
  WeeklySummary,
  AppStateEntry,
} from './types'

const db = new Dexie('casper-db') as Dexie & {
  profiles:        EntityTable<Profile,        'id'>
  activities:      EntityTable<Activity,       'id'>
  checkins:        EntityTable<CheckIn,        'id'>
  recommendations: EntityTable<Recommendation, 'id'>
  safetyFlags:     EntityTable<SafetyFlag,     'id'>
  weeklySummaries: EntityTable<WeeklySummary,  'id'>
  appState:        EntityTable<AppStateEntry,  'key'>
}

db.version(1).stores({
  profiles:        '++id, name, mode',
  activities:      '++id, profileId, date, mode',
  checkins:        '++id, activityId, profileId, type, date',
  recommendations: '++id, profileId, date',
  safetyFlags:     '++id, profileId, date, level',
  weeklySummaries: '++id, profileId, weekId',
  appState:        'key',
})

export { db }
