import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts'
import type { Screen } from '@/App'
import { db } from '@/db/db'
import type { Activity, CheckIn, Profile } from '@/db/types'
import { calcStreak } from '@/logic/streak'

type Tab = 'serge' | 'olena' | 'together'
const TAB_KEY = 'statsTab'

export default function Statistics({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [tab, setTab] = useState<Tab>((localStorage.getItem(TAB_KEY) as Tab) || 'serge')

  const activities = useLiveQuery(() => db.activities.toArray(), [])
  const checkins = useLiveQuery(() => db.checkins.toArray(), [])
  const profiles = useLiveQuery(() => db.profiles.toArray(), [])

  function setT(t: Tab) {
    setTab(t)
    localStorage.setItem(TAB_KEY, t)
  }

  const loading = activities === undefined || checkins === undefined || profiles === undefined

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
        <h1 className="text-2xl font-bold" style={{ color: '#053E35' }}>Підсумки</h1>
      </header>

      <div className="px-5 pb-3 flex gap-2">
        {([['serge', 'Серж'], ['olena', 'Олена'], ['together', 'Разом']] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setT(v)}
            className="flex-1 rounded-full text-sm border"
            style={{
              minHeight: 40, padding: '8px 16px',
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
            <span className="text-3xl">🐾</span>
          </div>
        ) : tab === 'together' ? (
          <TogetherView activities={activities} />
        ) : (
          <PersonalView
            mode={tab}
            activities={activities}
            checkins={checkins}
            profile={profiles.find(p => p.mode === tab)}
          />
        )}
      </div>
    </div>
  )
}

// ───────── Personal view ─────────

function PersonalView({
  mode, activities, checkins, profile,
}: {
  mode: 'serge' | 'olena'
  activities: Activity[]
  checkins: CheckIn[]
  profile?: Profile
}) {
  if (!profile) {
    return (
      <div className="text-center pt-12">
        <span className="text-5xl block mb-3">🐾</span>
        <p className="text-base" style={{ color: '#053E35' }}>Профіль ще не створено</p>
      </div>
    )
  }
  const my = activities.filter(a => a.profileId === profile.id)
  const myAfter = checkins.filter(c => c.profileId === profile.id && c.type === 'after')

  const start = dayBack(6)
  const week = my.filter(a => a.date.slice(0, 10) >= start)
  const weekAfter = myAfter.filter(c => c.date.slice(0, 10) >= start)

  const totalMinutes = week.reduce((s, a) => s + a.duration, 0)
  const sessions = week.filter(a => !a.isRestDay).length
  const streak = calcStreak(my.map(a => ({ date: a.date })))
  const diffs: number[] = []
  for (const c of weekAfter) if (c.difficulty != null) diffs.push(c.difficulty)
  const avgDiff = diffs.length ? diffs.reduce((s, d) => s + d, 0) / diffs.length : null

  // 7-day chart data
  const days = Array.from({ length: 7 }, (_, i) => dayBack(6 - i))
  const chartData = days.map(d => {
    const sumMin = my.filter(a => a.date.slice(0, 10) === d).reduce((s, a) => s + a.duration, 0)
    return { d: d.slice(5), mins: sumMin }
  })

  // Mood trend (after-checkins by date)
  const moodData = days.map(d => {
    const day = weekAfter.filter(c => c.date.slice(0, 10) === d)
    if (day.length === 0) return { d: d.slice(5), m: null }
    const sum = day.reduce((s, c) => {
      const v = c.feeling === 'better' ? 5 : c.feeling === 'same' ? 3 : c.feeling === 'worse' ? 1 : 0
      return s + v
    }, 0)
    return { d: d.slice(5), m: sum / day.length }
  })

  // Discomfort markers (Олена)
  const discomfortDays = mode === 'olena'
    ? weekAfter.filter(c => c.discomfortAfter).length
    : 0

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        <KPI label="Хвилин" value={totalMinutes} />
        <KPI label="Прогулянок" value={sessions} />
        <KPI label="Серія" value={streak} suffix={streak === 1 ? 'день' : 'днів'} />
        <KPI label="Складність" value={avgDiff != null ? avgDiff.toFixed(1) : '—'} suffix={avgDiff != null ? '/10' : ''} />
      </div>

      <Card title="Активність за 7 днів">
        <div style={{ width: '100%', height: 140 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #FCE7D2', fontSize: 12 }} />
              <Bar dataKey="mins" fill="#E85B16" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {moodData.some(m => m.m !== null) && (
        <Card title="Самопочуття після">
          <div style={{ width: '100%', height: 120 }}>
            <ResponsiveContainer>
              <LineChart data={moodData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #FCE7D2', fontSize: 12 }} />
                <Line type="monotone" dataKey="m" stroke="#F39A2F" strokeWidth={2} dot={{ r: 3, fill: '#F39A2F' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {mode === 'olena' && (
        <Card title="Маркери відновлення">
          <Row label="Днів з дискомфортом" value={String(discomfortDays)} />
          <Row label="Стан зони операції" value={profile.medical.inRecovery ? 'процес' : 'нема даних'} />
          <Row label="Активних сесій тижня" value={String(sessions)} />
        </Card>
      )}

      <Card title="Прогрес">
        <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>
          Ціль: {profile.schedule.targetMinutes} хв × {profile.schedule.daysPerWeek === 'flexible' ? 'гнучко' : profile.schedule.daysPerWeek}
        </p>
        <div className="h-2 rounded-full mb-1" style={{ background: '#FCE7D2' }}>
          <div className="h-full rounded-full" style={{
            width: `${Math.min(100, (sessions / 5) * 100)}%`,
            background: '#E85B16',
          }} />
        </div>
        <p className="text-xs" style={{ color: '#1F2A2E' }}>{sessions} із 5 рекомендованих</p>
      </Card>
    </div>
  )
}

// ───────── Together view ─────────

function TogetherView({ activities }: { activities: Activity[] }) {
  const together = activities.filter(a => a.mode === 'together')
  const start = dayBack(6)
  const weekT = together.filter(a => a.date.slice(0, 10) >= start)

  const weekMinutes = weekT.reduce((s, a) => s + a.duration, 0)
  const totalSessions = together.length
  const streakAll = calcStreak(together.map(a => ({ date: a.date })))

  // Regularity: weeks with at least 1 together activity in past 8 weeks
  const weeksMap = new Map<string, number>()
  for (const a of together) {
    const d = new Date(a.date)
    const monday = new Date(d)
    monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
    const key = monday.toISOString().slice(0, 10)
    weeksMap.set(key, (weeksMap.get(key) ?? 0) + 1)
  }
  const recentWeeks = Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i * 7)
    const monday = new Date(d)
    monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
    return monday.toISOString().slice(0, 10)
  }).reverse()

  if (together.length === 0) {
    return (
      <div className="text-center pt-12">
        <span className="text-6xl block mb-4">👣</span>
        <p className="text-base font-semibold mb-1" style={{ color: '#053E35' }}>
          Спільних прогулянок ще не було
        </p>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Оберіть «Разом» при виборі профілю
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        <KPI label="Тижня разом" value={weekT.length} />
        <KPI label="Хвилин тижня" value={weekMinutes} />
        <KPI label="Всього сесій" value={totalSessions} />
        <KPI label="Серія" value={streakAll} suffix={streakAll === 1 ? 'день' : 'днів'} />
      </div>

      <Card title="Регулярність — 8 тижнів">
        <div className="flex gap-1.5 items-end" style={{ height: 60 }}>
          {recentWeeks.map(week => {
            const count = weeksMap.get(week) ?? 0
            const intensity = Math.min(1, count / 3)
            return (
              <div
                key={week}
                className="flex-1 rounded"
                title={`${week}: ${count} сесій`}
                style={{
                  height: count > 0 ? `${20 + intensity * 40}px` : '8px',
                  background: count > 0 ? '#E85B16' : '#FCE7D2',
                  opacity: count > 0 ? 0.4 + intensity * 0.6 : 1,
                }}
              />
            )
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
          Кожен стовпчик = тиждень
        </p>
      </Card>

      <Card title="Принцип «Разом»">
        <p className="text-sm leading-relaxed" style={{ color: '#1F2A2E' }}>
          Темп, дистанція і складність — у персональних статистиках. Тут — тільки спільне: час, регулярність, серія.
        </p>
      </Card>
    </div>
  )
}

// ───────── Helpers ─────────

function dayBack(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function KPI({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ background: '#fff', borderColor: '#FCE7D2' }}>
      <p className="text-xs uppercase font-semibold tracking-wider mb-3" style={{ color: '#9CA3AF' }}>{title}</p>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-1">
      <span style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="font-medium" style={{ color: '#1F2A2E' }}>{value}</span>
    </div>
  )
}
