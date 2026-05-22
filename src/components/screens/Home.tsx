import { Settings } from 'lucide-react'
import type { Screen } from '@/App'
import { useActiveProfile } from '@/hooks/useActiveProfile'
import { useRecommendation } from '@/hooks/useRecommendation'
import { useWeekStats } from '@/hooks/useWeekStats'
import Button from '@/components/ui/Button'

export default function Home({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile, mode } = useActiveProfile()
  const rec = useRecommendation(profile)
  const stats = useWeekStats(profile?.id)

  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFF7EC' }}
        className="flex items-center justify-center">
        <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={32} style={{ width: 32, height: 'auto' }} />
      </div>
    )
  }

  const today = new Date().toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const isRest = rec?.cautionLevel === 'red' || rec?.paceType === 'rest'
  const cautionBg = rec?.cautionLevel === 'green'
    ? '#CDE1D5'
    : rec?.cautionLevel === 'yellow'
      ? '#FFF0D6'
      : rec?.cautionLevel === 'red'
        ? '#FFE5E0'
        : '#FFF0E8'
  const cautionBorder = rec?.cautionLevel === 'red'
    ? '#E85B16'
    : rec?.cautionLevel === 'yellow'
      ? '#F39A2F'
      : '#E85B16'

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#FFF7EC',
        paddingBottom: 'calc(56px + env(safe-area-inset-bottom) + 16px)',
      }}
      className="flex flex-col"
    >
      {/* Header */}
      <header className="flex items-start justify-between px-5 pt-12 pb-3">
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{today}</p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: '#053E35' }}>
            Привіт, {profile.name}
          </h1>
          {mode === 'together' && (
            <p className="text-xs mt-1" style={{ color: '#E85B16' }}>👣 Режим «Разом»</p>
          )}
        </div>
        <button
          onClick={() => onNavigate('settings')}
          style={{ minWidth: 44, minHeight: 44, color: '#053E35' }}
          className="flex items-center justify-center"
        >
          <Settings size={22} />
        </button>
      </header>

      {/* Recommendation card */}
      <div className="px-5">
        <div
          className="rounded-2xl p-5 border"
          style={{ background: cautionBg, borderColor: cautionBorder }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase font-semibold tracking-wider"
              style={{ color: cautionBorder }}>
              Сьогодні
            </p>
            {rec && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: rec.cautionLevel === 'green' ? '#2D7A4F' : rec.cautionLevel === 'yellow' ? '#E85B16' : '#C0392B',
              }}>
                {rec.cautionLevel === 'green' ? '✓ Все ок' : rec.cautionLevel === 'yellow' ? '! Обережно' : '⊘ День відновлення'}
              </span>
            )}
          </div>
          {rec ? (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold" style={{ color: '#053E35' }}>
                  {rec.targetDuration}
                </span>
                <span className="text-base" style={{ color: '#1F2A2E' }}>
                  {rec.targetDuration === 0 ? 'відпочинок' : 'хвилин'}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-1" style={{ color: '#1F2A2E' }}>
                {rec.reason}
              </p>
              {rec.cautionLevel === 'red' && (
                <p className="flex items-center gap-1.5 text-xs mt-2" style={{ color: '#053E35' }}>
                  <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={16} style={{ width: 16, height: 'auto', flexShrink: 0, filter: 'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(600%) hue-rotate(340deg) brightness(95%)' }} />
                  Сьогодні — день відновлення. Дай тілу відпочити, Каспер порадить легку прогулянку завтра 🐾
                </p>
              )}
              {rec.safetyNotes && (
                <p className="flex items-center gap-1.5 text-xs mt-2" style={{ color: '#053E35' }}>
                  <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={16} style={{ width: 16, height: 'auto', flexShrink: 0, filter: 'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(600%) hue-rotate(340deg) brightness(95%)' }} />
                  {rec.safetyNotes}
                </p>
              )}
            </>
          ) : (
            <div className="h-16 rounded-xl animate-pulse" style={{ background: '#FCE7D2' }} />
          )}
        </div>

        {/* CTA */}
        <div className="mt-4">
          {isRest ? (
            <Button variant="secondary" onClick={() => onNavigate('activity')}>
              День відновлення
            </Button>
          ) : (
            <Button onClick={() => onNavigate('activity')}>
              Почати сьогоднішній крок
            </Button>
          )}
        </div>
      </div>

      {/* KPI grid */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#053E35' }}>Тиждень</h2>
        <div className="grid grid-cols-2 gap-3">
          <KPI label="Хвилин" value={stats?.totalMinutes ?? 0} />
          <KPI label="Прогулянок" value={stats?.sessions ?? 0} />
          <KPI label="Серія" value={stats?.streak ?? 0} suffix={stats?.streak === 1 ? 'день' : 'днів'} />
          <KPI label="Разом" value={stats?.jointMinutes ?? 0} suffix="хв" />
        </div>
      </div>

      {/* Mood trend */}
      {stats?.avgMoodAfter != null && (
        <div className="px-5 mt-6">
          <div className="rounded-2xl p-4 border" style={{ background: '#fff', borderColor: '#FCE7D2' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>
              Самопочуття після
            </p>
            <p className="text-sm" style={{ color: '#053E35' }}>
              {stats.avgMoodAfter >= 4
                ? '↑ Стабільно ставало краще'
                : stats.avgMoodAfter >= 2.5
                  ? '→ Без змін'
                  : '↓ Варто перевірити навантаження'}
            </p>
          </div>
        </div>
      )}

      {/* Casper phrase */}
      {rec && (
        <div className="px-5 mt-6">
          <div className="rounded-2xl p-4" style={{ background: '#CDE1D5' }}>
            <p className="flex items-start gap-1.5 text-sm leading-relaxed" style={{ color: '#053E35', whiteSpace: 'pre-line' }}>
              <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={16} style={{ width: 16, height: 'auto', flexShrink: 0, marginTop: 2, filter: 'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(600%) hue-rotate(340deg) brightness(95%)' }} />
              {rec.casperPhrase}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ background: '#fff', borderColor: '#FCE7D2' }}>
      <p className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="mt-1">
        <span className="text-2xl font-bold" style={{ color: '#053E35' }}>{value}</span>
        {suffix && <span className="text-xs ml-1" style={{ color: '#9CA3AF' }}>{suffix}</span>}
      </p>
    </div>
  )
}
