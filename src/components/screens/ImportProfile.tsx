import { useState } from 'react'
import { db } from '@/db/db'
import type { Profile } from '@/db/types'

interface Props {
  profile: Profile
  onConfirm: () => void
  onCancel: () => void
}

export default function ImportProfile({ profile, onConfirm, onCancel }: Props) {
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      await db.profiles.add({
        ...profile,
        id: undefined,
        createdAt: now,
        updatedAt: now,
      })
      // clean up URL so refresh doesn't reimport
      window.history.replaceState({}, '', window.location.pathname)
      onConfirm()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center px-6"
      style={{ minHeight: '100dvh', background: '#FFF7EC' }}
    >
      <img
        src={`${import.meta.env.BASE_URL}cat-paw.png`}
        alt=""
        width={56}
        className="mb-6"
        style={{ width: 56, height: 'auto' }}
      />

      <h1 className="text-2xl font-bold text-center mb-2" style={{ color: '#053E35' }}>
        Імпортувати профіль?
      </h1>
      <p className="text-sm text-center mb-8" style={{ color: '#666666' }}>
        Партнер хоче тренуватись разом
      </p>

      <div
        className="w-full rounded-2xl px-5 py-4 mb-8 border"
        style={{ background: '#fff', borderColor: '#FCE7D2', maxWidth: 360 }}
      >
        <div className="font-semibold text-base mb-1" style={{ color: '#1F2A2E' }}>
          {profile.name}
        </div>
        <div className="text-xs mb-1" style={{ color: '#666666' }}>
          {profile.medical.inRecovery ? '🟡 Режим відновлення' : '🟢 Звичайний режим'}
        </div>
        {profile.goals.length > 0 && (
          <div className="text-xs mt-2" style={{ color: '#6B7280' }}>
            Цілі: {profile.goals.join(', ')}
          </div>
        )}
        <div className="text-xs mt-1" style={{ color: '#6B7280' }}>
          Активність: {['', 'мінімальна', 'помірна', 'висока', 'дуже висока'][profile.activityLevel]}
        </div>
      </div>

      <div className="w-full flex flex-col gap-3" style={{ maxWidth: 360 }}>
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full rounded-2xl font-semibold text-base"
          style={{
            background: '#E85B16',
            color: '#fff',
            minHeight: 52,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Збереження…' : 'Так, додати профіль'}
        </button>
        <button
          onClick={onCancel}
          className="w-full rounded-2xl font-semibold text-base border"
          style={{
            background: 'transparent',
            color: '#053E35',
            borderColor: '#FCE7D2',
            minHeight: 52,
          }}
        >
          Скасувати
        </button>
      </div>
    </div>
  )
}
