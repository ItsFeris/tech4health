/** Nour's tool cards (ChatReply.actions). Rendered inside the AI bubble, as the end of its reply. */
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, Hand, Wind } from 'lucide-react'
import type { ChatAction, Homework } from '@/types/contract'
import { updateHomework } from '@/api'
import { avg, moodWord, weekday, whenLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { MoodFace, SectionLabel, SmallButton, Sparkline } from './kit'

type Props = { action: ChatAction; onSend: (text: string) => void }

export function ActionCard({ action, onSend }: Props) {
  switch (action.type) {
    case 'breathing':
      return <BreathingCard pattern={action.pattern ?? 'slow'} cycles={action.cycles ?? 4} />
    case 'grounding':
      return <GroundingCard />
    case 'thought_record':
      return <ThoughtRecordCard situation={action.situation ?? ''} onSend={onSend} />
    case 'mood_logged':
      return action.checkin ? <MoodLoggedCard mood={action.checkin.mood} note={action.checkin.note} /> : null
    case 'homework_list':
    case 'homework_done':
      return <HomeworkCard items={action.homework ?? []} justDone={action.type === 'homework_done'} />
    case 'next_session':
      return <NextSessionCard startsAt={action.appointment?.starts_at} urgent={action.appointment?.type === 'urgent'} />
    case 'mood_history':
      return <MoodHistoryCard moods={action.moods ?? []} />
    default:
      return null
  }
}

function Shell({ label, icon, children, className }: { label: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mt-3 border-t border-line pt-3', className)}>
      <div className="mb-3 flex items-center gap-1.5 text-sub">
        {icon}
        <SectionLabel>{label}</SectionLabel>
      </div>
      {children}
    </div>
  )
}

/* ---------- Breathing ---------- */

type Phase = { name: string; secs: number; scale: number }
const PATTERNS: Record<'box' | '478' | 'slow', { title: string; phases: Phase[] }> = {
  box: { title: 'Box breathing', phases: [{ name: 'Breathe in', secs: 4, scale: 1 }, { name: 'Hold', secs: 4, scale: 1 }, { name: 'Breathe out', secs: 4, scale: 0.6 }, { name: 'Hold', secs: 4, scale: 0.6 }] },
  '478': { title: '4-7-8 breathing', phases: [{ name: 'Breathe in', secs: 4, scale: 1 }, { name: 'Hold', secs: 7, scale: 1 }, { name: 'Breathe out', secs: 8, scale: 0.6 }] },
  slow: { title: 'Slow breathing', phases: [{ name: 'Breathe in', secs: 4, scale: 1 }, { name: 'Breathe out', secs: 6, scale: 0.6 }] },
}

function BreathingCard({ pattern, cycles }: { pattern: 'box' | '478' | 'slow'; cycles: number }) {
  const p = PATTERNS[pattern] ?? PATTERNS.slow
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle')
  const [cycle, setCycle] = useState(0)
  const [phase, setPhase] = useState(0)
  const [left, setLeft] = useState(p.phases[0].secs)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (state !== 'running') return
    timer.current = window.setTimeout(() => {
      if (left > 1) return setLeft(left - 1)
      const nextPhase = (phase + 1) % p.phases.length
      const nextCycle = nextPhase === 0 ? cycle + 1 : cycle
      if (nextCycle >= cycles) return setState('done')
      setPhase(nextPhase)
      setCycle(nextCycle)
      setLeft(p.phases[nextPhase].secs)
    }, 1000)
    return () => window.clearTimeout(timer.current)
  }, [state, left, phase, cycle, cycles, p.phases])

  function start() {
    setCycle(0)
    setPhase(0)
    setLeft(p.phases[0].secs)
    setState('running')
  }

  const cur = p.phases[phase]
  const scale = state === 'running' ? cur.scale : 0.6
  return (
    <Shell label={p.title} icon={<Wind className="size-3.5" />}>
      <div className="flex flex-col items-center gap-3 py-1">
        <div className="relative flex size-36 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#D9F0EA,#C9C0F2)]"
            style={{ transform: `scale(${scale})`, transition: `transform ${state === 'running' ? cur.secs : 0.4}s ease-in-out` }}
          />
          <div className="relative text-center" aria-live="polite">
            {state === 'running' ? (
              <>
                <p className="text-[15px] font-medium text-ink">{cur.name}</p>
                <p className="text-[28px] leading-none text-ink">{left}</p>
              </>
            ) : state === 'done' ? (
              <p className="flex items-center gap-1 text-[15px] text-ink">
                <Check className="size-4" /> Well done
              </p>
            ) : (
              <p className="text-[14px] text-sub">{cycles} rounds</p>
            )}
          </div>
        </div>
        {state === 'running' ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-sub">
              Round {cycle + 1} of {cycles}
            </span>
            <SmallButton onClick={() => setState('idle')}>Stop</SmallButton>
          </div>
        ) : (
          <SmallButton tone="ink" onClick={start}>
            {state === 'done' ? 'Again' : 'Start'}
          </SmallButton>
        )}
      </div>
    </Shell>
  )
}

/* ---------- Grounding 5-4-3-2-1 ---------- */

const SENSES = [
  { n: 5, text: 'things you can see' },
  { n: 4, text: 'things you can touch' },
  { n: 3, text: 'things you can hear' },
  { n: 2, text: 'things you can smell' },
  { n: 1, text: 'thing you can taste' },
]

function GroundingCard() {
  const [step, setStep] = useState(0)
  const done = step >= SENSES.length
  return (
    <Shell label="Grounding · 5-4-3-2-1" icon={<Hand className="size-3.5" />}>
      <div className="mb-3 flex gap-1.5" aria-hidden="true">
        {SENSES.map((s, i) => (
          <span key={s.n} className={cn('h-1.5 flex-1 rounded-full', i < step ? 'bg-ink' : i === step ? 'bg-ink/40' : 'bg-line')} />
        ))}
      </div>
      {done ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] text-ink">You're here, right now. Notice how you feel.</p>
          <SmallButton onClick={() => setStep(0)}>Again</SmallButton>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15.5px] text-ink" aria-live="polite">
            Name <span className="text-[22px] font-medium">{SENSES[step].n}</span> {SENSES[step].text}
          </p>
          <SmallButton tone="ink" onClick={() => setStep(step + 1)}>
            {step === SENSES.length - 1 ? 'Finish' : 'Next'}
          </SmallButton>
        </div>
      )}
    </Shell>
  )
}

/* ---------- Thought record (CBT) ---------- */

const FIELDS = [
  { key: 'situation', label: 'What happened?', ph: 'Where were you, what was going on' },
  { key: 'thought', label: 'What went through your mind?', ph: 'e.g. "I always mess things up"' },
  { key: 'against', label: 'What says it is not 100% true?', ph: 'Facts, times it went well' },
  { key: 'kinder', label: 'A kinder, more balanced thought', ph: 'What would you tell a friend?' },
] as const
type Key = (typeof FIELDS)[number]['key']

function ThoughtRecordCard({ situation, onSend }: { situation: string; onSend: (text: string) => void }) {
  const [v, setV] = useState<Record<Key, string>>({ situation, thought: '', against: '', kinder: '' })
  const [sent, setSent] = useState(false)
  const ready = v.thought.trim().length > 0

  function submit() {
    const text = ['My thought record:', ...FIELDS.filter((f) => v[f.key].trim()).map((f) => `• ${f.label} ${v[f.key].trim()}`)].join('\n')
    setSent(true)
    onSend(text)
  }

  if (sent)
    return (
      <Shell label="Thought record">
        <p className="flex items-center gap-1.5 text-[15px] text-ink">
          <Check className="size-4" /> Shared with Nour
        </p>
      </Shell>
    )
  return (
    <Shell label="Thought record">
      <div className="flex flex-col gap-2.5">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1">
            <span className="text-[13px] text-sub">{f.label}</span>
            <textarea
              dir="auto"
              rows={2}
              value={v[f.key]}
              placeholder={f.ph}
              onChange={(e) => setV({ ...v, [f.key]: e.target.value })}
              className="w-full resize-none rounded-[14px] bg-soft px-3 py-2 text-[14.5px] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-ink/15"
            />
          </label>
        ))}
        <SmallButton tone="ink" disabled={!ready} onClick={submit} className="self-end">
          Share with Nour
        </SmallButton>
      </div>
    </Shell>
  )
}

/* ---------- Mood logged ---------- */

function MoodLoggedCard({ mood, note }: { mood: number; note: string | null }) {
  return (
    <Shell label="Mood saved">
      <div className="flex items-center gap-3">
        <MoodFace v={mood} size={44} />
        <div>
          <p className="text-[16px] text-ink">{moodWord(mood)}</p>
          {note && <p className="text-[13.5px] text-sub">{note}</p>}
        </div>
        <Check className="ms-auto size-5 text-ink" />
      </div>
    </Shell>
  )
}

/* ---------- Homework ---------- */

function HomeworkCard({ items, justDone }: { items: Homework[]; justDone: boolean }) {
  const [list, setList] = useState(items)
  async function toggle(h: Homework) {
    setList((l) => l.map((x) => (x.id === h.id ? { ...x, done: !x.done } : x)))
    try {
      await updateHomework(h.id, { done: !h.done })
    } catch {
      setList((l) => l.map((x) => (x.id === h.id ? { ...x, done: h.done } : x)))
    }
  }
  return (
    <Shell label={justDone ? 'Homework done' : 'This week’s homework'}>
      {list.length === 0 ? (
        <p className="text-[14.5px] text-sub">No homework this week.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((h) => (
            <li key={h.id}>
              <button type="button" onClick={() => void toggle(h)} className="flex w-full items-center gap-3 text-start">
                <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border', h.done ? 'border-ink bg-ink text-white' : 'border-line')}>
                  {h.done && <Check className="size-3.5" />}
                </span>
                <span className={cn('text-[14.5px]', h.done ? 'text-sub line-through' : 'text-ink')}>{h.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  )
}

/* ---------- Next session ---------- */

function NextSessionCard({ startsAt, urgent }: { startsAt?: string; urgent: boolean }) {
  return (
    <Shell label="Next session" icon={<CalendarDays className="size-3.5" />}>
      {startsAt ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[16px] text-ink">{whenLabel(startsAt)}</p>
          {urgent && <span className="rounded-full bg-[#FBE3DF] px-2.5 py-1 text-[12px] text-sos">Sooner session</span>}
        </div>
      ) : (
        <p className="text-[14.5px] text-sub">No session booked yet. Your specialist will set one.</p>
      )}
    </Shell>
  )
}

/* ---------- Mood history ---------- */

function MoodHistoryCard({ moods }: { moods: { mood: number; created_at: string }[] }) {
  const a = avg(moods.map((m) => m.mood))
  return (
    <Shell label={`Your mood · last ${moods.length} check-ins`}>
      {moods.length === 0 ? (
        <p className="text-[14.5px] text-sub">No check-ins yet.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[22px] leading-none text-ink">{moodWord(a)}</p>
            <p className="mt-1 text-[12.5px] text-sub">
              {weekday(moods[0].created_at)} – {weekday(moods[moods.length - 1].created_at)}
            </p>
          </div>
          <Sparkline values={moods.map((m) => m.mood)} width={130} height={40} />
        </div>
      )}
    </Shell>
  )
}
