import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { calcStreak } from '@/logic/streak'

export interface WeekStats {
  totalMinutes: number
  sessions: number
  streak: number
  jointMinutes: number
  avgMoodAfter: number | null
}

function startOfWeekRangeISO(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 6)
  return d.toISOString().slice(0, 10)
}

export function useWeekStats(profileId: number | undefined): WeekStats | undefined {
  return useLiveQuery(
    async () => {
      if (!profileId) return undefined
      const activities = await db.activities
        .where('profileId').equals(profileId)
        .toArray()

      const startISO = startOfWeekRangeISO()
      const week = activities.filter(a => a.date.slice(0, 10) >= startISO)

      const checkins = await db.checkins
        .where('profileId').equals(profileId)
        .and(c => c.type === 'after')
        .toArray()
      const weekCheckins = checkins.filter(c => c.date.slice(0, 10) >= startISO)
      const moodVals: number[] = []
      for (const c of weekCheckins) {
        if (c.feeling === 'better') moodVals.push(5)
        else if (c.feeling === 'same') moodVals.push(3)
        else if (c.feeling === 'worse') moodVals.push(1)
      }

      return {
        totalMinutes: week.reduce((s, a) => s + a.duration, 0),
        sessions: week.filter(a => !a.isRestDay).length,
        streak: calcStreak(activities.map(a => ({ date: a.date }))),
        jointMinutes: week.filter(a => a.mode === 'together').reduce((s, a) => s + a.duration, 0),
        avgMoodAfter: moodVals.length
          ? moodVals.reduce((s, v) => s + v, 0) / moodVals.length
          : null,
      }
    },
    [profileId],
  )
}
