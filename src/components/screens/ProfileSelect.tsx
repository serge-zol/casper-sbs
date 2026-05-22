import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Screen } from '@/App'
import type { Profile } from '@/db/types'
import ShareProfileModal from '@/components/ui/ShareProfileModal'

function playCallPurr() {
  try {
    const ctx = new AudioContext()

    const play = () => {
      const t = ctx.currentTime

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(150, t)
      osc.frequency.linearRampToValueAtTime(200, t + 0.8)  // glide вгору — кіт питає "хто?"

      const lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 25

      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.5

      const carrierGain = ctx.createGain()
      carrierGain.gain.value = 0.5

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 600
      filter.Q.value = 0.8

      const master = ctx.createGain()
      master.gain.setValueAtTime(0, t)
      master.gain.linearRampToValueAtTime(0.10, t + 0.1)
      master.gain.setValueAtTime(0.10, t + 1.4)
      master.gain.linearRampToValueAtTime(0, t + 1.8)

      lfo.connect(lfoGain)
      lfoGain.connect(carrierGain.gain)
      osc.connect(carrierGain)
      carrierGain.connect(filter)
      filter.connect(master)
      master.connect(ctx.destination)

      osc.start(t)
      lfo.start(t)
      osc.stop(t + 1.8)
      lfo.stop(t + 1.8)

      osc.onended = () => ctx.close()
    }

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => ctx.close())
    } else {
      play()
    }
  } catch {
    // AudioContext недоступний
  }
}

export default function ProfileSelect({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const profiles = useLiveQuery(() => db.profiles.toArray(), [])
  const [sharingProfile, setSharingProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    function onUnlocked() {
      playCallPurr()
      intervalId = setInterval(playCallPurr, 60_000)
    }

    let probe: AudioContext
    try {
      probe = new AudioContext()
    } catch {
      return
    }

    if (probe.state === 'running') {
      probe.close()
      onUnlocked()
    } else {
      probe.close()
      document.addEventListener('click', onUnlocked, { once: true })
    }

    return () => {
      document.removeEventListener('click', onUnlocked)
      if (intervalId !== null) clearInterval(intervalId)
    }
  }, [])

  function selectProfile(profileId: number, mode: 'solo' | 'together') {
    localStorage.setItem('activeProfileId', String(profileId))
    localStorage.setItem('activeMode', mode)
    localStorage.setItem('lastProfileId', String(profileId))
    onNavigate('home')
  }

  if (profiles === undefined) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFF7EC' }} className="flex items-center justify-center">
        <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={32} style={{ width: 32, height: 'auto' }} />
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFF7EC' }}
        className="flex flex-col items-center justify-center px-6 text-center">
        <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={56} className="mb-4" style={{ width: 56, height: 'auto' }} />
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
    <>
      <div style={{ minHeight: '100dvh', background: '#FFF7EC' }} className="flex flex-col px-6 pt-16 pb-10">
        <div className="flex items-center mb-1" style={{ gap: 12 }}>
          <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={32} style={{ width: 32, height: 'auto', flexShrink: 0 }} />
          <h1 className="text-2xl font-bold" style={{ color: '#053E35' }}>Хм-м-м... я вже чекаю. Хто йде?</h1>
        </div>
        <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>{today}</p>

        {profiles.map(p => (
          <div key={p.id} className="relative mb-3">
            <button
              onClick={() => selectProfile(p.id!, 'solo')}
              className="w-full flex items-center justify-between rounded-2xl px-5 py-4 border"
              style={{ background: '#fff', borderColor: '#FCE7D2', minHeight: 72 }}
            >
              <div className="text-left">
                <div className="font-semibold text-base" style={{ color: '#1F2A2E' }}>{p.name}</div>
                <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  {p.medical.inRecovery ? '🟡 Режим відновлення' : '🟢 Звичайний режим'}
                </div>
              </div>
              {/* spacer so text doesn't overlap share button */}
              <div style={{ width: 40 }} />
            </button>

            {/* Share / QR button */}
            <button
              onClick={e => { e.stopPropagation(); setSharingProfile(p) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
              style={{ width: 36, height: 36, background: '#FFF0E8', color: '#E85B16' }}
              title="Поділитись профілем"
            >
              <QrIcon />
            </button>
          </div>
        ))}

        {profiles.length >= 2 && (
          <button
            onClick={() => {
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

      </div>

      {sharingProfile && (
        <ShareProfileModal
          profile={sharingProfile}
          onClose={() => setSharingProfile(null)}
        />
      )}
    </>
  )
}

function QrIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
      <path d="M14 14h3v3h-3z" fill="currentColor" stroke="none" />
      <path d="M17 14h4" />
      <path d="M14 17v4" />
      <path d="M17 17h4v4" />
    </svg>
  )
}
