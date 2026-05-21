import type { HistoryItem } from './recommendation'

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Streak = к-сть днів поспіль з активністю (або rest day) до сьогодні/вчора.
 * Якщо остання активність більше ніж 1 день тому — streak=0.
 */
export function calcStreak(history: HistoryItem[]): number {
  if (history.length === 0) return 0

  const uniqueDates = [...new Set(history.map(h => h.date.slice(0, 10)))]
    .sort()
    .reverse()

  if (uniqueDates.length === 0) return 0

  const today = todayISO()
  const yesterday = addDays(today, -1)

  // Стрик "живий" тільки якщо остання активність — сьогодні або вчора
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    if (addDays(uniqueDates[i - 1], -1) === uniqueDates[i]) {
      streak++
    } else {
      break
    }
  }
  return streak
}
