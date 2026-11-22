// Patient detail (design: 12 · Patient detail).
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, Lock, Plus, Sparkles } from 'lucide-react'
import { ApiRequestError, createAppointment, createHomework, getAppointments, getChatHistory, getCheckins, getHomework, getPatients, getQuestionnaireResults, saveSessionNote } from '@/api'
import type { Appointment, Checkin, Homework, Message, PatientRow, QuestionnaireResult } from '@/types/contract'
import { FlatField, Notice, RiskChip, SmallButton } from '@/components/t4h/kit'
import { BackPill, BigStat, ErrorPanel, MoodLine, Panel, PanelSkeleton, SpecPage, SpecTitle } from '@/components/t4h/spec'
import { avg, dayLabel, timeLabel, weekday } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Data {
  row: PatientRow | null
  checkins: Checkin[]
  homework: Homework[]
  appointments: Appointment[]
  questionnaires: QuestionnaireResult[]
  chat: Message[] | 'private' | 'error'
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function PatientDetailPage() {
  const { patientId = '' } = useParams()
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setFailed(false)
    const from = new Date()
    from.setDate(from.getDate() - 13)
    const [rows, checkins, homework, appts, qs, chat] = await Promise.allSettled([
      getPatients(),
      getCheckins(patientId, iso(from)),
      getHomework(patientId),
      getAppointments(),
      getQuestionnaireResults(patientId),
      getChatHistory(patientId, 30),
    ])
    if (rows.status === 'rejected' || checkins.status === 'rejected' || homework.status === 'rejected') {
      setFailed(true)
      return
    }
    setData({
      row: rows.value.find((r) => r.patient_id === patientId) ?? null,
      checkins: checkins.value,
      homework: homework.value,
      appointments: appts.status === 'fulfilled' ? appts.value.filter((a) => a.patient_id === patientId) : [],
      questionnaires: qs.status === 'fulfilled' ? qs.value : [],
      chat: chat.status === 'fulfilled' ? chat.value : chat.reason instanceof ApiRequestError && chat.reason.status === 403 ? 'private' : 'error',
    })
  }, [patientId])

  useEffect(() => {
    void load()
  }, [load])

  if (failed)
    return (
      <SpecPage tone="lavender">
        <div className="pt-6">
          <BackPill to="/specialist">All patients</BackPill>
        </div>
        <div className="mt-10">
          <ErrorPanel message="This patient's data couldn't be loaded." onRetry={() => void load()} />
        </div>
      </SpecPage>
    )

  const d = data
  const name = d?.row?.nickname ?? (d ? 'Patient' : '…')
  const now = new Date().toISOString()
  const upcoming = (d?.appointments ?? []).filter((a) => a.status === 'scheduled' && a.starts_at >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const next = upcoming[0]
  const lastWeek = (d?.checkins ?? []).filter((c) => new Date(c.created_at).getTime() > Date.now() - 7 * 864e5)
  const phq = (d?.questionnaires ?? []).filter((q) => q.kind === 'phq9').sort((a, b) => a.created_at.localeCompare(b.created_at))
  const hwDone = (d?.homework ?? []).filter((h) => h.done).length

  // one point per day for the last 14 days (latest check-in of the day)
  const days = Array.from({ length: 14 }, (_, i) => {
    const x = new Date()
    x.setDate(x.getDate() - 13 + i)
    return x
  })
  const byDay = new Map<string, number>()
  for (const c of d?.checkins ?? []) byDay.set(new Date(c.created_at).toDateString(), c.mood)
  const points = days.map((x) => byDay.get(x.toDateString()) ?? null)

  return (
    <SpecPage tone="lavender">
      <div className="pt-6">
        <BackPill to="/specialist">All patients</BackPill>
      </div>
      <SpecTitle eyebrow={next ? `Next session ${dayLabel(next.starts_at)} · ${timeLabel(next.starts_at)}` : 'No session booked'} title={name}>
        {d?.row && <RiskChip risk={d.row.current_risk} className="h-9 px-4 text-[13px]" />}
        <Link to={`/specialist/patients/${patientId}/summary`} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm text-white">
          <Sparkles className="size-4" /> This week&apos;s summary
        </Link>
      </SpecTitle>

      {!d ? (
        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_380px]">
          <PanelSkeleton lines={6} />
          <PanelSkeleton lines={6} />
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-6 px-1 md:grid-cols-4">
            <BigStat value={avg(lastWeek.map((c) => c.mood)) ?? '–'} unit="/ 5" label="Average mood · 7 days" color="#6A5BBE" />
            <BigStat value={phq.at(-1)?.score ?? '–'} unit="/ 27" label={phq.at(-1) ? `PHQ-9 · ${dayLabel(phq.at(-1)!.created_at)}` : 'PHQ-9 · not taken'} color="#3A8C9F" />
            <BigStat value={`${hwDone}/${d.homework.length}`} label="Homework done" />
            <BigStat value={next ? timeLabel(next.starts_at) : '–'} unit={next ? weekday(next.starts_at) : undefined} label={next ? `Next session · ${dayLabel(next.starts_at)}` : 'Next session'} />
          </div>

          <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1fr_380px]">
            <div className="flex flex-col gap-5">
              <Panel title="Mood · last 14 days" aside="Daily check-ins, 1 = very low · 5 = great">
                {points.some((p) => p != null) ? (
                  <MoodLine points={points} labels={days.map((x, i) => (i % 2 === 1 ? '' : weekday(x)))} />
                ) : (
                  <p className="py-8 text-center text-sub">No check-ins in the last 14 days.</p>
                )}
              </Panel>

              <Panel title="PHQ-9 history" aside="Lower is lighter · out of 27">
                {phq.length === 0 ? (
                  <p className="py-6 text-center text-sub">No PHQ-9 yet.</p>
                ) : (
                  <div className="flex h-44 items-end gap-4 border-b border-line pb-2">
                    {phq.slice(-8).map((q) => (
                      <div key={q.id} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="text-[15px]">{q.score}</span>
                        <span className="w-full max-w-[46px] rounded-t-[12px] bg-[linear-gradient(180deg,#DDD8FF,#ECE4F8)]" style={{ height: `${10 + (q.score / 27) * 100}px` }} />
                        <span className="text-[11.5px] capitalize text-sub">{q.severity.replace('_', ' ')}</span>
                        <span className="text-[11.5px] text-faint">{dayLabel(q.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {d.chat === 'private' ? (
                <section className="flex items-center gap-4 rounded-[28px] p-6 shadow-[var(--shadow-card)]" style={{ background: 'linear-gradient(120deg, #DDE9F9 0%, #E8E1F7 100%)' }}>
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white">
                    <Lock className="size-5" fill="currentColor" stroke="white" />
                  </span>
                  <div className="flex-1">
                    <h2 className="text-[22px] tracking-[-0.5px]">Chat history is private</h2>
                    <p className="text-[14px] text-ink-2">{name} chose &quot;summaries only&quot;. You&apos;ll still see weekly summaries and any message the safety system flags.</p>
                  </div>
                  <Link to={`/specialist/patients/${patientId}/summary`} className="hidden h-10 shrink-0 items-center rounded-full bg-white px-4 text-sm sm:inline-flex">
                    Read the summary
                  </Link>
                </section>
              ) : d.chat === 'error' ? (
                <Notice tone="error">The chat history couldn&apos;t be loaded.</Notice>
              ) : (
                <Panel title="Chat with Nour" aside={`Last ${d.chat.length} messages · shared with consent`}>
                  {d.chat.length === 0 ? (
                    <p className="py-4 text-center text-sub">No messages yet.</p>
                  ) : (
                    <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
                      {d.chat.map((m) => (
                        <p
                          key={m.id}
                          dir="auto"
                          className={cn(
                            'max-w-[80%] rounded-[18px] px-3.5 py-2 text-[14px]',
                            m.sender === 'user' ? 'self-end bg-ink text-white' : 'self-start bg-soft',
                            m.risk === 'red' && 'ring-2 ring-sos',
                            m.risk === 'orange' && 'ring-2 ring-warn',
                          )}
                        >
                          {m.content}
                        </p>
                      ))}
                    </div>
                  )}
                </Panel>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <HomeworkPanel patientId={patientId} name={name} items={d.homework} onAdd={(h) => setData({ ...d, homework: [...d.homework, h] })} />
              <SessionsPanel patientId={patientId} items={d.appointments} onAdd={(a) => setData({ ...d, appointments: [...d.appointments, a] })} />
            </div>
          </div>
        </>
      )}
    </SpecPage>
  )
}

function HomeworkPanel({ patientId, name, items, onAdd }: { patientId: string; name: string; items: Homework[]; onAdd: (h: Homework) => void }) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    setError(null)
    try {
      onAdd(await createHomework({ patient_id: patientId, title: title.trim(), due_date: due || null }))
      setTitle('')
      setDue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign it.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title="Homework" aside={`${items.filter((h) => h.done).length} of ${items.length} done`}>
      <ul className="flex flex-col gap-2">
        {items.map((h) => (
          <li key={h.id} className="flex items-center gap-3 rounded-[16px] bg-soft px-3.5 py-2.5">
            <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full', h.done ? 'bg-ink text-white' : 'bg-white text-transparent')}>
              <Check className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px]">{h.title}</span>
              {h.due_date && <span className="block text-[12px] text-sub">Due {dayLabel(h.due_date)}</span>}
            </span>
            <span className={cn('text-[12px]', h.done ? 'text-ok-deep' : 'text-warn-deep')}>{h.done ? 'Done' : 'Not yet'}</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-[14px] text-sub">No homework yet.</li>}
      </ul>
      <form onSubmit={submit} className="mt-5 border-t border-line pt-4">
        <p className="text-[15px]">Assign homework</p>
        <label className="mt-3 block text-[12.5px] text-sub" htmlFor="hw-title">
          Task
        </label>
        <FlatField id="hw-title" className="mt-1" placeholder="e.g. Notice one moment you felt calm" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="mt-3 block text-[12.5px] text-sub" htmlFor="hw-due">
          Due
        </label>
        <FlatField id="hw-due" className="mt-1" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        {error && <p className="mt-2 text-[13px] text-sos">{error}</p>}
        <button type="submit" disabled={busy || !title.trim()} className="mt-4 h-11 w-full rounded-full bg-ink text-sm text-white disabled:opacity-50">
          {busy ? 'Assigning…' : `Assign to ${name}`}
        </button>
      </form>
    </Panel>
  )
}

function SessionsPanel({ patientId, items, onAdd }: { patientId: string; items: Appointment[]; onAdd: (a: Appointment) => void }) {
  const now = new Date().toISOString()
  const upcoming = items.filter((a) => a.status === 'scheduled' && a.starts_at >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const past = items.filter((a) => a.starts_at < now).sort((a, b) => b.starts_at.localeCompare(a.starts_at))
  const noteTarget = past[0] ?? upcoming[0]
  const [booking, setBooking] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [takeaways, setTakeaways] = useState('')
  const [busy, setBusy] = useState<'book' | 'note' | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function book(e: FormEvent) {
    e.preventDefault()
    if (!date) return
    setBusy('book')
    setMsg(null)
    try {
      onAdd(await createAppointment({ patient_id: patientId, starts_at: new Date(`${date}T${time}`).toISOString(), type: 'weekly' }))
      setBooking(false)
      setDate('')
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not book it.' })
    } finally {
      setBusy(null)
    }
  }

  async function saveNote() {
    if (!noteTarget || (!notes.trim() && !takeaways.trim())) return
    setBusy('note')
    setMsg(null)
    try {
      await saveSessionNote(noteTarget.id, { notes: notes.trim() || null, takeaways: takeaways.trim() || null })
      setMsg({ ok: true, text: `Saved for the session of ${dayLabel(noteTarget.starts_at)}.` })
      setNotes('')
      setTakeaways('')
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not save the note.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Panel title="Sessions" aside={<SmallButton onClick={() => setBooking((b) => !b)}><Plus className="size-3.5" /> Book</SmallButton>}>
      {booking && (
        <form onSubmit={book} className="mb-4 grid grid-cols-[1fr_110px] gap-2 rounded-[18px] bg-soft p-3">
          <FlatField type="date" required value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" className="bg-white" />
          <FlatField type="time" required value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" className="bg-white" />
          <button type="submit" disabled={busy === 'book'} className="col-span-2 h-10 rounded-full bg-ink text-sm text-white disabled:opacity-50">
            {busy === 'book' ? 'Booking…' : 'Book weekly session'}
          </button>
        </form>
      )}
      <div className="flex flex-col gap-2">
        {upcoming.slice(0, 3).map((a, i) => (
          <div key={a.id} className="rounded-[18px] p-3.5" style={{ background: i === 0 ? 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)' : '#F3F2F6' }}>
            <p className="text-[17px] tracking-[-0.3px]">
              {dayLabel(a.starts_at)} · <span className={a.type === 'urgent' ? 'text-teal-deep' : 'text-sub'}>{a.type === 'urgent' ? 'earlier slot' : 'weekly'}</span>
            </p>
            <p className="text-[12.5px] text-ink-2">{timeLabel(a.starts_at)}</p>
          </div>
        ))}
        {upcoming.length === 0 && <p className="text-[14px] text-sub">No upcoming session.</p>}
      </div>
      {noteTarget && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[15px]">Session note · {dayLabel(noteTarget.starts_at)}</p>
          <label className="mt-3 block text-[12.5px] text-sub" htmlFor="note-private">
            Private note (only you)
          </label>
          <textarea id="note-private" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you talk about? What's next?" className="mt-1 w-full resize-none rounded-xl bg-soft px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ink" />
          <label className="mt-2 block text-[12.5px] text-sub" htmlFor="note-takeaway">
            Takeaway for the patient (they will see it)
          </label>
          <FlatField id="note-takeaway" className="mt-1" value={takeaways} onChange={(e) => setTakeaways(e.target.value)} placeholder="e.g. One slow breath before each exam" />
          <button type="button" disabled={busy === 'note'} onClick={() => void saveNote()} className="mt-3 h-11 w-full rounded-full border border-line bg-white text-sm hover:bg-soft disabled:opacity-50">
            {busy === 'note' ? 'Saving…' : 'Save note'}
          </button>
        </div>
      )}
      {msg && <p className={cn('mt-2 text-[13px]', msg.ok ? 'text-ok-deep' : 'text-sos')}>{msg.text}</p>}
    </Panel>
  )
}
