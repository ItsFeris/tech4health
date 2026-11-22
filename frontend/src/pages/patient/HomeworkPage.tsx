// This week's homework (design: 5 · Homework, plus the empty state).
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Heart, Sprout } from 'lucide-react'
import { getHomework, getLatestTakeaways, getSpecialist, updateHomework } from '@/api'
import type { Homework } from '@/types/contract'
import { Cta, Headline, Hero, Notice, Pill, Skeleton, TopBar } from '@/components/t4h/kit'
import { dayLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuth } from '@/auth/AuthContext'
import { SpecialistPhoto } from '@/components/t4h/specialist'
import type { SpecialistCard, Takeaways } from '@/types/contract'

const CARD_TONES = [
  { g: 'linear-gradient(140deg, #F0CEB1 0%, #F6E2D2 100%)', c: '#B06F45' },
  { g: 'linear-gradient(140deg, #E4F2F9 0%, #D4EAF0 100%)', c: '#4F7FB8' },
  { g: 'linear-gradient(140deg, #DDD8FF 0%, #E7E0F7 100%)', c: '#7A69C8' },
  { g: 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)', c: '#3A8C9F' },
]

type Filter = 'todo' | 'done' | 'all'

export default function HomeworkPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')

  const { me } = useAuth()
  const [note, setNote] = useState<Takeaways | null>(null)
  const [specialist, setSpecialist] = useState<SpecialistCard | null>(null)

  useEffect(() => {
    getLatestTakeaways().then(setNote).catch(() => setNote(null))
    if (me?.specialist_id) getSpecialist(me.specialist_id).then(setSpecialist).catch(() => setSpecialist(null))
  }, [me?.specialist_id])

  useEffect(() => {
    getHomework()
      .then(setItems)
      .catch(() => setError('Could not load your homework. Check your connection.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggle(h: Homework) {
    setItems((prev) => prev.map((x) => (x.id === h.id ? { ...x, done: !h.done } : x)))
    try {
      await updateHomework(h.id, { done: !h.done })
    } catch {
      setItems((prev) => prev.map((x) => (x.id === h.id ? { ...x, done: h.done } : x)))
      setError("That change wasn't saved. Try again.")
    }
  }

  const done = items.filter((h) => h.done).length
  const visible = items.filter((h) => filter === 'all' || (filter === 'done' ? h.done : !h.done))

  return (
    <div className="relative min-h-svh overflow-hidden">
      <Hero tone="lavender" />
      <div className="relative z-10 flex flex-col gap-4 px-5 pb-6 pt-6 lg:mx-auto lg:grid lg:max-w-[1216px] lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-5 lg:px-6">
        <div className="lg:col-span-2">
        <TopBar
          center={
            <Pill>
              <Heart className="size-4" fill="currentColor" /> From your specialist
            </Pill>
          }
        />
        </div>
        <Headline eyebrow="This week's homework" title="Small steps" className="mt-3 lg:col-span-2 lg:mt-5" />

        <div className="flex flex-col gap-4 lg:col-start-1">
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="mx-auto h-[38px] w-56 rounded-full" />
            <Skeleton className="h-[108px] rounded-[26px]" />
            <Skeleton className="h-[108px] rounded-[26px]" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <span className="flex size-24 items-center justify-center rounded-full bg-white shadow-[var(--shadow-card)]">
              <Sprout className="size-10 text-teal-ink" />
            </span>
            <p className="text-[22px] tracking-[-0.5px]">Nothing to do this week</p>
            <p className="max-w-[280px] text-[15px] text-sub">Your specialist will add small steps after your next session. Rest is part of the work too.</p>
            <Cta className="mt-4" onClick={() => navigate('/patient')}>
              Talk to Nour
            </Cta>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <Pill>
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-soft">
                  <span className="block h-full rounded-full bg-ink" style={{ width: `${(done / items.length) * 100}%` }} />
                </span>
                {done} of {items.length} done
              </Pill>
            </div>
            <div role="tablist" className="flex justify-center gap-2">
              {(
                [
                  ['todo', 'To do'],
                  ['done', 'Done'],
                  ['all', 'All'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  onClick={() => setFilter(id)}
                  className={cn('h-[38px] rounded-full px-[18px] text-[14px] transition', filter === id ? 'bg-ink text-white' : 'bg-white text-ink shadow-[var(--shadow-soft)]')}
                >
                  {label}
                </button>
              ))}
            </div>
            {error && <Notice tone="error">{error}</Notice>}
            <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
              {visible.map((h) => {
                const t = CARD_TONES[items.indexOf(h) % CARD_TONES.length]
                return (
                  <li key={h.id} className={cn('relative overflow-hidden rounded-[26px] p-[18px] transition', h.done && 'opacity-70')} style={{ background: t.g }}>
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-[20px] leading-tight tracking-[-0.4px]', h.done && 'line-through decoration-1')}>{h.title}</p>
                        {h.description && (
                          <p className="mt-1 text-[14px] leading-snug" style={{ color: t.c }}>
                            {h.description}
                          </p>
                        )}
                        {h.due_date && <p className="mt-2 text-[13px] text-ink-2">Due {dayLabel(h.due_date)}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => void toggle(h)}
                        aria-label={h.done ? `Mark "${h.title}" as not done` : `Mark "${h.title}" as done`}
                        className={cn('flex size-11 shrink-0 items-center justify-center rounded-full transition', h.done ? 'bg-ink text-white' : 'bg-white/80 text-transparent hover:text-faint')}
                      >
                        <Check className="size-5" />
                      </button>
                    </div>
                  </li>
                )
              })}
              {visible.length === 0 && <p className="py-6 text-center text-[14px] text-sub">{filter === 'done' ? 'Nothing ticked yet. One small step is enough.' : 'All done. Well done!'}</p>}
            </ul>
          </>
        )}
        </div>

        {/* The specialist's words after the last session (session note takeaways). */}
        {note && (
          <figure className="rounded-[26px] bg-white p-5 shadow-[var(--shadow-soft)] lg:col-start-2 lg:row-start-3">
            <figcaption className="flex items-center gap-3">
              {specialist && <SpecialistPhoto id={specialist.id} photoUrl={specialist.photo_url} name={specialist.nickname} size={44} />}
              <span>
                <span className="block text-[15px]">{specialist?.nickname ?? 'Your specialist'}</span>
                <span className="block text-[12.5px] text-sub">After {new Date(note.session_date).toLocaleDateString('en-GB', { weekday: 'long' })}&apos;s session</span>
              </span>
            </figcaption>
            <blockquote dir="auto" className="mt-3 text-[16px] leading-snug text-ink">
              “{note.takeaways}”
            </blockquote>
          </figure>
        )}
      </div>
    </div>
  )
}
