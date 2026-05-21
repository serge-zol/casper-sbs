import type { Profile } from '@/db/types'
import type { HistoryItem } from './recommendation'

// Чи зафіксований червоний прапорець у останньому after-check
export function checkRedFlags(lastAfter?: HistoryItem): boolean {
  return Boolean(lastAfter?.redFlags && lastAfter.redFlags.length > 0)
}

// Чи заборонено бігти за медичними обмеженнями профілю
export function isRunForbidden(profile: Profile): boolean {
  return profile.medical.prohibitions.toLowerCase().includes('не бігти')
}

// Чи є будь-яке активне обмеження
export function hasActiveRestrictions(profile: Profile): boolean {
  return (
    profile.medical.inRecovery ||
    profile.medical.restrictions.length > 0 ||
    profile.medical.prohibitions.trim().length > 0
  )
}
