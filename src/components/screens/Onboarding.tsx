import { useState, type ReactNode, type CSSProperties } from 'react'
import { db } from '@/db/db'
import type { Profile } from '@/db/types'
import Button from '@/components/ui/Button'

type Phase = 'splash' | 1 | 2 | 3 | 4 | 5 | 6 | 7

interface Draft {
  mode: 'serge' | 'olena' | 'custom'
  name: string
  ageGroup: Profile['ageGroup']
  gender?: Profile['gender']
  activityLevel: Profile['activityLevel']
  goals: string[]
  inRecovery: boolean
  restrictions: string[]
  prohibitions: string
  daysPerWeek: Profile['schedule']['daysPerWeek']
  timeOfDay: Profile['schedule']['timeOfDay']
  targetMinutes: number
}

const DEFAULT: Draft = {
  mode: 'custom', name: '', ageGroup: '31-40', activityLevel: 2,
  goals: [], inRecovery: false, restrictions: [], prohibitions: '',
  daysPerWeek: '3-4', timeOfDay: 'flexible', targetMinutes: 25,
}

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>('splash')
  const [draft, setDraft] = useState<Draft>(DEFAULT)
  const [saving, setSaving] = useState(false)

  const update = (p: Partial<Draft>) => setDraft(d => ({ ...d, ...p }))

  function next() {
    if (phase === 'splash') return setPhase(1)
    if (phase < 7) return setPhase((phase + 1) as Phase)
    save()
  }

  function back() {
    if (typeof phase === 'number' && phase > 1) setPhase((phase - 1) as Phase)
  }

  async function save() {
    if (saving) return
    setSaving(true)
    const now = new Date().toISOString()
    const defaultName = draft.mode === 'serge' ? 'Серж' : draft.mode === 'olena' ? 'Олена' : 'Профіль'
    await db.profiles.add({
      name: draft.name.trim() || defaultName,
      mode: draft.mode,
      ageGroup: draft.ageGroup,
      gender: draft.gender,
      activityLevel: draft.activityLevel,
      goals: draft.goals,
      schedule: {
        daysPerWeek: draft.daysPerWeek,
        timeOfDay: draft.timeOfDay,
        targetMinutes: draft.targetMinutes,
      },
      medical: {
        inRecovery: draft.inRecovery,
        restrictions: draft.restrictions,
        prohibitions: draft.prohibitions.trim(),
      },
      createdAt: now,
      updatedAt: now,
    })
    localStorage.setItem('onboardingDone', 'true')
    onComplete()
  }

  if (phase === 'splash') {
    return (
      <div
        className="flex flex-col items-center justify-center px-8 text-center"
        style={{ minHeight: '100dvh', background: '#053E35' }}
      >
        {/* Сліди Каспера */}
        <img
          src={`${import.meta.env.BASE_URL}cat-paw.png`}
          alt="Сліди Каспера"
          width={80}
          className="mb-8"
          style={{ width: 80, height: 'auto' }}
        />

        <h1
          className="text-4xl font-bold mb-5 leading-tight"
          style={{ color: '#E85B16', letterSpacing: '-0.01em' }}
        >
          Каспер.<br />Крок за кроком.
        </h1>

        <p
          className="text-base mb-6 leading-snug max-w-xs"
          style={{ color: '#FFF7EC' }}
        >
          AI-супутник<br />
          для поступового повернення у форму
        </p>

        <p
          className="text-base font-semibold mb-12"
          style={{ color: '#F39A2F', letterSpacing: '0.02em' }}
        >
          Не рекорд. Ритм, що тримає.
        </p>

        <button
          onClick={next}
          className="w-full max-w-xs rounded-2xl text-base font-semibold"
          style={{ background: '#E85B16', color: '#fff', minHeight: 56, padding: '14px 24px' }}
        >
          Почати
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFF7EC' }} className="flex flex-col">
      <div className="flex items-center px-5 pt-12 pb-2 gap-3">
        <div style={{ minWidth: 44 }} />
        <div className="flex gap-1.5 flex-1">
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <div
              key={n}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: n <= (phase as number) ? '#E85B16' : '#FCE7D2' }}
            />
          ))}
        </div>
        <div style={{ minWidth: 44 }} className="text-right text-xs text-gray-400">{phase}/7</div>
      </div>

      <div className="flex-1 px-6 pt-6 pb-4 overflow-y-auto">
        {phase === 1 && <Step1 draft={draft} update={update} />}
        {phase === 2 && <Step2 draft={draft} update={update} />}
        {phase === 3 && <Step3 draft={draft} update={update} />}
        {phase === 4 && <Step4 draft={draft} update={update} />}
        {phase === 5 && <Step5 draft={draft} update={update} />}
        {phase === 6 && <Step6 draft={draft} update={update} />}
        {phase === 7 && <Step7 />}
      </div>

      <div className="px-6 pb-10 flex gap-3">
        <button
          onClick={back}
          style={{
            flex: 1,
            minHeight: 56,
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 600,
            border: '2px solid #E85B16',
            background: 'transparent',
            color: '#E85B16',
            cursor: 'pointer',
            visibility: phase === 1 ? 'hidden' : 'visible',
          }}
        >
          Назад
        </button>
        <Button onClick={next} disabled={saving} style={{ flex: 1, width: 'auto' }}>
          {phase === 7 ? (saving ? 'Зберігаємо…' : <span>Почати <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={20} style={{ width: 20, height: 'auto', display: 'inline', verticalAlign: 'middle', filter: 'brightness(0) invert(1) opacity(0.85)' }} /></span>) : 'Далі'}
        </Button>
      </div>
    </div>
  )
}

// ───────────── UI helpers ─────────────

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold mb-1" style={{ color: '#053E35' }}>{children}</h2>
}

function Sub({ children }: { children: ReactNode }) {
  return <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>{children}</p>
}

function Pill({
  active, onClick, children, style: extraStyle,
}: { active: boolean; onClick: () => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full text-sm border px-4 py-2"
      style={{
        minHeight: 44,
        background: active ? '#E85B16' : '#fff',
        color: active ? '#fff' : '#1F2A2E',
        borderColor: active ? '#E85B16' : '#FCE7D2',
        fontWeight: active ? 600 : 400,
        ...extraStyle,
      }}
    >
      {children}
    </button>
  )
}

function OptionCard({
  active, onClick, title, sub,
}: { active: boolean; onClick: () => void; title: string; sub?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border px-4 py-3.5 mb-3"
      style={{
        minHeight: 56,
        background: active ? '#FFF0E8' : '#fff',
        borderColor: active ? '#E85B16' : '#FCE7D2',
      }}
    >
      <div className="font-semibold" style={{ color: '#1F2A2E' }}>{title}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sub}</div>}
    </button>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <label className="block text-sm font-medium mb-2" style={{ color: '#053E35' }}>{children}</label>
}

// ───────────── Steps ─────────────

interface StepProps {
  draft: Draft
  update: (p: Partial<Draft>) => void
}

function Step1({ draft, update }: StepProps) {
  const pick = (mode: Draft['mode'], name: string, inRecovery: boolean, restrictions: string[]) =>
    update({ mode, name, inRecovery, restrictions })

  return (
    <>
      <Heading>Хто тренується?</Heading>
      <Sub>Каспер налаштує логіку під вас</Sub>
      <OptionCard active={draft.mode === 'serge'} onClick={() => pick('serge', 'Серж', false, [])}
        title="Серж" sub="Повернення у форму, підготовка до бігу" />
      <OptionCard active={draft.mode === 'olena'} onClick={() => pick('olena', 'Олена', true, ['surgery'])}
        title="Олена" sub="Відновлення після операції — м'який режим" />
      <OptionCard active={draft.mode === 'custom'} onClick={() => pick('custom', '', false, [])}
        title="Новий профіль" sub="Налаштую все вручну" />
    </>
  )
}

function Step2({ draft, update }: StepProps) {
  const ages: Draft['ageGroup'][] = ['20-30', '31-40', '41-50', '51-60', '60+']
  return (
    <>
      <Heading>Ім'я і вік</Heading>
      <Sub>Щоб Каспер звертався правильно</Sub>
      <Label>Ім'я</Label>
      <input
        value={draft.name}
        onChange={e => update({ name: e.target.value })}
        placeholder="Введіть ім'я"
        enterKeyHint="next"
        className="w-full rounded-2xl border px-4 mb-6 outline-none"
        style={{ fontSize: 16, height: 52, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
      />
      <Label>Вікова група</Label>
      <div className="flex gap-1.5 mb-6">
        {ages.map(a => (
          <button
            key={a}
            onClick={() => update({ ageGroup: a })}
            className="flex-1 rounded-full text-sm border text-center"
            style={{
              minHeight: 44,
              padding: '8px 4px',
              background: draft.ageGroup === a ? '#E85B16' : '#fff',
              color: draft.ageGroup === a ? '#fff' : '#1F2A2E',
              borderColor: draft.ageGroup === a ? '#E85B16' : '#FCE7D2',
              fontWeight: draft.ageGroup === a ? 600 : 400,
            }}
          >
            {a}
          </button>
        ))}
      </div>
      <Label>Стать (необов'язково)</Label>
      <div className="flex gap-2">
        {(['male', 'female', 'other'] as const).map(g => (
          <button
            key={g}
            onClick={() => update({ gender: draft.gender === g ? undefined : g })}
            className="flex-1 rounded-full text-sm border py-2.5"
            style={{
              minHeight: 44,
              background: draft.gender === g ? '#E85B16' : '#fff',
              color: draft.gender === g ? '#fff' : '#1F2A2E',
              borderColor: draft.gender === g ? '#E85B16' : '#FCE7D2',
            }}
          >
            {g === 'male' ? 'Чол.' : g === 'female' ? 'Жін.' : 'Інше'}
          </button>
        ))}
      </div>
    </>
  )
}

function Step3({ draft, update }: StepProps) {
  const levels: { v: Draft['activityLevel']; t: string; s: string }[] = [
    { v: 1, t: 'Майже не рухаюсь', s: 'Сидяча робота, мінімум руху' },
    { v: 2, t: 'Легка активність', s: 'Прогулянки, побутові справи' },
    { v: 3, t: 'Помірна активність', s: 'Іноді тренуюсь або виходжу' },
    { v: 4, t: 'Регулярно тренуюсь', s: 'Кілька разів на тиждень' },
  ]
  return (
    <>
      <Heading>Поточна активність</Heading>
      <Sub>Каспер підбере стартове навантаження</Sub>
      {levels.map(l => (
        <OptionCard key={l.v} active={draft.activityLevel === l.v}
          onClick={() => update({ activityLevel: l.v })} title={l.t} sub={l.s} />
      ))}
    </>
  )
}

function Step4({ draft, update }: StepProps) {
  const RESTRICTIONS = [
    { id: 'surgery', label: 'Операція або травма' },
    { id: 'heart', label: 'Серце / тиск' },
    { id: 'joints', label: 'Суглоби' },
    { id: 'pain', label: 'Хронічний біль' },
    { id: 'pregnancy', label: 'Вагітність' },
  ]
  const toggle = (id: string) => {
    const has = draft.restrictions.includes(id)
    update({ restrictions: has ? draft.restrictions.filter(r => r !== id) : [...draft.restrictions, id] })
  }

  return (
    <>
      <Heading>Здоров'я та обмеження</Heading>
      <Sub>Це впливає на кожну рекомендацію Каспера</Sub>

      {draft.mode === 'olena' && (
        <div className="rounded-2xl px-4 py-3 mb-4 text-sm flex items-center gap-2" style={{ background: '#CDE1D5', color: '#053E35' }}>
          <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={20} style={{ width: 20, height: 'auto', flexShrink: 0, filter: 'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(600%) hue-rotate(340deg) brightness(95%)' }} />
          Режим відновлення. Перед кожним тренуванням Каспер запитає стан зони операції.
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl px-4 py-3.5 mb-4 border"
        style={{ background: '#fff', borderColor: '#FCE7D2' }}>
        <span className="text-sm font-medium" style={{ color: '#1F2A2E' }}>
          Зараз у процесі відновлення
        </span>
        <button
          onClick={() => update({ inRecovery: !draft.inRecovery })}
          className="rounded-full"
          style={{
            width: 44, height: 26, minWidth: 44,
            background: draft.inRecovery ? '#E85B16' : '#E5E7EB',
            position: 'relative',
            transition: 'background 0.15s',
          }}
        >
          <span
            className="absolute top-1 rounded-full bg-white"
            style={{ width: 18, height: 18, left: draft.inRecovery ? 22 : 4, transition: 'left 0.15s' }}
          />
        </button>
      </div>

      {draft.inRecovery && (
        <>
          <Label>Вид обмеження</Label>
          {RESTRICTIONS.map(r => {
            const active = draft.restrictions.includes(r.id)
            return (
              <label
                key={r.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 mb-2 border cursor-pointer"
                style={{
                  background: active ? '#FFF0E8' : '#fff',
                  borderColor: active ? '#E85B16' : '#FCE7D2',
                  minHeight: 48,
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggle(r.id)}
                  className="w-5 h-5"
                  style={{ accentColor: '#E85B16' }}
                />
                <span className="text-sm" style={{ color: '#1F2A2E' }}>{r.label}</span>
              </label>
            )
          })}
          <div className="mt-3">
            <Label>Заборони лікаря</Label>
            <textarea
              value={draft.prohibitions}
              onChange={e => update({ prohibitions: e.target.value })}
              placeholder="Наприклад: не бігти, пульс не вище 120"
              rows={2}
              className="w-full rounded-2xl border px-4 py-3 outline-none resize-none"
              style={{ fontSize: 16, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
            />
          </div>
        </>
      )}
    </>
  )
}

function Step5({ draft, update }: StepProps) {
  const GOALS = [
    'Повернути ритм', 'Відновлення', 'Витривалість',
    'Підготовка до бігу', 'Разом з партнером', 'Самопочуття',
  ]
  const toggle = (g: string) => {
    const has = draft.goals.includes(g)
    update({ goals: has ? draft.goals.filter(x => x !== g) : [...draft.goals, g] })
  }
  return (
    <>
      <Heading>Що для вас важливо?</Heading>
      <Sub>Оберіть одне або кілька</Sub>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {GOALS.map(g => (
          <Pill key={g} active={draft.goals.includes(g)} onClick={() => toggle(g)}>{g}</Pill>
        ))}
      </div>
    </>
  )
}

function Step6({ draft, update }: StepProps) {
  const times: [Profile['schedule']['timeOfDay'], string][] = [
    ['morning', 'Ранок'], ['day', 'День'], ['evening', 'Вечір'], ['flexible', 'По-різному'],
  ]
  const days: [Profile['schedule']['daysPerWeek'], string][] = [
    ['1-2', '1–2'], ['3-4', '3–4'], ['5+', '5+'], ['flexible', 'Розберемось'],
  ]
  const mins: [number, string][] = [
    [15, '10–15 хв'], [25, '20–30 хв'], [40, '30–45 хв'], [20, 'По-різному'],
  ]
  return (
    <>
      <Heading>Розклад</Heading>
      <Sub>Каспер врахує ваш ритм</Sub>
      <Label>Тривалість прогулянки</Label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {mins.map(([v, l]) => (
          <Pill key={l} active={draft.targetMinutes === v} onClick={() => update({ targetMinutes: v })} style={{ flex: 1 }}>{l}</Pill>
        ))}
      </div>
      <Label>Час доби</Label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {times.map(([v, l]) => (
          <Pill key={v} active={draft.timeOfDay === v} onClick={() => update({ timeOfDay: v })} style={{ flex: 1 }}>{l}</Pill>
        ))}
      </div>
      <Label>Тренувань на тиждень</Label>
      <div style={{ display: 'flex', gap: 8 }}>
        {days.map(([v, l]) => (
          <Pill key={v} active={draft.daysPerWeek === v} onClick={() => update({ daysPerWeek: v })} style={{ flex: 1 }}>{l}</Pill>
        ))}
      </div>
    </>
  )
}

function Step7() {
  return (
    <>
      <Heading>Режим «Разом»</Heading>
      <Sub>Тренування з партнером підсилює звичку</Sub>
      <div className="rounded-2xl p-5 mb-4" style={{ background: '#CDE1D5' }}>
        <p className="text-sm leading-relaxed" style={{ color: '#053E35' }}>
          У режимі «Разом» кожен отримує персональну рекомендацію, але тренуєтесь разом. Медичні дані кожного залишаються приватними.
        </p>
      </div>
      <div className="rounded-2xl border px-4 py-3.5 mb-3"
        style={{ background: '#fff', borderColor: '#FCE7D2' }}>
        <div className="font-semibold" style={{ color: '#9CA3AF' }}>Додати партнера — пізніше</div>
        <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
          Можна налаштувати в Налаштуваннях. Створіть другий профіль або поділіться посиланням.
        </div>
      </div>
    </>
  )
}
