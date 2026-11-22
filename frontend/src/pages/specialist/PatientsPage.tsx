// Patients list, sorted by risk (design: 11 · Patients list + dashboard states).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { getPatients } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import type { PatientRow, Risk } from '@/types/contract'
import { RiskChip, Skeleton, Sparkline } from '@/components/t4h/kit'
import { EmptyPanel, ErrorPanel, SpecPage, SpecTitle } from '@/components/t4h/spec'
import { dayLabel, initials, longDay, moodWord, timeLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

const TILES: { id: Risk; a: string; b: string; g: string; c: string }[] = [
  { id: 'red', a: 'In crisis', b: 'act now', g: 'linear-gradient(140deg, #FBD7D3 0%, #F6CDDB 100%)', c: '#A6261C' },
  { id: 'orange', a: 'Needs', b: 'attention', g: 'linear-gradient(140deg, #F9E4BB 0%, #FBD7C8 100%)', c: '#8A4A0B' },
  { id: 'green', a: 'Doing', b: 'fine', g: 'linear-gradient(140deg, #D9F0EA 0%, #CBECF5 100%)', c: '#1C6B45' },
]
const AVATAR = ['#F6CDDB', '#F9E4BB', '#C7E3D0', '#CBECF5', '#DDD8FF', '#D4EAF0', '#FBD7C8']

export default function PatientsPage() {
  const { data, error, loading, reload } = useAsync(() => getPatients(), [])
  const [filter, setFilter] = useState<Risk | 'all'>('all')
  const [q, setQ] = useState('')

  const rows: PatientRow[] = data ?? []
  const count = (r: Risk) => rows.filter((p) => p.current_risk === r).length
  const visible = rows.filter((p) => (filter === 'all' || p.current_risk === filter) && p.nickname.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <SpecPage tone="teal">
      <SpecTitle eyebrow={`${longDay()} · sorted by risk`} title="Your patients" />

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TILES.map((t) => {
          const on = filter === t.id
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(on ? 'all' : t.id)}
              className="flex items-end justify-between rounded-[26px] p-5 text-left transition"
              style={{ background: t.g, outline: on ? '2px solid #111113' : '2px solid rgba(255,255,255,.8)' }}
            >
              <span className="text-[22px] leading-tight tracking-[-0.5px]">
                {t.a}
                <br />
                <span style={{ color: t.c }}>{t.b}</span>
              </span>
              <span className="border-l-2 border-white/80 pl-3 text-[52px] leading-none tracking-[-2px]">{loading ? '·' : count(t.id)}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorPanel message="We couldn't load your patients. Check your connection, then try again." onRetry={reload} />
        ) : (
          <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[24px] tracking-[-0.5px]">{filter === 'all' ? 'All patients' : TILES.find((t) => t.id === filter)!.a + ' ' + TILES.find((t) => t.id === filter)!.b}</h2>
              <label className="flex h-11 w-full max-w-[280px] items-center gap-2 rounded-full bg-soft px-4">
                <Search className="size-4 text-sub" />
                <span className="sr-only">Search by name</span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-faint" />
              </label>
            </div>

            {loading ? (
              <div className="mt-6 flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyPanel title="No patients yet">Patients appear here once they sign up and finish onboarding.</EmptyPanel>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-line text-[13px] text-sub">
                      <th className="py-3 pr-4 font-normal">Patient</th>
                      <th className="py-3 pr-4 font-normal">Risk</th>
                      <th className="py-3 pr-4 font-normal">Open alerts</th>
                      <th className="py-3 pr-4 font-normal">Last mood</th>
                      <th className="py-3 pr-4 font-normal">Last 7 days</th>
                      <th className="py-3 pr-4 font-normal">Next appointment</th>
                      <th className="py-3 font-normal">
                        <span className="sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((p, i) => (
                      <tr key={p.patient_id} className="border-b border-line/70 last:border-0 hover:bg-[#FAFAFB]">
                        <td className="py-3 pr-4">
                          <Link to={`/specialist/patients/${p.patient_id}`} className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-full text-[13px]" style={{ background: AVATAR[i % AVATAR.length] }}>
                              {initials(p.nickname)}
                            </span>
                            <span className="text-[16px]">{p.nickname}</span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <RiskChip risk={p.current_risk} />
                        </td>
                        <td className={cn('py-3 pr-4', p.open_alerts > 0 ? 'font-semibold text-sos' : 'text-sub')}>{p.open_alerts}</td>
                        <td className="py-3 pr-4">
                          {p.last_mood ?? '–'} <span className="text-sub">· {moodWord(p.last_mood)}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <Sparkline values={p.mood_7d} color={p.current_risk === 'red' ? '#C8362D' : p.current_risk === 'orange' ? '#E58A2B' : '#111113'} />
                        </td>
                        <td className="py-3 pr-4">{p.next_appointment ? `${dayLabel(p.next_appointment)} · ${timeLabel(p.next_appointment)}` : <span className="text-sub">None booked</span>}</td>
                        <td className="py-3 text-right">
                          <Link to={`/specialist/patients/${p.patient_id}`} aria-label={`Open ${p.nickname}`} className="inline-flex size-10 items-center justify-center rounded-full bg-soft hover:bg-soft-2">
                            <ArrowRight className="size-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visible.length === 0 && <p className="py-8 text-center text-sub">No patient matches.</p>}
              </div>
            )}
          </section>
        )}
      </div>
    </SpecPage>
  )
}
