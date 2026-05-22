import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'
import type { Screen } from '@/App'
import { db } from '@/db/db'
import type { Activity as ActivityRow, CheckIn } from '@/db/types'
import { useActiveProfile } from '@/hooks/useActiveProfile'
import { useRecommendation } from '@/hooks/useRecommendation'
import Button from '@/components/ui/Button'
import { pickPhrase } from '@/logic/casperPhrases'

type Phase = 'pre' | 'session' | 'post' | 'done'

interface PreData {
  sleep: 1 | 2 | 3 | 4 | 5
  fatigue: 1 | 2 | 3 | 4 | 5
  readiness: 1 | 2 | 3 | 4 | 5
  mood: 1 | 2 | 3 | 4 | 5
  pain: boolean
  painDetails: string
  conditions: 'outdoor' | 'indoor' | 'gym'
  operationZoneDiscomfort: boolean
}

interface PostData {
  duration: number              // хвилини (з таймера або вручну)
  distance: string              // string для input, parsed at save
  steps: string
  difficulty: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  fatigueAfter: 1 | 2 | 3 | 4 | 5
  discomfortAfter: boolean
  discomfortDetails: string
  feeling: 'better' | 'same' | 'worse'
  notesAfter: string
  redFlags: string[]
}

const RED_FLAG_OPTIONS = [
  'Біль у грудях',
  'Задишка / запаморочення',
  'Слабкість',
  'Гострий біль зони операції',
]

const DEFAULT_PRE: PreData = {
  sleep: 3, fatigue: 3, readiness: 3, mood: 3,
  pain: false, painDetails: '',
  conditions: 'outdoor',
  operationZoneDiscomfort: false,
}

const DEFAULT_POST: PostData = {
  duration: 0, distance: '', steps: '',
  difficulty: 5, fatigueAfter: 3,
  discomfortAfter: false, discomfortDetails: '',
  feeling: 'same',
  notesAfter: '',
  redFlags: [],
}

export default function Activity({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { profile, mode } = useActiveProfile()
  const rec = useRecommendation(profile)
  const [phase, setPhase] = useState<Phase>('pre')
  const [pre, setPre] = useState<PreData>(DEFAULT_PRE)
  const [post, setPost] = useState<PostData>(DEFAULT_POST)
  const [activityId, setActivityId] = useState<number | undefined>()
  const [saving, setSaving] = useState(false)

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const startedAtRef = useRef<number | null>(null)
  const accumRef = useRef(0)

  useEffect(() => {
    if (!running) return
    const tick = setInterval(() => {
      const now = Date.now()
      setElapsed(accumRef.current + Math.floor((now - (startedAtRef.current ?? now)) / 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [running])

  function startTimer() {
    startedAtRef.current = Date.now()
    setRunning(true)
  }
  function pauseTimer() {
    if (startedAtRef.current) {
      accumRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000)
    }
    startedAtRef.current = null
    setRunning(false)
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFF7EC' }} className="flex items-center justify-center">
        <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={32} style={{ width: 32, height: 'auto' }} />
      </div>
    )
  }

  const isOlena = profile.mode === 'olena'
  const targetMinutes = rec?.targetDuration ?? profile.schedule.targetMinutes
  const isRest = rec?.paceType === 'rest'

  // ───────── Phase: PRE ─────────
  async function startSession() {
    if (!profile?.id) return
    // Якщо у Олени дискомфорт зони — миттєвий rest
    if (isOlena && pre.operationZoneDiscomfort) {
      await saveSafetyFlag('Дискомфорт у зоні операції перед стартом')
      setPhase('done')
      setPost({ ...DEFAULT_POST, redFlags: ['Дискомфорт зони операції'], feeling: 'worse' })
      return
    }
    if (pre.pain) {
      await saveSafetyFlag('Біль перед стартом')
      setPhase('done')
      setPost({ ...DEFAULT_POST, redFlags: ['Біль перед стартом'], feeling: 'worse' })
      return
    }
    // Створюємо Activity + before-CheckIn
    const today = new Date().toISOString().slice(0, 10)
    const id = await db.activities.add({
      profileId: profile.id,
      mode: mode === 'together' ? 'together' : 'solo',
      date: today,
      startTime: new Date().toISOString(),
      duration: 0,
      isRestDay: false,
      safetyLevel: rec?.cautionLevel ?? 'green',
    } as ActivityRow)
    const newId = id as number
    setActivityId(newId)
    await db.checkins.add({
      activityId: newId,
      profileId: profile.id,
      type: 'before',
      date: today,
      sleep: pre.sleep,
      fatigue: pre.fatigue,
      readiness: pre.readiness,
      mood: pre.mood,
      pain: pre.pain,
      painDetails: pre.painDetails || undefined,
      conditions: pre.conditions,
      operationZoneDiscomfort: isOlena ? pre.operationZoneDiscomfort : undefined,
      redFlags: [],
    } as CheckIn)
    setPhase('session')
    setTimeout(startTimer, 0)
  }

  async function saveSafetyFlag(symptom: string) {
    if (!profile?.id) return
    await db.safetyFlags.add({
      profileId: profile.id,
      date: new Date().toISOString().slice(0, 10),
      level: 'red',
      symptom,
      source: 'before-checkin',
      action: 'Активність скасована',
      resolved: false,
    })
  }

  // ───────── Phase: SESSION → POST ─────────
  function endSession() {
    pauseTimer()
    const minutes = Math.max(1, Math.round(elapsed / 60))
    setPost({ ...DEFAULT_POST, duration: minutes })
    setPhase('post')
  }

  // ───────── Phase: POST → DONE ─────────
  async function savePost() {
    if (saving || !activityId || !profile?.id) return
    const profileId = profile.id
    setSaving(true)
    const safetyLevel: 'green' | 'yellow' | 'red' =
      post.redFlags.length > 0 ? 'red'
      : post.discomfortAfter || post.feeling === 'worse' ? 'yellow'
      : 'green'
    await db.activities.update(activityId, {
      duration: post.duration,
      distance: post.distance ? parseFloat(post.distance) : undefined,
      steps: post.steps ? parseInt(post.steps, 10) : undefined,
      notes: post.notesAfter || undefined,
      safetyLevel,
    })
    await db.checkins.add({
      activityId,
      profileId,
      type: 'after',
      date: new Date().toISOString().slice(0, 10),
      pain: false,
      difficulty: post.difficulty,
      fatigueAfter: post.fatigueAfter,
      discomfortAfter: post.discomfortAfter,
      discomfortDetails: post.discomfortDetails || undefined,
      feeling: post.feeling,
      notesAfter: post.notesAfter || undefined,
      redFlags: post.redFlags,
    } as CheckIn)
    if (post.redFlags.length > 0) {
      await db.safetyFlags.add({
        profileId,
        date: new Date().toISOString().slice(0, 10),
        level: 'red',
        symptom: post.redFlags.join(', '),
        source: 'after-checkin',
        action: 'Зафіксовано у журналі',
        resolved: false,
      })
    }
    setSaving(false)
    setPhase('done')
  }

  // ───────── Render ─────────
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#FFF7EC',
        paddingBottom: 'calc(56px + env(safe-area-inset-bottom) + 16px)',
      }}
      className="flex flex-col"
    >
      <Header phase={phase} onBack={() => onNavigate('home')} />

      <div className="flex-1 px-5 pt-2 pb-4 overflow-y-auto">
        {phase === 'pre' && (
          <PrePhase
            pre={pre} setPre={setPre} isOlena={isOlena}
            targetMinutes={targetMinutes}
            isRest={isRest}
            recReason={rec?.reason}
          />
        )}
        {phase === 'session' && (
          <SessionPhase
            elapsed={elapsed}
            target={targetMinutes}
            running={running}
            onToggle={() => (running ? pauseTimer() : startTimer())}
            isOlena={isOlena}
          />
        )}
        {phase === 'post' && (
          <PostPhase post={post} setPost={setPost} isOlena={isOlena} />
        )}
        {phase === 'done' && (
          <DonePhase post={post} pre={pre} />
        )}
      </div>

      <div className="px-5 pb-4">
        {phase === 'pre' && (
          <Button onClick={startSession}>
            {isOlena && pre.operationZoneDiscomfort ? 'Завершити — є дискомфорт' :
             pre.pain ? 'Завершити — біль' : 'Поїхали'}
          </Button>
        )}
        {phase === 'session' && (
          <Button onClick={endSession} variant="secondary">Завершити</Button>
        )}
        {phase === 'post' && (
          <Button onClick={savePost} disabled={saving}>
            {saving ? 'Зберігаємо…' : 'Зберегти'}
          </Button>
        )}
        {phase === 'done' && (
          <Button onClick={() => onNavigate('home')}>На головну</Button>
        )}
      </div>
    </div>
  )
}

// ───────────── Sub-components ─────────────

function Header({ phase, onBack }: { phase: Phase; onBack: () => void }) {
  const labels: Record<Phase, string> = {
    pre: 'Підготовка', session: 'Прогулянка', post: 'Після', done: 'Готово',
  }
  return (
    <div className="flex items-center px-5 pt-12 pb-3 gap-3">
      <button
        onClick={onBack}
        style={{ minWidth: 44, minHeight: 44, color: '#053E35' }}
        className="flex items-center justify-center text-2xl"
      >
        ‹
      </button>
      <div className="flex gap-1.5 flex-1">
        {(['pre', 'session', 'post', 'done'] as Phase[]).map(p => {
          const ordering: Phase[] = ['pre', 'session', 'post', 'done']
          const reached = ordering.indexOf(p) <= ordering.indexOf(phase)
          return (
            <div key={p} className="h-1.5 flex-1 rounded-full"
              style={{ background: reached ? '#E85B16' : '#FCE7D2' }} />
          )
        })}
      </div>
      <div style={{ minWidth: 60 }} className="text-right text-xs" />
      <span className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold pt-12"
        style={{ color: '#053E35', top: 0 }}>
        {labels[phase]}
      </span>
    </div>
  )
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold mb-1" style={{ color: '#053E35' }}>{children}</h2>
}
function Sub({ children }: { children: ReactNode }) {
  return <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>{children}</p>
}
function Label({ children }: { children: ReactNode }) {
  return <label className="block text-sm font-semibold mb-2 mt-4" style={{ color: '#053E35' }}>{children}</label>
}

function Scale({ max, value, onChange }: { max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => {
        const active = value === n
        return (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="rounded-full text-sm font-medium border"
            style={{
              minWidth: 44, minHeight: 44,
              flex: '1 0 44px',
              background: active ? '#E85B16' : '#fff',
              color: active ? '#fff' : '#1F2A2E',
              borderColor: active ? '#E85B16' : '#FCE7D2',
            }}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

function YesNo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[
        { v: false, l: 'Ні' },
        { v: true, l: 'Так' },
      ].map(({ v, l }) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          className="flex-1 rounded-full text-sm border py-2.5"
          style={{
            minHeight: 44,
            background: value === v ? '#E85B16' : '#fff',
            color: value === v ? '#fff' : '#1F2A2E',
            borderColor: value === v ? '#E85B16' : '#FCE7D2',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

// ─────── PRE ───────

function PrePhase({
  pre, setPre, isOlena, targetMinutes, isRest, recReason,
}: {
  pre: PreData
  setPre: (p: PreData) => void
  isOlena: boolean
  targetMinutes: number
  isRest: boolean
  recReason?: string
}) {
  const upd = (p: Partial<PreData>) => setPre({ ...pre, ...p })

  return (
    <>
      {isRest && (
        <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: '#FFE5E0', borderLeft: '4px solid #E85B16' }}>
          <p className="text-sm font-semibold" style={{ color: '#053E35' }}>Каспер радить відпочити</p>
          {recReason && <p className="text-xs mt-1" style={{ color: '#1F2A2E' }}>{recReason}</p>}
        </div>
      )}

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold" style={{ color: '#053E35' }}>{targetMinutes}</span>
        <span className="text-sm" style={{ color: '#9CA3AF' }}>хв · ціль на сьогодні</span>
      </div>

      <Heading>Як ви?</Heading>
      <Sub>Каспер скоригує план під ваш стан</Sub>

      {isOlena && (
        <>
          <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: '#CDE1D5' }}>
            <p className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#053E35' }}>
              <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={18} style={{ width: 18, height: 'auto', flexShrink: 0, filter: 'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(600%) hue-rotate(340deg) brightness(95%)' }} />
              Чи є дискомфорт у зоні операції?
            </p>
            <YesNo value={pre.operationZoneDiscomfort} onChange={v => upd({ operationZoneDiscomfort: v })} />
          </div>
        </>
      )}

      <Label>Як спалось? (1 — погано, 5 — чудово)</Label>
      <Scale max={5} value={pre.sleep} onChange={v => upd({ sleep: v as PreData['sleep'] })} />

      <Label>Загальна втома (1 — нема, 5 — дуже)</Label>
      <Scale max={5} value={pre.fatigue} onChange={v => upd({ fatigue: v as PreData['fatigue'] })} />

      <Label>Готовність рухатись (1 — низька, 5 — висока)</Label>
      <Scale max={5} value={pre.readiness} onChange={v => upd({ readiness: v as PreData['readiness'] })} />

      <Label>Настрій</Label>
      <div className="flex gap-1.5">
        {['😔','😕','😐','🙂','😊'].map((emoji, i) => {
          const v = (i + 1) as PreData['mood']
          const active = pre.mood === v
          return (
            <button
              key={v}
              onClick={() => upd({ mood: v })}
              className="flex-1 rounded-full border text-2xl"
              style={{
                minHeight: 56,
                background: active ? '#FFF0E8' : '#fff',
                borderColor: active ? '#E85B16' : '#FCE7D2',
              }}
            >
              {emoji}
            </button>
          )
        })}
      </div>

      <Label>Біль чи дискомфорт зараз?</Label>
      <YesNo value={pre.pain} onChange={v => upd({ pain: v })} />
      {pre.pain && (
        <textarea
          value={pre.painDetails}
          onChange={e => upd({ painDetails: e.target.value })}
          placeholder="Де саме? Як давно?"
          rows={2}
          className="w-full rounded-2xl border px-4 py-3 mt-3 outline-none resize-none"
          style={{ fontSize: 16, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
        />
      )}

      <Label>Умови</Label>
      <div className="flex gap-2">
        {(['outdoor', 'indoor', 'gym'] as const).map(c => {
          const labels = { outdoor: 'Надворі', indoor: 'Вдома', gym: 'Зал' }
          const active = pre.conditions === c
          return (
            <button
              key={c}
              onClick={() => upd({ conditions: c })}
              className="flex-1 rounded-full text-sm border py-2.5"
              style={{
                minHeight: 44,
                background: active ? '#E85B16' : '#fff',
                color: active ? '#fff' : '#1F2A2E',
                borderColor: active ? '#E85B16' : '#FCE7D2',
              }}
            >
              {labels[c]}
            </button>
          )
        })}
      </div>
    </>
  )
}

// ─────── SESSION ───────

function SessionPhase({
  elapsed, target, running, onToggle, isOlena,
}: {
  elapsed: number
  target: number
  running: boolean
  onToggle: () => void
  isOlena: boolean
}) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const targetSec = target * 60
  const pct = Math.min(100, (elapsed / targetSec) * 100)

  return (
    <div className="flex flex-col items-center pt-8">
      <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>Ціль: {target} хв</p>

      {/* Big timer */}
      <div className="text-7xl font-bold tabular-nums mb-2" style={{ color: '#053E35' }}>
        {mm}:{ss}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-2 rounded-full mb-8" style={{ background: '#FCE7D2' }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: '#E85B16' }} />
      </div>

      {/* Pause/resume */}
      <button
        onClick={onToggle}
        className="rounded-full flex items-center justify-center"
        style={{
          width: 72, height: 72,
          background: '#E85B16', color: '#fff',
        }}
      >
        {running ? <Pause size={28} /> : <Play size={28} />}
      </button>

      {/* Tip */}
      <div className="rounded-2xl px-4 py-3 mt-8 max-w-sm w-full"
        style={{ background: isOlena ? '#CDE1D5' : '#FFF0E8' }}>
        <p className="text-sm" style={{ color: '#053E35' }}>
          <img src={`${import.meta.env.BASE_URL}cat-paw.png`} alt="" width={16} style={{ width: 16, height: 'auto', display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          {isOlena
            ? 'Комфортний темп. Без прискорення. Фокус — рівне дихання.'
            : 'Ритм важливіший за швидкість. Каспер поруч.'}
        </p>
      </div>
    </div>
  )
}

// ─────── POST ───────

function PostPhase({
  post, setPost, isOlena,
}: {
  post: PostData
  setPost: (p: PostData) => void
  isOlena: boolean
}) {
  const upd = (p: Partial<PostData>) => setPost({ ...post, ...p })
  const toggleFlag = (flag: string) => {
    upd({ redFlags: post.redFlags.includes(flag)
      ? post.redFlags.filter(f => f !== flag)
      : [...post.redFlags, flag] })
  }

  return (
    <>
      <Heading>Як пройшло?</Heading>
      <Sub>Чесно — навіть якщо було складно</Sub>

      <Label>Тривалість (хв)</Label>
      <input
        type="number"
        inputMode="numeric"
        value={post.duration || ''}
        onChange={e => upd({ duration: Number(e.target.value) || 0 })}
        className="w-full rounded-2xl border px-4 outline-none"
        style={{ fontSize: 16, height: 52, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
      />

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <Label>Дистанція (км)</Label>
          <input
            type="text" inputMode="decimal"
            value={post.distance} onChange={e => upd({ distance: e.target.value })}
            className="w-full rounded-2xl border px-4 outline-none"
            style={{ fontSize: 16, height: 52, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
          />
        </div>
        <div>
          <Label>Кроки</Label>
          <input
            type="text" inputMode="numeric"
            value={post.steps} onChange={e => upd({ steps: e.target.value })}
            className="w-full rounded-2xl border px-4 outline-none"
            style={{ fontSize: 16, height: 52, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
          />
        </div>
      </div>

      <Label>Складність (1 — дуже легко, 10 — дуже важко)</Label>
      <Scale max={10} value={post.difficulty} onChange={v => upd({ difficulty: v as PostData['difficulty'] })} />

      <Label>Втома після</Label>
      <Scale max={5} value={post.fatigueAfter} onChange={v => upd({ fatigueAfter: v as PostData['fatigueAfter'] })} />

      <Label>Самопочуття порівняно з тим, як було до</Label>
      <div className="flex gap-2">
        {([
          ['better', 'Краще ↑'],
          ['same', 'Так само →'],
          ['worse', 'Гірше ↓'],
        ] as const).map(([v, l]) => {
          const active = post.feeling === v
          return (
            <button
              key={v}
              onClick={() => upd({ feeling: v })}
              className="flex-1 rounded-full text-sm border py-2.5"
              style={{
                minHeight: 44,
                background: active ? '#E85B16' : '#fff',
                color: active ? '#fff' : '#1F2A2E',
                borderColor: active ? '#E85B16' : '#FCE7D2',
              }}
            >
              {l}
            </button>
          )
        })}
      </div>

      <Label>Дискомфорт після?</Label>
      <YesNo value={post.discomfortAfter} onChange={v => upd({ discomfortAfter: v })} />
      {post.discomfortAfter && (
        <textarea
          value={post.discomfortDetails}
          onChange={e => upd({ discomfortDetails: e.target.value })}
          placeholder={isOlena ? 'Чи був дискомфорт у зоні операції?' : 'Де саме?'}
          rows={2}
          className="w-full rounded-2xl border px-4 py-3 mt-3 outline-none resize-none"
          style={{ fontSize: 16, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
        />
      )}

      <Label>Тривожні симптоми (якщо були)</Label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {RED_FLAG_OPTIONS.map(flag => {
          const active = post.redFlags.includes(flag)
          return (
            <button
              key={flag}
              onClick={() => toggleFlag(flag)}
              className="rounded-full text-xs border px-3 py-2 text-center"
              style={{
                minHeight: 36,
                background: active ? '#E85B16' : '#fff',
                color: active ? '#fff' : '#1F2A2E',
                borderColor: active ? '#E85B16' : '#FCE7D2',
              }}
            >
              {flag}
            </button>
          )
        })}
      </div>

      <Label>Коментар (опційно)</Label>
      <textarea
        value={post.notesAfter}
        onChange={e => upd({ notesAfter: e.target.value })}
        placeholder="Що змінити наступного разу?"
        rows={3}
        className="w-full rounded-2xl border px-4 py-3 outline-none resize-none"
        style={{ fontSize: 16, borderColor: '#FCE7D2', background: '#fff', color: '#1F2A2E' }}
      />
    </>
  )
}

// ─────── DONE ───────

function DonePhase({ post, pre }: { post: PostData; pre: PreData }) {
  const level: 'green' | 'yellow' | 'red' =
    post.redFlags.length > 0 ? 'red'
    : post.discomfortAfter || post.feeling === 'worse' ? 'yellow'
    : 'green'
  const emoji = level === 'green' ? '🟢' : level === 'yellow' ? '🟡' : '🔴'
  const conclusion =
    level === 'red'
      ? 'Зафіксовано тривожний сигнал. Завтра — відпочинок. Якщо стан гіршає — лікар.'
      : level === 'yellow'
        ? 'Помірне навантаження. Завтра Каспер запропонує легший варіант.'
        : 'Добрий крок. Серія тримається — продовжуємо в ритмі.'

  return (
    <div className="pt-4">
      <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: '#FFF0E8' }}>
        <span className="text-5xl">{emoji}</span>
        <p className="text-sm mt-2" style={{ color: '#053E35' }}>{conclusion}</p>
      </div>

      <div className="rounded-2xl p-4 mb-3 border" style={{ background: '#fff', borderColor: '#FCE7D2' }}>
        <Row label="Тривалість" value={`${post.duration} хв`} />
        {post.distance && <Row label="Дистанція" value={`${post.distance} км`} />}
        {post.steps && <Row label="Кроки" value={post.steps} />}
        <Row label="Складність" value={`${post.difficulty}/10`} />
        <Row label="Самопочуття" value={
          post.feeling === 'better' ? 'Краще' :
          post.feeling === 'worse' ? 'Гірше' : 'Так само'} />
        <Row label="Готовність до" value={`${pre.readiness}/5`} />
      </div>

      <div className="rounded-2xl p-4" style={{ background: '#CDE1D5' }}>
        <p className="text-sm" style={{ color: '#053E35' }}>🐈 {pickPhrase(level)}</p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="font-semibold" style={{ color: '#1F2A2E' }}>{value}</span>
    </div>
  )
}
