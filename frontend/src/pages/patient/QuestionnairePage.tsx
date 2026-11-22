// PHQ-9 / GAD-7 check-ups (design: 6a question, 6b result & history).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Heart, ShieldCheck } from 'lucide-react'
import { getQuestionnaireResults, submitQuestionnaire } from '@/api'
import type { QuestionnaireResult, Severity } from '@/types/contract'
import { Card, ChoiceRow, GlassCircle, Headline, Hero, Notice, Pill, Skeleton, TopBar } from '@/components/t4h/kit'
import { dayLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

type Kind = 'phq9' | 'gad7'

// Standard PHQ-9 and GAD-7 items (free to use).
const QUESTIONS: Record<Kind, string[]> = {
  phq9: [
    'Little interest or pleasure in doing things',
    'Feeling down, depressed or hopeless',
    'Trouble falling or staying asleep, or sleeping too much',
    'Feeling tired or having little energy',
    'Poor appetite or overeating',
    'Feeling bad about yourself, or that you are a failure or have let yourself or your family down',
    'Trouble concentrating on things, such as reading or watching TV',
    'Moving or speaking so slowly that others could notice, or being so restless that you move around a lot more than usual',
    'Thoughts that you would be better off dead, or of hurting yourself',
  ],
  gad7: [
    'Feeling nervous, anxious or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid, as if something awful might happen',
  ],
}
const OPTIONS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
const META: Record<Kind, { name: string; short: string; max: number; word: string; color: string; gradient: string }> = {
  phq9: { name: 'Mood check-up', short: 'PHQ-9', max: 27, word: 'Mood', color: '#6A5BBE', gradient: 'linear-gradient(140deg, #DDD8FF 0%, #ECE4F8 100%)' },
  gad7: { name: 'Worry check-up', short: 'GAD-7', max: 21, word: 'Worry', color: '#3A8C9F', gradient: 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)' },
}
const TITLE: Record<Severity, string> = {
  minimal: 'A light stretch',
  mild: 'A mixed stretch',
  moderate: 'A heavy stretch',
  moderately_severe: 'A very heavy stretch',
  severe: 'A very heavy stretch',
}
const BODY: Record<Severity, string> = {
  minimal: 'Your answers say things have felt mostly manageable lately. Keep doing what helps.',
  mild: 'Your answers say some days have been harder than others. Small steps and talking it through can help.',
  moderate: 'Your answers say things have felt heavy lately. This is not a diagnosis. It helps your specialist know how to support you.',
  moderately_severe: 'Your answers say things have felt very heavy lately. You are not alone in this: your specialist will see it and support you.',
  severe: 'Your answers say things have felt very heavy lately. You are not alone in this: your specialist will see it and support you soon.',
}

export default function QuestionnairePage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<QuestionnaireResult[]>([])
  const [loading, setLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)
  const [mode, setMode] = useState<'choose' | 'testing' | 'result'>('choose')
  const [kind, setKind] = useState<Kind>('phq9')
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<QuestionnaireResult | null>(null)

  function loadHistory() {
    setLoading(true)
    setHistoryError(false)
    getQuestionnaireResults()
      .then(setHistory)
      .catch(() => setHistoryError(true))
      .finally(() => setLoading(false))
  }
  useEffect(loadHistory, [])

  function start(k: Kind) {
    setKind(k)
    setAnswers(new Array(QUESTIONS[k].length).fill(-1))
    setIdx(0)
    setSubmitError(null)
    setMode('testing')
  }

  async function nextStep() {
    if (answers[idx] < 0) return
    if (idx < QUESTIONS[kind].length - 1) {
      setIdx(idx + 1)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const r = await submitQuestionnaire(kind, answers)
      setHistory((h) => [...h, r.result])
      setResult(r.result)
      if (r.crisis) {
        navigate('/patient/crisis', { state: { crisis: r.crisis } })
        return
      }
      setMode('result')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Your answers could not be sent.')
    } finally {
      setSubmitting(false)
    }
  }

  const sorted = [...history].sort((a, b) => b.created_at.localeCompare(a.created_at))

  if (mode === 'testing') {
    const qs = QUESTIONS[kind]
    return (
      <div className="relative min-h-svh overflow-hidden">
        <Hero tone="sky" />
        <div className="relative z-10 flex flex-col gap-4 px-5 pb-6 pt-6 lg:mx-auto lg:max-w-[760px] lg:px-6">
          <TopBar
            left={
              <GlassCircle aria-label="Leave the check-up" onClick={() => setMode('choose')}>
                <ArrowLeft className="size-5" />
              </GlassCircle>
            }
            center={
              <Pill>
                <Heart className="size-4" fill="currentColor" /> {META[kind].name} · {META[kind].short}
              </Pill>
            }
          />
          <div className="mt-3 flex items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
              <span className="block h-full rounded-full bg-ink transition-all" style={{ width: `${((idx + 1) / qs.length) * 100}%` }} />
            </span>
            <span className="text-[13px] text-ink-2">
              {idx + 1} of {qs.length}
            </span>
          </div>
          <Headline eyebrow="Over the last 2 weeks, how often have you been bothered by…" title={qs[idx]} size="md" className="mt-4 [&_h1]:text-[28px] [&_h1]:leading-[1.12] [&_p]:mx-auto [&_p]:max-w-[260px] lg:[&_h1]:text-[42px] lg:[&_p]:max-w-none" />
          <div role="radiogroup" aria-label="Answer" className="mt-3 flex flex-col gap-2.5">
            {OPTIONS.map((o, v) => (
              <ChoiceRow key={o} on={answers[idx] === v} onClick={() => setAnswers((a) => a.map((x, i) => (i === idx ? v : x)))} label={o} />
            ))}
          </div>
          <p className="text-center text-[13px] text-sub">There are no right or wrong answers.</p>
          {submitError && <Notice tone="error">{submitError} Your answers are kept: press the arrow to try again.</Notice>}
          <div className="flex justify-center gap-3">
            <button type="button" aria-label="Previous question" disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="flex size-[52px] items-center justify-center rounded-full bg-white shadow-[var(--shadow-float)] disabled:opacity-40">
              <ArrowLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label={idx === qs.length - 1 ? 'Finish' : 'Next question'}
              disabled={answers[idx] < 0 || submitting}
              onClick={() => void nextStep()}
              className="flex size-[52px] items-center justify-center rounded-full bg-ink text-white disabled:opacity-40"
            >
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'result' && result) {
    const meta = META[result.kind]
    const prev = sorted.filter((r) => r.kind === result.kind && r.id !== result.id)[0]
    const other = sorted.find((r) => r.kind !== result.kind)
    const diff = prev ? result.score - prev.score : null
    return (
      <div className="relative min-h-svh overflow-hidden">
        <Hero tone="pink" variant="flower" />
        <div className="relative z-10 flex flex-col gap-4 px-5 pb-6 pt-6 lg:mx-auto lg:max-w-[900px] lg:px-6">
          <TopBar
            left={
              <GlassCircle aria-label="Back to check-ups" onClick={() => setMode('choose')}>
                <ArrowLeft className="size-5" />
              </GlassCircle>
            }
            center={
              <Pill>
                <ShieldCheck className="size-4" fill="currentColor" stroke="white" /> Shared with specialist
              </Pill>
            }
          />
          <Headline eyebrow="Check-up complete · thank you" title={TITLE[result.severity]} className="mt-8" />
          <span className="mx-auto flex size-[60px] items-center justify-center rounded-full bg-white shadow-[var(--shadow-card)]">
            <ShieldCheck className="size-6" fill="currentColor" stroke="white" />
          </span>
          <p className="text-center text-[15.5px] leading-relaxed text-ink-2">{BODY[result.severity]}</p>
          <div className="grid grid-cols-2 gap-y-5 px-1">
            <Stat value={result.score} max={meta.max} label={`${meta.word} · today`} color={meta.color} />
            {other ? <Stat value={other.score} max={META[other.kind].max} label={`${META[other.kind].word} · ${dayLabel(other.created_at)}`} color={META[other.kind].color} /> : <span />}
            {diff !== null && <Stat value={diff > 0 ? `+${diff}` : diff === 0 ? '0' : `−${Math.abs(diff)}`} label={diff < 0 ? `Lighter than ${dayLabel(prev!.created_at)}` : diff > 0 ? `Heavier than ${dayLabel(prev!.created_at)}` : 'Same as last time'} />}
            <Stat value={history.length} label="Check-ups so far" />
          </div>
          <HistoryCard items={sorted} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-svh overflow-hidden">
      <Hero tone="sky" />
      <div className="relative z-10 flex flex-col gap-4 px-5 pb-6 pt-6 lg:mx-auto lg:max-w-[760px] lg:px-6">
        <TopBar
          center={
            <Pill>
              <Heart className="size-4" fill="currentColor" /> Check-ups
            </Pill>
          }
        />
        <Headline eyebrow="Two minutes, every two weeks" title="How have things felt lately?" className="mt-3" />
        <div className="mt-2 flex flex-col gap-3">
          {(['phq9', 'gad7'] as Kind[]).map((k) => (
            <button key={k} type="button" onClick={() => start(k)} className="flex items-center justify-between rounded-[26px] p-5 text-left shadow-[var(--shadow-soft)]" style={{ background: META[k].gradient }}>
              <span>
                <span className="block text-[22px] leading-tight tracking-[-0.5px]">{META[k].name}</span>
                <span className="block text-[14px]" style={{ color: META[k].color }}>
                  {META[k].short} · {QUESTIONS[k].length} questions · 2 min
                </span>
              </span>
              <span className="flex size-11 items-center justify-center rounded-full bg-ink text-white">
                <ArrowRight className="size-5" />
              </span>
            </button>
          ))}
        </div>
        {loading ? (
          <Skeleton className="h-40 rounded-[28px]" />
        ) : historyError ? (
          <Notice tone="error" action={<button type="button" onClick={loadHistory} className="text-[13px] underline">Retry</button>}>
            Could not load your past check-ups.
          </Notice>
        ) : (
          <HistoryCard items={sorted} />
        )}
      </div>
    </div>
  )
}

function Stat({ value, max, label, color }: { value: number | string; max?: number; label: string; color?: string }) {
  return (
    <div>
      <p className="flex items-baseline gap-1.5">
        <span className="text-[34px] leading-none tracking-[-1.2px]">{value}</span>
        {max && (
          <span className="text-[14px]" style={{ color }}>
            / {max}
          </span>
        )}
      </p>
      <p className="mt-1 text-[14px]" style={{ color: color ?? '#55575E' }}>
        {label}
      </p>
    </div>
  )
}

function HistoryCard({ items }: { items: QuestionnaireResult[] }) {
  return (
    <Card>
      <p className="text-[16px]">History</p>
      {items.length === 0 ? (
        <p className="mt-3 text-[14px] text-sub">No check-ups yet. Your first one will appear here.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {items.slice(0, 8).map((h) => (
            <li key={h.id} className="flex items-center gap-3 py-3 text-[14px]">
              <span className="w-14 font-medium" style={{ color: META[h.kind].color }}>
                {META[h.kind].short}
              </span>
              <span className={cn('flex-1 capitalize text-ink-2')}>{h.severity.replace('_', ' ')}</span>
              <span className="text-[12.5px] text-sub">{dayLabel(h.created_at)}</span>
              <span className="w-12 text-right">
                {h.score}
                <span className="text-sub">/{META[h.kind].max}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
