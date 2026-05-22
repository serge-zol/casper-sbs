import { useState, type ReactNode } from 'react'

declare const __BUILD_LABEL__: string
import type { Screen } from '@/App'
import { db } from '@/db/db'
import type { Profile } from '@/db/types'
import { useActiveProfile } from '@/hooks/useActiveProfile'

const RESTRICTIONS = [
  { id: 'surgery', label: 'Операція або травма' },
  { id: 'heart', label: 'Серце / тиск' },
  { id: 'joints', label: 'Суглоби' },
  { id: 'pain', label: 'Хронічний біль' },
  { id: 'pregnancy', label: 'Вагітність' },
]
const GOALS = [
  'Повернути ритм', 'Відновлення', 'Витривалість',
  'Підготовка до бігу', 'Разом з партнером', 'Самопочуття',
]

export default function Settings({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile, profileId } = useActiveProfile()
  const [reminderEnabled, setReminderEnabled] = useState(
    localStorage.getItem('reminderEnabled') === 'true',
  )
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('soundEnabled') === 'true',
  )

  async function patch(p: Partial<Profile>) {
    if (!profileId) return
    await db.profiles.update(profileId, { ...p, updatedAt: new Date().toISOString() })
  }
  async function patchMedical(m: Partial<Profile['medical']>) {
    if (!profile) return
    await patch({ medical: { ...profile.medical, ...m } })
  }
  async function patchSchedule(s: Partial<Profile['schedule']>) {
    if (!profile) return
    await patch({ schedule: { ...profile.schedule, ...s } })
  }

  function toggleReminder() {
    const v = !reminderEnabled
    setReminderEnabled(v)
    localStorage.setItem('reminderEnabled', String(v))
  }
  function toggleSound() {
    const v = !soundEnabled
    setSoundEnabled(v)
    localStorage.setItem('soundEnabled', String(v))
  }

  async function deleteAll() {
    if (!window.confirm('Видалити всі дані без можливості відновлення?')) return
    await db.delete()
    localStorage.clear()
    window.location.reload()
  }

  function switchProfile() {
    localStorage.removeItem('lastProfileId')
    onNavigate('profile-select')
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFF7EC' }} className="flex items-center justify-center">
        <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={32} style={{ width: 32, height: 'auto' }} />
      </div>
    )
  }

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
        <button onClick={() => onNavigate('home')}
          aria-label="Назад"
          style={{ minWidth: 44, minHeight: 44, color: '#053E35' }}
          className="flex items-center justify-center text-2xl">‹</button>
        <h1 className="text-2xl font-bold flex-1" style={{ color: '#053E35' }}>Налаштування</h1>
      </header>

      <div className="px-5 space-y-4 pb-4">
        {/* A — Профіль */}
        <Section title="Профіль">
          <Field label="Ім'я">
            <input
              aria-label="Ім'я"
              value={profile.name}
              onChange={e => patch({ name: e.target.value })}
              className="w-full rounded-xl border px-3 outline-none"
              style={{ fontSize: 16, height: 44, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
            />
          </Field>
          <Field label="Вікова група">
            <Pills
              value={profile.ageGroup}
              options={['20-30', '31-40', '41-50', '51-60', '60+']}
              onChange={v => patch({ ageGroup: v as Profile['ageGroup'] })}
            />
          </Field>
          <Field label="Рівень активності">
            <Pills
              value={String(profile.activityLevel)}
              options={['1', '2', '3', '4']}
              onChange={v => patch({ activityLevel: Number(v) as Profile['activityLevel'] })}
            />
          </Field>
          <Field label="Цілі">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GOALS.map(g => {
                const active = profile.goals.includes(g)
                return (
                  <Pill key={g} active={active} style={{ flex: '1 1 45%' }} onClick={() => patch({
                    goals: active ? profile.goals.filter(x => x !== g) : [...profile.goals, g],
                  })}>{g}</Pill>
                )
              })}
            </div>
          </Field>
          <button
            onClick={switchProfile}
            className="w-full mt-2 rounded-xl text-sm font-medium border py-2"
            style={{ minHeight: 44, borderColor: '#FCE7D2', color: '#053E35' }}
          >
            Перемкнути / додати профіль
          </button>
        </Section>

        {/* Б — Здоров'я */}
        <Section title="🔒 Здоров'я та обмеження">
          <ToggleRow
            label="Зараз у процесі відновлення"
            value={profile.medical.inRecovery}
            onChange={v => patchMedical({ inRecovery: v })}
          />
          {profile.medical.inRecovery && (
            <>
              <Field label="Вид обмеження">
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map(r => {
                    const active = profile.medical.restrictions.includes(r.id)
                    return (
                      <Pill key={r.id} active={active} onClick={() => patchMedical({
                        restrictions: active
                          ? profile.medical.restrictions.filter(x => x !== r.id)
                          : [...profile.medical.restrictions, r.id],
                      })}>{r.label}</Pill>
                    )
                  })}
                </div>
              </Field>
              <Field label="Заборони лікаря">
                <textarea
                  aria-label="Заборони лікаря"
                  value={profile.medical.prohibitions}
                  onChange={e => patchMedical({ prohibitions: e.target.value })}
                  placeholder="Наприклад: не бігти, пульс не вище 120"
                  rows={2}
                  className="w-full rounded-xl border px-3 py-2 outline-none resize-none"
                  style={{ fontSize: 16, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
                />
              </Field>
              <Field label="Нотатки лікаря">
                <textarea
                  aria-label="Нотатки лікаря"
                  value={profile.medical.doctorNotes ?? ''}
                  onChange={e => patchMedical({ doctorNotes: e.target.value })}
                  placeholder="Цитати, рекомендації"
                  rows={2}
                  className="w-full rounded-xl border px-3 py-2 outline-none resize-none"
                  style={{ fontSize: 16, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
                />
              </Field>
            </>
          )}
          <p className="text-xs mt-2" style={{ color: '#666666' }}>
            🔒 Дані Олени не видно Сержу ніде. Тільки статус «режим відновлення» у спільній статистиці.
          </p>
        </Section>

        {/* В — Розклад */}
        <Section title="Розклад і нагадування">
          <Field label="Тривалість прогулянки">
            <Pills
              value={String(profile.schedule.targetMinutes)}
              options={['15', '25', '40']}
              onChange={v => patchSchedule({ targetMinutes: Number(v) })}
            />
          </Field>
          <Field label="Час доби">
            <Pills
              value={profile.schedule.timeOfDay}
              options={['morning', 'day', 'evening', 'flexible']}
              labels={{ morning: 'Ранок', day: 'День', evening: 'Вечір', flexible: 'По-різному' }}
              onChange={v => patchSchedule({ timeOfDay: v as Profile['schedule']['timeOfDay'] })}
            />
          </Field>
          <Field label="Тренувань на тиждень">
            <Pills
              value={profile.schedule.daysPerWeek}
              options={['1-2', '3-4', '5+', 'flexible']}
              labels={{ '1-2': '1–2', '3-4': '3–4', '5+': '5+', flexible: 'Розберемось' }}
              onChange={v => patchSchedule({ daysPerWeek: v as Profile['schedule']['daysPerWeek'] })}
            />
          </Field>
          <ToggleRow
            label="М'які нагадування"
            value={reminderEnabled}
            onChange={toggleReminder}
          />
        </Section>

        {/* Г — Система */}
        <Section title="Система">
          <ToggleRow
            label="Звук муркотіння"
            value={soundEnabled}
            onChange={toggleSound}
          />
          <p className="text-xs" style={{ color: '#666666' }}>За замовчуванням: вимкнено</p>
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #FCE7D2' }}>
            <Row label="Версія" value={__BUILD_LABEL__.split(' ').slice(0, 5).join(' ')} />
            <Row label="Мова" value="Українська" />
            <Row label="Сховище" value="IndexedDB (локально)" />
          </div>
          <button
            onClick={deleteAll}
            className="w-full mt-4 rounded-xl text-sm font-semibold py-3"
            style={{ minHeight: 44, background: '#FFE5E0', color: '#E85B16' }}
          >
            Видалити всі дані
          </button>
        </Section>

        {/* Текст безпеки */}
        <div className="rounded-2xl p-4" style={{ background: '#CDE1D5' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#053E35' }}>⚠️ Важливо</p>
          <p className="text-xs leading-relaxed" style={{ color: '#053E35' }}>
            Цей застосунок не є медичною консультацією. Якщо є гострий біль, різке погіршення стану або лікарські обмеження — тренування треба узгоджувати з лікарем або реабілітологом.
          </p>
        </div>
      </div>
    </div>
  )
}

// ───────── UI helpers ─────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ background: '#fff', borderColor: '#FCE7D2' }}>
      <p className="text-xs uppercase font-semibold tracking-wider mb-3" style={{ color: '#053E35' }}>{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: '#053E35' }}>{label}</p>
      {children}
    </div>
  )
}

function Pill({
  active, onClick, children, style: extraStyle,
}: { active: boolean; onClick: () => void; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full text-sm border px-3"
      style={{
        minHeight: 36, padding: '6px 14px',
        background: active ? '#E85B16' : '#fff',
        color: active ? '#fff' : '#1F2A2E',
        borderColor: active ? '#E85B16' : '#FCE7D2',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  )
}

function Pills({
  value, options, onChange, labels,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  labels?: Record<string, string>
}) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map(o => (
        <Pill key={o} active={value === o} onClick={() => onChange(o)}
          style={{ flex: 1, flexShrink: 0, padding: '6px 2px', fontSize: 13, whiteSpace: 'nowrap' }}>
          {labels?.[o] ?? o}
        </Pill>
      ))}
    </div>
  )
}

function ToggleRow({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm" style={{ color: '#1F2A2E' }}>{label}</span>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className="rounded-full"
        style={{
          width: 44, height: 26, minWidth: 44,
          background: value ? '#E85B16' : '#E5E7EB',
          position: 'relative',
          transition: 'background 0.15s',
          flexShrink: 0,
        }}
      >
        <span
          className="absolute top-1 rounded-full bg-white"
          style={{ width: 18, height: 18, left: value ? 22 : 4, transition: 'left 0.15s' }}
        />
      </button>
    </div>
  )
}

function Row({ label, value, italic }: { label: string; value: string; italic?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-1">
      <span style={{ color: '#666666' }}>{label}</span>
      <span className="font-medium" style={{ color: '#1F2A2E', fontStyle: italic ? 'italic' : 'normal' }}>{value}</span>
    </div>
  )
}
