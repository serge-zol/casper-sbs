import { describe, it, expect } from 'vitest'
import { generateRecommendation, type PreCheckInput, type HistoryItem } from '@/logic/recommendation'
import { calcStreak } from '@/logic/streak'
import type { Profile } from '@/db/types'

// ───────────── Test fixtures ─────────────

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    name: 'Test',
    mode: 'custom',
    ageGroup: '31-40',
    activityLevel: 2,
    goals: [],
    schedule: { daysPerWeek: '3-4', timeOfDay: 'flexible', targetMinutes: 25 },
    medical: { inRecovery: false, restrictions: [], prohibitions: '' },
    createdAt: '2026-05-20T00:00:00.000Z',
    updatedAt: '2026-05-20T00:00:00.000Z',
    ...overrides,
  }
}

const idealPreCheck: PreCheckInput = {
  sleep: 5, fatigue: 1, readiness: 5, pain: false,
}

function dayBack(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function idealHistory(days: number): HistoryItem[] {
  return Array.from({ length: days }, (_, i) => ({
    date: dayBack(days - 1 - i),
    lastDifficulty: 3,
    feeling: 'better' as const,
    discomfortAfter: false,
  }))
}

// ───────────── AC-12: medical.prohibitions блокує acceleration ─────────────

describe('AC-12: медичні обмеження зчитуються до рекомендації', () => {
  it('Серж з "не бігти" в обмеженнях НЕ отримує with-acceleration', () => {
    const profile = makeProfile({
      mode: 'serge',
      medical: { inRecovery: false, restrictions: [], prohibitions: 'не бігти, пульс <120' },
    })
    const rec = generateRecommendation(profile, idealPreCheck, idealHistory(10))
    expect(rec.paceType).not.toBe('with-acceleration')
  })

  it('Серж без обмежень з ідеальною історією МОЖЕ отримати with-acceleration', () => {
    const profile = makeProfile({ mode: 'serge' })
    const rec = generateRecommendation(profile, idealPreCheck, idealHistory(10))
    expect(rec.paceType).toBe('with-acceleration')
  })
})

// ───────────── AC-13: redFlags → paceType=rest ─────────────

describe('AC-13: червоний прапорець = paceType=rest', () => {
  it('redFlags у останньому after-checkin → rest', () => {
    const history: HistoryItem[] = [
      { date: dayBack(1), redFlags: ['біль у грудях'] },
    ]
    const rec = generateRecommendation(makeProfile(), idealPreCheck, history)
    expect(rec.paceType).toBe('rest')
    expect(rec.cautionLevel).toBe('red')
    expect(rec.targetDuration).toBe(0)
  })

  it('pain у pre-check → rest', () => {
    const preCheck: PreCheckInput = { ...idealPreCheck, pain: true }
    const rec = generateRecommendation(makeProfile(), preCheck, [])
    expect(rec.paceType).toBe('rest')
  })

  it('operationZoneDiscomfort у Олени → rest', () => {
    const profile = makeProfile({ mode: 'olena', medical: { inRecovery: true, restrictions: ['surgery'], prohibitions: '' } })
    const preCheck: PreCheckInput = { ...idealPreCheck, operationZoneDiscomfort: true }
    const rec = generateRecommendation(profile, preCheck, [])
    expect(rec.paceType).toBe('rest')
  })
})

// ───────────── AC-17: Олена НІКОЛИ не отримує acceleration ─────────────

describe('AC-17: Олена НІКОЛИ не отримує with-acceleration', () => {
  it('10 ідеальних сесій + ідеальний pre-check → НЕ acceleration', () => {
    const profile = makeProfile({
      mode: 'olena', name: 'Олена',
      medical: { inRecovery: true, restrictions: ['surgery'], prohibitions: '' },
    })
    const rec = generateRecommendation(profile, idealPreCheck, idealHistory(10))
    expect(rec.paceType).not.toBe('with-acceleration')
  })

  it('Олена з порожньою історією → НЕ acceleration', () => {
    const profile = makeProfile({ mode: 'olena', medical: { inRecovery: true, restrictions: [], prohibitions: '' } })
    const rec = generateRecommendation(profile, idealPreCheck, [])
    expect(rec.paceType).not.toBe('with-acceleration')
  })

  it('Олена з ідеальним станом і "не бігти" → НЕ acceleration', () => {
    const profile = makeProfile({
      mode: 'olena',
      medical: { inRecovery: true, restrictions: ['surgery'], prohibitions: 'не бігти' },
    })
    const rec = generateRecommendation(profile, idealPreCheck, idealHistory(10))
    expect(rec.paceType).not.toBe('with-acceleration')
  })
})

// ───────────── AC-18: Streak ─────────────

describe('AC-18: Streak розраховується коректно', () => {
  it('3 дні поспіль (сьогодні-2, сьогодні-1, сьогодні) → streak=3', () => {
    const history: HistoryItem[] = [
      { date: dayBack(2) }, { date: dayBack(1) }, { date: dayBack(0) },
    ]
    expect(calcStreak(history)).toBe(3)
  })

  it('Пропуск (тільки 4 дні тому) → streak=0', () => {
    const history: HistoryItem[] = [{ date: dayBack(4) }, { date: dayBack(5) }]
    expect(calcStreak(history)).toBe(0)
  })

  it('Порожня історія → streak=0', () => {
    expect(calcStreak([])).toBe(0)
  })

  it('Тільки сьогодні → streak=1', () => {
    expect(calcStreak([{ date: dayBack(0) }])).toBe(1)
  })

  it('Розрив посередині → рахується тільки безперервна частина від найновішого', () => {
    // сьогодні, вчора, [пропуск], 3 дні тому, 4 дні тому
    const history: HistoryItem[] = [
      { date: dayBack(0) }, { date: dayBack(1) },
      { date: dayBack(3) }, { date: dayBack(4) },
    ]
    expect(calcStreak(history)).toBe(2)
  })
})
