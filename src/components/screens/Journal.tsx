import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Screen } from '@/App'
import { db } from '@/db/db'
import type { Activity, CheckIn, Profile } from '@/db/types'
import { useActiveProfile } from '@/hooks/useActiveProfile'

type Tab = 'personal' | 'together'
const TAB_KEY = 'journalTab'

export default function Journal({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile: currentProfile } = useActiveProfile()
  const [tab, setTab] = useState<Tab>((localStorage.getItem(TAB_KEY) as Tab) || 'personal')
  const [selectedId, setSelectedId] = useState<number | undefined>()

  const activities = useLiveQuery(() => db.activities.orderBy('date').reverse().toArray(), [])
  const checkins = useLiveQuery(() => db.checkins.toArray(), [])

  function setT(t: Tab) {
    setTab(t)
    localStorage.setItem(TAB_KEY, t)
  }

  const beforeMap = new Map<number, CheckIn>()
  const afterMap = new Map<number, CheckIn>()
  for (const c of checkins ?? []) {
    if (!c.activityId) continue
    if (c.type === 'before') beforeMap.set(c.activityId, c)
    else afterMap.set(c.activityId, c)
  }

  if (selectedId !== undefined) {
    const activity = activities?.find(a => a.id === selectedId)
    if (!activity) {
      setSelectedId(undefined)
      return null
    }
    return (
      <Detail
        activity={activity}
        profile={currentProfile}
        before={activity.id ? beforeMap.get(activity.id) : undefined}
        after={activity.id ? afterMap.get(activity.id) : undefined}
        onBack={() => setSelectedId(undefined)}
      />
    )
  }

  const filtered = (activities ?? []).filter(a =>
    tab === 'together' ? a.mode === 'together' : a.profileId === currentProfile?.id,
  )

  const loading = activities === undefined

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#FFF7EC',
        paddingBottom: 'calc(56px + env(safe-area-inset-bottom) + 16px)',
      }}
      className="flex flex-col"
    >
      <header className="px-5 pt-12 pb-3">
        <h1 className="text-2xl font-bold" style={{ color: '#053E35' }}>Журнал</h1>
      </header>

      <div className="px-5 pb-3 flex gap-2">
        {([
          ['personal', currentProfile?.name ?? 'Мої'] as const,
          ['together', 'Разом'] as const,
        ]).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setT(v)}
            className="flex-1 rounded-full text-sm border"
            style={{
              minHeight: 36, padding: '6px 16px',
              background: tab === v ? '#E85B16' : '#fff',
              color: tab === v ? '#fff' : '#1F2A2E',
              borderColor: tab === v ? '#E85B16' : '#FCE7D2',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex-1 px-5">
        {loading ? (
          <div className="flex items-center justify-center pt-20">
            <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={32} style={{ width: 32, height: 'auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onStart={() => onNavigate('activity')} hasAny={(activities?.length ?? 0) > 0} />
        ) : (
          <div className="space-y-3 pb-4">
            {filtered.map(a => (
              <Card
                key={a.id}
                activity={a}
                profile={currentProfile}
                after={a.id ? afterMap.get(a.id) : undefined}
                onClick={() => setSelectedId(a.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ───────── Card ─────────

function Card({
  activity, profile, after, onClick,
}: {
  activity: Activity
  profile?: Profile
  after?: CheckIn
  onClick: () => void
}) {
  const date = new Date(activity.date)
  const dateLabel = date.toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const diff = after?.difficulty
  const diffEmoji = diff == null ? '·' : diff <= 4 ? '🟢' : diff <= 7 ? '🟡' : '🔴'
  const feeling = after?.feeling
  const feelingLabel = feeling === 'better' ? '↑' : feeling === 'worse' ? '↓' : feeling === 'same' ? '→' : ''
  const hasFlag = activity.safetyLevel === 'red' || (after?.redFlags?.length ?? 0) > 0
  const modeLabel = activity.mode === 'together' ? 'Разом' : profile?.name ?? 'Профіль'

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border px-4 py-3"
      style={{ background: '#fff', borderColor: '#FCE7D2', minHeight: 72 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs capitalize" style={{ color: '#666666' }}>{dateLabel}</p>
          <p className="text-base font-semibold mt-0.5" style={{ color: '#1F2A2E' }}>
            {modeLabel} · {activity.duration} хв
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: '#1F2A2E' }}>
            <span>{diffEmoji} {diff != null ? `${diff}/10` : '—'}</span>
            {feelingLabel && <span>{feelingLabel}</span>}
            {hasFlag && <span>🚩</span>}
          </div>
        </div>
      </div>
    </button>
  )
}

// ───────── Empty state ─────────

function EmptyState({ onStart, hasAny }: { onStart: () => void; hasAny: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center pt-12 px-6 text-center">
      <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={72} className="mb-4" style={{ width: 72, height: 'auto' }} />
      <p className="text-base font-semibold mb-1" style={{ color: '#053E35' }}>
        {hasAny ? 'У цьому фільтрі поки порожньо' : 'Перший крок ще попереду'}
      </p>
      <p className="text-sm mb-6" style={{ color: '#666666' }}>
        {hasAny ? 'Спробуйте іншу вкладку' : 'Каспер чекає, коли ви почнете'}
      </p>
      {!hasAny && (
        <button
          onClick={onStart}
          className="rounded-2xl text-sm font-semibold"
          style={{ background: '#E85B16', color: '#fff', minHeight: 48, padding: '12px 24px' }}
        >
          Записати першу прогулянку
        </button>
      )}
    </div>
  )
}

// ───────── Detail ─────────

function Detail({
  activity, profile, before, after, onBack,
}: {
  activity: Activity
  profile?: Profile
  before?: CheckIn
  after?: CheckIn
  onBack: () => void
}) {
  const date = new Date(activity.date).toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const level = activity.safetyLevel
  const levelEmoji = level === 'green' ? '🟢' : level === 'yellow' ? '🟡' : '🔴'
  const levelText = level === 'green' ? 'Добрий крок'
    : level === 'yellow' ? 'Помірне навантаження'
    : 'Зафіксовано сигнал'

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#FFF7EC',
        paddingBottom: 'calc(56px + env(safe-area-inset-bottom) + 16px)',
      }}
      className="flex flex-col"
    >
      <header className="flex items-center px-5 pt-12 pb-3 gap-3">
        <button onClick={onBack} aria-label="Назад" style={{ minWidth: 44, minHeight: 44, color: '#053E35' }}
          className="flex items-center justify-center text-2xl">‹</button>
        <h1 className="text-lg font-bold capitalize flex-1" style={{ color: '#053E35' }}>{date}</h1>
      </header>

      <div className="px-5 space-y-3">
        <div className="rounded-2xl p-4 text-center" style={{ background: '#FFF0E8' }}>
          <span className="text-4xl">{levelEmoji}</span>
          <p className="text-sm mt-2 font-semibold" style={{ color: '#053E35' }}>{levelText}</p>
          <p className="text-xs mt-1" style={{ color: '#666666' }}>
            {profile?.name ?? 'Профіль'} · {activity.mode === 'together' ? 'Разом' : 'Соло'}
          </p>
        </div>

        <Section title="Сесія">
          <Row label="Тривалість" value={`${activity.duration} хв`} />
          {activity.distance && <Row label="Дистанція" value={`${activity.distance} км`} />}
          {activity.steps && <Row label="Кроки" value={String(activity.steps)} />}
          {activity.avgHeartRate && <Row label="Сер. пульс" value={`${activity.avgHeartRate}`} />}
          {activity.notes && <Row label="Нотатка" value={activity.notes} />}
        </Section>

        {before && (
          <Section title="До тренування">
            {before.sleep != null && <Row label="Сон" value={`${before.sleep}/5`} />}
            {before.fatigue != null && <Row label="Втома" value={`${before.fatigue}/5`} />}
            {before.readiness != null && <Row label="Готовність" value={`${before.readiness}/5`} />}
            {before.mood != null && <Row label="Настрій" value={`${before.mood}/5`} />}
            {before.pain && <Row label="Біль" value={before.painDetails || 'так'} />}
            {before.operationZoneDiscomfort != null && (
              <Row label="Зона операції" value={before.operationZoneDiscomfort ? 'дискомфорт' : 'нема'} />
            )}
            {before.conditions && (
              <Row label="Умови" value={
                before.conditions === 'outdoor' ? 'надворі'
                : before.conditions === 'indoor' ? 'вдома' : 'зал'
              } />
            )}
          </Section>
        )}

        {after && (
          <Section title="Після тренування">
            {after.difficulty != null && <Row label="Складність" value={`${after.difficulty}/10`} />}
            {after.fatigueAfter != null && <Row label="Втома після" value={`${after.fatigueAfter}/5`} />}
            <Row label="Самопочуття" value={
              after.feeling === 'better' ? 'краще'
              : after.feeling === 'worse' ? 'гірше' : 'так само'
            } />
            {after.discomfortAfter && (
              <Row label="Дискомфорт" value={after.discomfortDetails || 'так'} />
            )}
            {after.redFlags.length > 0 && (
              <Row label="🚩 Симптоми" value={after.redFlags.join(', ')} />
            )}
            {after.notesAfter && <Row label="Коментар" value={after.notesAfter} />}
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ background: '#fff', borderColor: '#FCE7D2' }}>
      <p className="text-xs uppercase font-semibold tracking-wider mb-2" style={{ color: '#666666' }}>{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span style={{ color: '#666666' }}>{label}</span>
      <span className="font-medium text-right" style={{ color: '#1F2A2E' }}>{value}</span>
    </div>
  )
}
