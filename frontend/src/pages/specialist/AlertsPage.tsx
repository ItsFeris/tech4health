// Alerts inbox with live updates (design: 14 · Alerts inbox + live toast).
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Heart, Sparkles, TrendingDown, Type } from 'lucide-react'
import { getAlerts, updateAlert } from '@/api'
import type { Alert, RiskSource } from '@/types/contract'
import { RiskChip, Skeleton, SmallButton } from '@/components/t4h/kit'
import { EmptyPanel, ErrorPanel, SpecPage, SpecTitle } from '@/components/t4h/spec'
import { whenLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

const LAYER: Record<RiskSource, { label: string; icon: typeof Heart; bg: string; fg: string }> = {
  rules: { label: 'Keywords', icon: Type, bg: '#ECE8FF', fg: '#4B3F8A' },
  llm: { label: 'AI check', icon: Sparkles, bg: '#DDF1F2', fg: '#245F6C' },
  trend: { label: 'Mood trend', icon: TrendingDown, bg: '#E6F0FA', fg: '#2F5C8F' },
  sos: { label: 'SOS button', icon: Heart, bg: '#FBE4E2', fg: '#9F1F17' },
  questionnaire: { label: 'Questionnaire', icon: ClipboardList, bg: '#FDEEDD', fg: '#8A4A0B' },
}
const STATUS: Record<Alert['status'], string> = { open: 'Open', seen: 'Seen', false_alarm: 'False alarm', resolved: 'Resolved' }
type Tab = 'all' | Alert['status']

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<Tab>('open')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  function load() {
    setError(false)
    getAlerts(null)
      .then(setAlerts)
      .catch(() => setError(true))
  }

  useEffect(() => {
    load()
    // the layout's live feed tells us when a new alert arrives
    const onArrive = (e: Event) => {
      const a = (e as CustomEvent<Alert>).detail
      setAlerts((prev) => (prev && !prev.some((x) => x.id === a.id) ? [a, ...prev] : prev))
    }
    window.addEventListener('t4h:alert-arrived', onArrive)
    return () => window.removeEventListener('t4h:alert-arrived', onArrive)
  }, [])

  async function setStatus(a: Alert, status: Alert['status']) {
    setBusyId(a.id)
    setActionError(null)
    try {
      const updated = await updateAlert(a.id, status)
      setAlerts((prev) => prev?.map((x) => (x.id === a.id ? updated : x)) ?? null)
      window.dispatchEvent(new Event('t4h:alerts-changed'))
    } catch {
      setActionError(`Couldn't update the alert for ${a.patient_nickname}. Try again.`)
    } finally {
      setBusyId(null)
    }
  }

  const list = (alerts ?? []).filter((a) => tab === 'all' || a.status === tab)
  const n = (t: Tab) => (alerts ?? []).filter((a) => t === 'all' || a.status === t).length

  return (
    <SpecPage tone="peach">
      <SpecTitle eyebrow="Newest first" title="Alerts">
        <span className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[13px] shadow-[var(--shadow-float)]">
          <span className="size-2 rounded-full bg-ok" /> Live · updates instantly
        </span>
      </SpecTitle>

      <div role="tablist" className="mt-8 flex flex-wrap justify-center gap-2">
        {(['open', 'seen', 'false_alarm', 'resolved', 'all'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn('h-10 rounded-full px-4 text-[14px] transition', tab === t ? 'bg-ink text-white' : 'bg-white text-ink shadow-[var(--shadow-soft)]')}
          >
            {t === 'all' ? 'All' : STATUS[t]} <span className={tab === t ? 'text-white/60' : 'text-faint'}>{alerts ? n(t) : ''}</span>
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-[1000px] flex-col gap-4">
        {actionError && <p className="text-center text-[13px] text-sos">{actionError}</p>}
        {error ? (
          <ErrorPanel message="Alerts couldn't be loaded. New crisis alerts still pop up live while this page is open." onRetry={load} />
        ) : !alerts ? (
          [0, 1].map((i) => <Skeleton key={i} className="h-40 rounded-[28px]" />)
        ) : list.length === 0 ? (
          <EmptyPanel title={tab === 'open' ? 'No open alerts' : 'Nothing here'}>{tab === 'open' ? 'All clear. New alerts appear here the moment they happen.' : 'No alerts with this status.'}</EmptyPanel>
        ) : (
          list.map((a) => {
            const layer = LAYER[a.source]
            const Icon = layer.icon
            return (
              <article key={a.id} className={cn('flex flex-col gap-4 rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)] md:flex-row', a.status !== 'open' && 'opacity-80')}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <RiskChip risk={a.level} />
                    <span className="text-[15px]">{a.patient_nickname}</span>
                    <span className="text-sub">· {whenLabel(a.created_at)}</span>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[12px]', a.status === 'open' ? 'bg-ink text-white' : 'bg-soft text-sub')}>{STATUS[a.status]}</span>
                  </div>
                  <p className="mt-2 text-[22px] leading-snug tracking-[-0.5px]">{a.reason}</p>
                  {a.message_excerpt && (
                    <p dir="auto" className="mt-3 rounded-[16px] bg-soft px-4 py-3 text-[14.5px] text-ink-2">
                      “{a.message_excerpt}”
                    </p>
                  )}
                  <p className="mt-3 flex items-center gap-2 text-[13px] text-sub">
                    Caught by
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-full px-3" style={{ background: layer.bg, color: layer.fg }}>
                      <Icon className="size-3.5" /> {layer.label}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 md:w-[270px]">
                  <Link to={`/specialist/patients/${a.patient_id}`} className="flex h-11 items-center justify-center rounded-full bg-ink text-sm text-white">
                    Open patient
                  </Link>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['seen', 'false_alarm', 'resolved'] as const).map((s) => (
                      <SmallButton key={s} disabled={busyId === a.id || a.status === s} onClick={() => void setStatus(a, s)} className={cn('h-10 px-1 text-[12px] leading-tight', a.status === s && 'bg-soft')}>
                        {STATUS[s]}
                      </SmallButton>
                    ))}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </SpecPage>
  )
}
