// Weekly summary (design: 13 · Weekly summary).
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Sparkles } from 'lucide-react'
import { generateSummary, getCheckins, getPatients, getSummaries } from '@/api'
import type { Checkin, WeeklySummary } from '@/types/contract'
import { BackPill, EmptyPanel, ErrorPanel, MoodLine, Panel, PanelSkeleton, SpecPage, SpecTitle } from '@/components/t4h/spec'
import { dayLabel, mondayOf, weekday } from '@/lib/format'
import { cn } from '@/lib/utils'

const TREND = { improving: { word: 'improving', color: '#1C6B45' }, stable: { word: 'stable', color: '#2F7889' }, declining: { word: 'going down', color: '#8A4A0B' } }

export default function SummaryPage() {
  const { patientId = '' } = useParams()
  const week = mondayOf()
  const [name, setName] = useState('Patient')
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [list, rows, cis] = await Promise.all([getSummaries(patientId), getPatients().catch(() => []), getCheckins(patientId, week).catch(() => [])])
      setSummary(list.find((s) => s.week_start === week) ?? list[0] ?? null)
      setName(rows.find((r) => r.patient_id === patientId)?.nickname ?? 'Patient')
      setCheckins(cis)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [patientId, week])

  useEffect(() => {
    void load()
  }, [load])

  async function generate() {
    setGenerating(true)
    setGenError(null)
    try {
      setSummary(await generateSummary(patientId, week))
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'The summary could not be generated.')
    } finally {
      setGenerating(false)
    }
  }

  const end = new Date(week + 'T12:00:00')
  end.setDate(end.getDate() + 6)
  const days = Array.from({ length: 7 }, (_, i) => {
    const x = new Date(week + 'T12:00:00')
    x.setDate(x.getDate() + i)
    return x
  })
  const byDay = new Map<string, number>()
  for (const c of checkins) byDay.set(new Date(c.created_at).toDateString(), c.mood)
  const points = days.map((x) => byDay.get(x.toDateString()) ?? null)
  const c = summary?.content
  const done = c?.homework.filter((h) => h.done).length ?? 0

  return (
    <SpecPage tone="sky">
      <div className="pt-6">
        <BackPill to={`/specialist/patients/${patientId}`}>{name}</BackPill>
      </div>
      <SpecTitle eyebrow={`${name} · week of ${dayLabel(week)} – ${dayLabel(end)}`} title="Weekly summary">
        <button type="button" onClick={() => void generate()} disabled={generating} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm text-white disabled:opacity-70">
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {generating ? 'Writing the summary…' : summary ? 'Regenerate this week' : "Generate this week's summary"}
        </button>
      </SpecTitle>
      <p className="mt-2 text-center text-[12.5px] text-sub">Written by AI from check-ins, check-ups, homework and alerts. Review before use.</p>
      {genError && <p className="mt-2 text-center text-[13px] text-sos">{genError}</p>}

      <div className="mt-8">
        {loading || generating ? (
          <div className="grid gap-5 md:grid-cols-3">
            <PanelSkeleton lines={3} />
            <PanelSkeleton lines={4} />
            <PanelSkeleton lines={3} />
          </div>
        ) : loadError ? (
          <ErrorPanel message="The summary couldn't be loaded." onRetry={() => void load()} />
        ) : !c ? (
          <EmptyPanel title="No summary for this week yet">Generate it before the session: it takes a few seconds and reads this week&apos;s check-ins, check-ups and homework.</EmptyPanel>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 md:grid-cols-3">
              <section className="rounded-[28px] p-6 shadow-[var(--shadow-card)]" style={{ background: 'linear-gradient(140deg, #DDD8FF 0%, #ECE4F8 100%)' }}>
                <h2 className="text-[22px] tracking-[-0.5px]">
                  Mood <span style={{ color: TREND[c.mood_trend].color }}>{TREND[c.mood_trend].word}</span>
                </h2>
                <p className="mt-3 flex items-baseline gap-2 border-l-2 border-white/80 pl-3">
                  <span className="text-[48px] leading-none tracking-[-1.8px]">{c.mood_avg ?? '–'}</span>
                  <span className="text-[13px] text-lav-deep">avg / 5</span>
                </p>
                {points.some((p) => p != null) && (
                  <div className="mt-3">
                    <MoodLine compact points={points} labels={days.map((x) => weekday(x)[0])} height={150} />
                  </div>
                )}
              </section>

              <Panel title="Key events">
                <ul className="divide-y divide-line">
                  {c.key_events.map((e) => (
                    <li key={e} dir="auto" className="py-2.5 text-[14.5px]">
                      {e}
                    </li>
                  ))}
                  {c.key_events.length === 0 && <li className="text-[14px] text-sub">Nothing notable this week.</li>}
                </ul>
              </Panel>

              <Panel title="Homework">
                <div className="flex gap-6">
                  <p>
                    <span className="block text-[34px] leading-none">{done}</span>
                    <span className="text-[13px] text-ok-deep">done</span>
                  </p>
                  <p>
                    <span className="block text-[34px] leading-none">{c.homework.length - done}</span>
                    <span className="text-[13px] text-warn-deep">not done</span>
                  </p>
                </div>
                <ul className="mt-4 flex flex-col gap-2">
                  {c.homework.map((h) => (
                    <li key={h.title} className="flex items-center gap-2.5 text-[14px]">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11.5px]', h.done ? 'bg-ok-soft text-ok-deep' : 'bg-warn-soft text-warn-deep')}>{h.done ? 'Done' : 'Not yet'}</span>
                      {h.title}
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <Panel title="Concerns">
                <ul className="flex flex-col gap-3">
                  {c.concerns.map((x) => (
                    <li key={x} dir="auto" className="flex gap-3 text-[14px]">
                      <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-warn-soft">
                        <span className="size-2 rounded-full bg-warn" />
                      </span>
                      {x}
                    </li>
                  ))}
                  {c.concerns.length === 0 && (
                    <li className="flex gap-3 text-[14px]">
                      <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-ok-soft">
                        <span className="size-2 rounded-full bg-ok" />
                      </span>
                      No concerns flagged this week.
                    </li>
                  )}
                </ul>
              </Panel>
            </div>

            {c.prep_topic && (
              <section className="relative overflow-hidden rounded-[28px] p-7 shadow-[var(--shadow-card)]" style={{ background: 'linear-gradient(120deg, #F9E4BB 0%, #FBD7C8 100%)' }}>
                <p className="text-[13px] text-warn-deep">Suggested topic for the next session</p>
                <p dir="auto" className="mt-2 max-w-3xl text-[30px] leading-tight tracking-[-0.8px]">
                  {c.prep_topic}
                </p>
                <p className="mt-3 text-[12.5px] text-ink-2">Suggested by AI. Review before use.</p>
              </section>
            )}
          </div>
        )}
      </div>
    </SpecPage>
  )
}
