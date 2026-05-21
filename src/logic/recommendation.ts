import type { Profile, Recommendation } from '@/db/types'
import { pickPhrase } from './casperPhrases'
import { checkRedFlags, isRunForbidden } from './safetyCheck'
import { calcStreak } from './streak'

// ───────────── Input types ─────────────

export interface PreCheckInput {
  sleep?: 1 | 2 | 3 | 4 | 5
  fatigue?: 1 | 2 | 3 | 4 | 5
  readiness?: 1 | 2 | 3 | 4 | 5
  pain: boolean
  operationZoneDiscomfort?: boolean
}

export interface HistoryItem {
  date: string                                    // ISO YYYY-MM-DD
  lastDifficulty?: number                         // 1-10 з after-checkin
  redFlags?: string[]                             // з after-checkin
  feeling?: 'better' | 'same' | 'worse'
  discomfortAfter?: boolean
  duration?: number                               // хвилини
  isRestDay?: boolean
}

export type RecommendationOutput = Omit<Recommendation, 'id' | 'profileId' | 'date'>

// ───────────── Core function ─────────────

/**
 * Rule-based AI рекомендація. Порядок (СУВОРИЙ):
 *  1. SAFETY        — medical.prohibitions
 *  2. RED FLAGS     — останній after-checkin
 *  3. PRE-CHECK     — біль, дискомфорт зони (Олена)
 *  4. HISTORY       — avg difficulty + streak
 *  5. DURATION      — базова × коефіцієнт стану
 *  6. PACE          — comfortable / normal / with-acceleration
 *  7. PHRASE        — за cautionLevel
 *  8. RETURN
 */
export function generateRecommendation(
  profile: Profile,
  preCheck: PreCheckInput,
  history: HistoryItem[],
): RecommendationOutput {
  const noRun = isRunForbidden(profile)
  const isOlena = profile.mode === 'olena'

  // ── 2. Red flags у останньому after-checkin
  const lastAfter = history.length > 0 ? history[history.length - 1] : undefined
  if (checkRedFlags(lastAfter)) {
    return makeRest(
      'Є тривожні симптоми у останньому записі. Сьогодні відпочиваємо.',
      isOlena,
    )
  }

  // ── 3. Pre-check критичні стани
  if (isOlena && preCheck.operationZoneDiscomfort) {
    return makeRest(
      'Дискомфорт у зоні операції. Сьогодні без навантаження.',
      true,
    )
  }
  if (preCheck.pain) {
    return makeRest(
      'Біль зафіксовано. Відпочинок і консультація з лікарем.',
      isOlena,
    )
  }

  // ── 4. State score (0-100)
  const score =
    (preCheck.sleep ?? 3) * 10 +
    (preCheck.readiness ?? 3) * 10 +
    (5 - (preCheck.fatigue ?? 3)) * 10

  // ── 5. History
  const recent = history.slice(-7)
  const avgDiff = recent.length
    ? recent.reduce((s, h) => s + (h.lastDifficulty ?? 5), 0) / recent.length
    : 5
  const streak = calcStreak(history)

  // ── 6. Duration
  let duration = profile.schedule.targetMinutes || 20
  if (score < 40) duration = Math.round(duration * 0.6)
  else if (score < 65) duration = Math.round(duration * 0.8)
  if (avgDiff >= 8) duration = Math.round(duration * 0.7)

  // Олена: не підвищувати якщо останній after був неприємний
  if (isOlena && (lastAfter?.discomfortAfter || lastAfter?.feeling === 'worse')) {
    duration = Math.min(duration, profile.schedule.targetMinutes)
  }

  // Олена: максимальний крок збільшення +5 хв від попереднього
  if (isOlena && lastAfter?.duration) {
    duration = Math.min(duration, lastAfter.duration + 5)
  }

  // ── 7. Pace type
  let pace: Recommendation['paceType'] = 'comfortable'
  if (!noRun && !isOlena && score >= 75 && avgDiff <= 5 && streak >= 3) {
    pace = 'normal'
  }
  // ⚠️ AC-12 + AC-17: acceleration ТІЛЬКИ для Сержа і ТІЛЬКИ якщо немає 'не бігти'
  if (!noRun && profile.mode === 'serge' && score >= 85 && avgDiff <= 4 && streak >= 5) {
    pace = 'with-acceleration'
  }

  // ── 8. Caution level
  const caution: Recommendation['cautionLevel'] =
    score < 40 ? 'red' : score < 65 ? 'yellow' : 'green'

  return {
    targetDuration: duration,
    paceType: pace,
    cautionLevel: caution,
    reason: buildReason(score, avgDiff, streak, pace),
    casperPhrase: pickPhrase(caution),
    safetyNotes: isOlena
      ? 'Комфортний темп. Без прискорення. Фокус — рівне дихання.'
      : undefined,
  }
}

// ───────────── Helpers ─────────────

function makeRest(reason: string, isOlena: boolean): RecommendationOutput {
  return {
    targetDuration: 0,
    paceType: 'rest',
    cautionLevel: 'red',
    reason,
    casperPhrase: pickPhrase('red'),
    safetyNotes: isOlena ? 'Зверніться до лікаря або реабілітолога.' : undefined,
  }
}

function buildReason(
  score: number,
  avgDiff: number,
  streak: number,
  pace: Recommendation['paceType'],
): string {
  if (pace === 'with-acceleration')
    return `Стан добрий, серія ${streak} днів. Можна додати короткі прискорення.`
  if (pace === 'normal') return 'Стан стабільний. Йдемо у нормальному темпі.'
  if (score < 40) return 'Стан низький. Скоротимо тривалість і темп.'
  if (score < 65) return 'Помірна втома. Йдемо комфортно.'
  if (avgDiff >= 8) return 'Кілька важких днів — сьогодні легше.'
  return 'Тіло готове. Виходимо в ритм.'
}
