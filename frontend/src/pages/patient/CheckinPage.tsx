// Daily mood check-in (design: 4 · Daily check-in).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun } from 'lucide-react'
import { getCheckins, sendCheckin } from '@/api'
import type { Checkin } from '@/types/contract'
import { Card, Headline, Hero, LogoOrb, MOODS, MoodFace, Notice, Pill, Skeleton, TopBar } from '@/components/t4h/kit'
import { avg, longDay, weekday } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDesktop } from '@/lib/useMedia'

type Mood = Checkin['mood']

export default function CheckinPage() {
  const navigate = useNavigate()
  const [mood, setMood] = useState<Mood>(3)
  const [note, setNote] = useState('')
  const [history, setHistory] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reply, setReply] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCheckins()
      .then(setHistory)
      .catch(() => setError('Could not load your last check-ins.'))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const r = await sendCheckin(mood, note.trim() || null)
      setHistory((h) => [...h, r.checkin])
      setNote('')
      setReply(r.ai_reply)
      if (r.crisis) navigate('/patient/crisis', { state: { crisis: r.crisis } })
    } catch {
      setError("Your check-in wasn't saved. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  const last7 = history.slice(-7)
  const average = avg(last7.map((c) => c.mood))

  const desktop = useDesktop()
  return (
    <div className="relative min-h-svh overflow-hidden">
      <Hero tone="peach" variant="flower" />
      <div className="relative z-10 flex flex-col gap-3.5 px-5 pb-6 pt-6 lg:mx-auto lg:grid lg:max-w-[1216px] lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-5 lg:px-6">
        <div className="lg:col-span-2">
        <TopBar
          center={
            <Pill>
              <Sun className="size-4" /> {longDay()}
            </Pill>
          }
        />
        </div>
        <Headline eyebrow="Daily check-in" title="How are you feeling?" className="mb-2 mt-3 lg:col-span-2 lg:mb-4 lg:mt-5" />

        <div className="flex flex-col gap-3.5 lg:col-start-1">
        <Card className="px-3 py-4 lg:px-8 lg:py-7">
          <div role="radiogroup" aria-label="Mood" className="flex items-end justify-between">
            {MOODS.map((m) => {
              const on = mood === m.v
              return (
                <button
                  key={m.v}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={`${m.v} of 5, ${m.label}`}
                  onClick={() => setMood(m.v)}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <span className={cn('rounded-full p-0.5 transition', on ? 'ring-2 ring-ink' : 'opacity-80 hover:opacity-100')}>
                    <MoodFace v={m.v} size={desktop ? (on ? 84 : 68) : on ? 56 : 44} />
                  </span>
                  <span className={cn('text-[12px]', on ? 'font-medium text-ink' : 'text-sub')}>{m.label}</span>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-5 pr-1.5 shadow-[var(--shadow-soft)]">
          <label htmlFor="note" className="sr-only">
            Note (optional)
          </label>
          <input
            id="note"
            dir="auto"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void save()}
            placeholder="Add a few words (optional)"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none placeholder:text-faint"
          />
          <button type="button" onClick={() => void save()} disabled={saving} className="h-11 rounded-full bg-ink px-5 text-[15px] text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {error && <Notice tone="error">{error}</Notice>}

        {reply && (
          <div className="flex items-start gap-3 rounded-[24px] p-4" style={{ background: 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)' }} aria-live="polite">
            <LogoOrb size={34} className="shadow-none" />
            <p dir="auto" className="text-[15px] leading-snug">
              {reply}
            </p>
          </div>
        )}
        </div>

        <Card className="lg:col-start-2 lg:row-start-3">
          <div className="flex items-baseline justify-between">
            <p className="text-[16px]">Last 7 check-ins</p>
            <p>
              <span className="text-[26px] tracking-[-0.8px]">{average ?? '–'}</span> <span className="text-[13px] text-sub">avg / 5</span>
            </p>
          </div>
          {loading ? (
            <Skeleton className="mt-4 h-28" />
          ) : last7.length === 0 ? (
            <p className="mt-4 text-[14px] text-sub">Your first check-in will appear here.</p>
          ) : (
            <div className="mt-4 flex h-32 items-end justify-between gap-2">
              {last7.map((c) => (
                <div key={c.id} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[11px] text-sub">{c.mood}</span>
                  <span
                    className="w-full max-w-[28px] rounded-full"
                    style={{ height: `${18 + c.mood * 15}px`, background: `linear-gradient(180deg, ${MOODS[c.mood - 1].c2}, ${MOODS[c.mood - 1].c1})` }}
                  />
                  <span className="text-[12px] text-ink-2">{weekday(c.created_at)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 hidden text-[12.5px] text-sub lg:block">Your check-ins are shared with your specialist before each session.</p>
        </Card>
      </div>
    </div>
  )
}
