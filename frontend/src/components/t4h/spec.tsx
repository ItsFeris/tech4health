/** Building blocks for the specialist dashboard screens. Dhia owns this file. */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Inbox } from 'lucide-react'
import { Hero, Skeleton, SmallButton, type Tone } from './kit'
import { cn } from '@/lib/utils'

/** Page frame: wide hero behind the header + centered content column. */
export function SpecPage({ tone, children, heroHeight = 520 }: { tone: Tone; children: ReactNode; heroHeight?: number }) {
  return (
    <>
      <Hero tone={tone} variant="wide" height={heroHeight} />
      <div className="relative z-10 mx-auto max-w-[1216px] px-6 pb-16">{children}</div>
    </>
  )
}

export function BackPill({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm shadow-[var(--shadow-float)] hover:bg-soft">
      <ArrowLeft className="size-4" /> {children}
    </Link>
  )
}

export function SpecTitle({ eyebrow, title, children }: { eyebrow?: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      {eyebrow && <p className="text-[16px] text-ink-2">{eyebrow}</p>}
      <h1 className="headline mt-1 text-[56px]">{title}</h1>
      {children && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  )
}

export function Panel({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)]', className)}>
      {(title || aside) && (
        <div className="mb-4 flex items-baseline justify-between gap-3">
          {title && <h2 className="text-[22px] tracking-[-0.5px]">{title}</h2>}
          {aside && <span className="text-[13px] text-sub">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  )
}

export function BigStat({ value, unit, label, color }: { value: ReactNode; unit?: ReactNode; label: ReactNode; color?: string }) {
  return (
    <div>
      <p className="flex items-baseline gap-2">
        <span className="text-[44px] leading-none tracking-[-1.6px]">{value}</span>
        {unit && (
          <span className="text-[15px]" style={{ color }}>
            {unit}
          </span>
        )}
      </p>
      <p className="mt-1.5 text-[14px]" style={{ color: color ?? '#3E3F45' }}>
        {label}
      </p>
    </div>
  )
}

export function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)]">
      <Skeleton className="h-5 w-32" />
      <div className="mt-5 flex flex-col gap-3">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
    </div>
  )
}

export function EmptyPanel({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[28px] bg-white px-6 py-12 text-center shadow-[var(--shadow-card)]">
      <span className="flex size-14 items-center justify-center rounded-full bg-soft text-sub">
        <Inbox className="size-6" />
      </span>
      <p className="text-[20px] tracking-[-0.4px]">{title}</p>
      {children && <p className="max-w-md text-[14px] text-sub">{children}</p>}
      {action}
    </div>
  )
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-[28px] bg-white px-6 py-12 text-center shadow-[var(--shadow-card)]">
      <span className="flex size-14 items-center justify-center rounded-full bg-sos-soft text-sos">
        <AlertCircle className="size-6" />
      </span>
      <p className="text-[20px] tracking-[-0.4px]">Something didn&apos;t load</p>
      <p className="max-w-md text-[14px] text-sub">{message}</p>
      {onRetry && (
        <SmallButton tone="ink" className="mt-2" onClick={onRetry}>
          Try again
        </SmallButton>
      )}
    </div>
  )
}

/** Simple line chart for moods (1..5). `points` are in order; null = missing day. */
export function MoodLine({ points, labels, height = 180, color = '#4B3F8A', highlightLast = true, compact = false }: { points: (number | null)[]; labels: string[]; height?: number; color?: string; highlightLast?: boolean; compact?: boolean }) {
  const W = compact ? 320 : 640
  const H = height
  const padX = 18
  const padY = 16
  const x = (i: number) => padX + (i / Math.max(1, points.length - 1)) * (W - padX * 2)
  const y = (v: number) => padY + (1 - (v - 1) / 4) * (H - padY * 2 - 18)
  let d = ''
  points.forEach((v, i) => {
    if (v == null) return
    d += (d && points[i - 1] != null ? ' L' : ' M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)
  })
  const lastIdx = points.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0).pop()
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Mood over time, 1 is very low and 5 is great">
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={padX} x2={W - padX} y1={y(v)} y2={y(v)} stroke="#ECEBF0" strokeDasharray={v === 3 ? '0' : '3 5'} />
          <text x={2} y={y(v) + 4} fontSize="11" fill="#8A8890">
            {v}
          </text>
        </g>
      ))}
      <path d={d.trim()} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((v, i) =>
        v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={highlightLast && i === lastIdx ? 5 : 3} fill={highlightLast && i === lastIdx ? color : '#fff'} stroke={color} strokeWidth="1.6" />,
      )}
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 2} fontSize="11" fill="#8A8890" textAnchor="middle">
          {l}
        </text>
      ))}
    </svg>
  )
}
