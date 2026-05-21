import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Profile } from '@/db/types'
import {
  generateRecommendation,
  type HistoryItem,
  type PreCheckInput,
  type RecommendationOutput,
} from '@/logic/recommendation'

// Нейтральний pre-check для початкового відображення на дашборді.
// Реальний pre-check заповнюється перед активністю.
const NEUTRAL_PRE_CHECK: PreCheckInput = {
  sleep: 3, fatigue: 3, readiness: 3, pain: false,
}

export function useRecommendation(profile: Profile | undefined): RecommendationOutput | undefined {
  const history = useLiveQuery(
    async () => {
      if (!profile?.id) return [] as HistoryItem[]
      const activities = await db.activities
        .where('profileId').equals(profile.id)
        .sortBy('date')
      // Останні 20 активностей з відповідними after-checkin
      const recent = activities.slice(-20)
      const items: HistoryItem[] = await Promise.all(
        recent.map(async a => {
          const after = a.id
            ? await db.checkins
                .where('activityId').equals(a.id)
                .and(c => c.type === 'after')
                .first()
            : undefined
          return {
            date: a.date,
            duration: a.duration,
            isRestDay: a.isRestDay,
            lastDifficulty: after?.difficulty,
            redFlags: after?.redFlags,
            feeling: after?.feeling,
            discomfortAfter: after?.discomfortAfter,
          }
        }),
      )
      return items
    },
    [profile?.id],
  )

  if (!profile || history === undefined) return undefined
  return generateRecommendation(profile, NEUTRAL_PRE_CHECK, history)
}
