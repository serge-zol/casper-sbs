import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Screen } from '@/App'

export default function ProfileSelect({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const profiles = useLiveQuery(() => db.profiles.toArray(), [])

  function selectProfile(profileId: number, mode: 'solo' | 'together') {
    localStorage.setItem('activeProfileId', String(profileId))
    localStorage.setItem('activeMode', mode)
    onNavigate('home')
  }

  if (profiles === undefined) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFF7EC' }} className="flex items-center justify-center">
        <span className="text-3xl">🐾</span>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFF7EC' }}
        className="flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">🐾</span>
        <p className="text-base mb-6" style={{ color: '#053E35' }}>Профілів ще немає</p>
        <button
          onClick={() => { localStorage.removeItem('onboardingDone'); onNavigate('welcome') }}
          className="rounded-2xl text-sm font-semibold"
          style={{ background: '#E85B16', color: '#fff', minHeight: 48, padding: '12px 24px' }}
        >
          Почати онбординг
        </button>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ minHeight: '100dvh', background: '#FFF7EC' }} className="flex flex-col px-6 pt-16 pb-10">
      <span className="text-4xl mb-2">🐾</span>
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#053E35' }}>Хто тренується?</h1>
      <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>{today}</p>

      {profiles.map(p => (
        <button
          key={p.id}
          onClick={() => selectProfile(p.id!, 'solo')}
          className="w-full flex items-center justify-between rounded-2xl px-5 py-4 mb-3 border"
          style={{ background: '#fff', borderColor: '#FCE7D2', minHeight: 72 }}
        >
          <div className="text-left">
            <div className="font-semibold text-base" style={{ color: '#1F2A2E' }}>{p.name}</div>
            <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              {p.medical.inRecovery ? '🟡 Режим відновлення' : '🟢 Звичайний режим'}
            </div>
          </div>
          <span style={{ color: '#E85B16', fontSize: 24, lineHeight: 1 }}>›</span>
        </button>
      ))}

      {profiles.length >= 2 && (
        <button
          onClick={() => {
            // Для Разом — використовуємо профіль з відновленням (він задає обережний темп),
            // або profiles[0] якщо такого немає.
            const recoveryProfile = profiles.find(p => p.medical.inRecovery)
            const togetherProfile = recoveryProfile ?? profiles[0]
            selectProfile(togetherProfile.id!, 'together')
          }}
          className="w-full rounded-2xl px-5 py-4 mt-1 border text-left"
          style={{ background: '#FFF0E8', borderColor: '#E85B16', minHeight: 72 }}
        >
          <div className="font-semibold text-base" style={{ color: '#E85B16' }}>👣 Разом</div>
          <div className="text-xs mt-1" style={{ color: '#F39A2F' }}>Спільна прогулянка для обох</div>
        </button>
      )}

      <button
        onClick={() => { localStorage.removeItem('onboardingDone'); onNavigate('welcome') }}
        className="mt-8 text-xs"
        style={{ color: '#9CA3AF', minHeight: 36 }}
      >
        + Додати ще один профіль
      </button>
    </div>
  )
}
