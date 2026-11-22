/**
 * Mindora UI kit, built from the Claude Design file. Dhia owns this file; every screen imports it.
 * Look: ink black + pastel gradient heroes, Inter Tight, big light headlines, white floating pills.
 */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Risk } from '@/types/contract'

/* ---------------------------------------------------------------- backgrounds */

export type Tone = 'teal' | 'lavender' | 'peach' | 'pink' | 'mint' | 'sky'

export const TONES: Record<Tone, string> = {
  teal: 'linear-gradient(140deg, #B3DFE5 0%, #C1E5EB 45%, #C7E3D0 100%)',
  lavender: 'linear-gradient(140deg, #D9C9F3 0%, #E6DAF6 50%, #F4DCE7 100%)',
  peach: 'linear-gradient(150deg, #FBE3B8 0%, #FBD9C6 55%, #F6D3DD 100%)',
  pink: 'linear-gradient(150deg, #F9D9CF 0%, #F6CDDB 60%, #E9D8F4 100%)',
  mint: 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)',
  sky: 'linear-gradient(140deg, #CFE6F2 0%, #DCEEF6 50%, #E5E2F8 100%)',
}

/** Soft gradient + glassy petals behind the top of a screen. Place as the first child of a `relative` container. */
export function Hero({ tone = 'teal', height = 420, variant = 'petals' }: { tone?: Tone; height?: number; variant?: 'petals' | 'flower' | 'wide' }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" style={{ height, background: TONES[tone] }}>
      {variant === 'wide' ? (
        <>
          <div className="absolute left-[4%] top-[-180px] size-[460px] rounded-full border border-white/50" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.4), rgba(255,255,255,.03))' }} />
          <Petal className="left-[34%] top-[-260px] size-[560px] rotate-[24deg]" />
          <div className="absolute right-[-120px] top-[-40px] size-[420px] rounded-full border border-white/50" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.35), rgba(255,255,255,.03))' }} />
        </>
      ) : variant === 'petals' ? (
        <>
          <Petal className="-left-10 -top-8 size-[260px] -rotate-12" />
          <Petal className="-right-16 top-5 size-[240px] rotate-[78deg]" />
          <div
            className="absolute left-[18%] top-[110px] size-[300px] rounded-full border border-white/55"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,.55), rgba(255,255,255,.05))' }}
          />
        </>
      ) : (
        <div className="absolute left-1/2 top-[-60px] size-[520px] -translate-x-1/2">
          {[0, 72, 144, 216, 288].map((r) => (
            <span
              key={r}
              className="absolute left-1/2 top-1/2 h-[250px] w-[150px] origin-[50%_100%] rounded-[50%] border border-white/60"
              style={{ transform: `translate(-50%, -100%) rotate(${r}deg)`, background: 'linear-gradient(180deg, rgba(255,255,255,.45), rgba(255,255,255,.04))' }}
            />
          ))}
        </div>
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(248,248,250,0) 38%, #F8F8FA 94%)' }} />
    </div>
  )
}

function Petal({ className }: { className?: string }) {
  return (
    <div
      className={cn('absolute rounded-[100%_0_100%_0] border border-white/65', className)}
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.55), rgba(255,255,255,.06))' }}
    />
  )
}

/* ---------------------------------------------------------------- brand + top bar */

export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <circle cx="12" cy="7.4" r="3.4" />
      <circle cx="12" cy="16.6" r="3.4" />
      <circle cx="7.4" cy="12" r="3.4" />
      <circle cx="16.6" cy="12" r="3.4" />
    </svg>
  )
}

/** The iridescent round logo used as the "home" mark and as Nour's avatar. */
export function LogoOrb({ size = 52, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-full border border-white/80 text-white shadow-[var(--shadow-float)]', className)}
      style={{ width: size, height: size, background: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #CBECF5 30%, #DDD8FF 65%, #A9DBE3 100%)' }}
    >
      <LogoGlyph className="size-[45%] text-[#3E7E95]" />
    </span>
  )
}

export function GlassCircle({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn('flex size-[52px] shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/55 text-ink backdrop-blur-sm transition hover:bg-white/80', className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function Pill({ className, children, as: As = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'span' }) {
  return (
    <As className={cn('inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-full bg-white px-[18px] text-sm text-ink shadow-[var(--shadow-float)]', className)}>
      {children}
    </As>
  )
}

export function SosButton({ className }: { className?: string }) {
  return (
    <Link
      to="/patient/sos"
      aria-label="SOS: alert my specialist"
      className={cn('flex size-[52px] shrink-0 items-center justify-center rounded-full bg-sos text-[13px] font-semibold tracking-wide text-white shadow-[0_10px_24px_rgba(200,54,45,.35)] transition hover:brightness-110', className)}
    >
      SOS
    </Link>
  )
}

/** Left mark · center pill · right action, as on every patient screen. */
export function TopBar({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  return (
    // On desktop the patient layout draws the header: the phone top bar only keeps its space.
    <div className="relative z-10 flex items-center justify-between gap-2 lg:invisible">
      <div className="flex w-[52px] justify-start">{left ?? <LogoOrb />}</div>
      <div className="flex min-w-0 justify-center">{center}</div>
      <div className="flex w-[52px] justify-end">{right ?? <SosButton />}</div>
    </div>
  )
}

export function Headline({ eyebrow, title, className, size = 'lg' }: { eyebrow?: ReactNode; title: ReactNode; className?: string; size?: 'lg' | 'xl' | 'md' }) {
  return (
    <div className={cn('relative z-10 text-center', className)}>
      {eyebrow && <p className="text-[15px] text-ink-2">{eyebrow}</p>}
      <h1 className={cn('headline mt-1 text-ink', size === 'xl' ? 'text-[46px] lg:text-[56px]' : size === 'md' ? 'text-[28px] lg:text-[34px]' : 'text-[34px] lg:text-[46px]')}>{title}</h1>
    </div>
  )
}

/* ---------------------------------------------------------------- actions */

type CtaProps = ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'ink' | 'sos'; loading?: boolean }

/** Big rounded call-to-action with the white arrow disc on the right. */
export function Cta({ tone = 'ink', loading, className, children, disabled, ...props }: CtaProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'flex h-14 w-full items-center justify-between rounded-full pl-6 pr-2 text-[17px] text-white transition disabled:opacity-60',
        tone === 'ink' ? 'bg-ink hover:bg-black' : 'bg-sos shadow-[0_14px_30px_rgba(200,54,45,.32)] hover:brightness-110',
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      <span className={cn('flex size-11 items-center justify-center rounded-full bg-white', tone === 'ink' ? 'text-ink' : 'text-sos')}>
        {loading ? <Loader2 className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
      </span>
    </button>
  )
}

export function GhostButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn('flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-line bg-white text-[15px] text-ink transition hover:bg-soft disabled:opacity-60', className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function SmallButton({ tone = 'white', className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'white' | 'ink' }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] transition disabled:opacity-50',
        tone === 'ink' ? 'bg-ink text-white hover:bg-black' : 'border border-line bg-white text-ink hover:bg-soft',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ---------------------------------------------------------------- inputs */

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] text-ink-2">
      {children}
    </label>
  )
}

export function Field({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('h-[52px] w-full rounded-[18px] border-0 bg-white px-[18px] text-[15px] text-ink shadow-[var(--shadow-soft)] outline-none placeholder:text-faint focus:ring-2 focus:ring-ink', className)}
      {...props}
    />
  )
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('w-full resize-none rounded-[18px] border-0 bg-white px-[18px] py-3.5 text-[15px] text-ink shadow-[var(--shadow-soft)] outline-none placeholder:text-faint focus:ring-2 focus:ring-ink', className)}
      {...props}
    />
  )
}

/** Desktop-dashboard input: flat grey, no shadow. */
export function FlatField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-11 w-full rounded-xl border-0 bg-soft px-3.5 text-sm text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-ink', className)} {...props} />
}

/** Row choice used for languages and questionnaire answers: black when picked, with a check disc. */
export function ChoiceRow({ on, onClick, label, sub, labelClassName, className }: { on: boolean; onClick: () => void; label: ReactNode; sub?: ReactNode; labelClassName?: string; className?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-full py-2.5 pl-[22px] pr-2.5 text-left transition',
        sub ? 'min-h-[72px] rounded-[24px]' : 'min-h-[58px]',
        on ? 'bg-ink text-white' : 'bg-white text-ink shadow-[var(--shadow-soft)] hover:bg-white/80',
        className,
      )}
    >
      <span className="min-w-0">
        <span className={cn('block text-[16px]', sub && 'text-[19px] tracking-[-0.3px]', labelClassName)}>{label}</span>
        {sub && <span className={cn('block text-[13px]', on ? 'text-white/75' : 'text-sub')}>{sub}</span>}
      </span>
      <span className={cn('flex size-[38px] shrink-0 items-center justify-center rounded-full', on ? 'bg-white text-ink' : 'bg-soft text-transparent')}>
        <Check className="size-4" />
      </span>
    </button>
  )
}

/** Big pastel card that can be selected (consent, role). */
export function GradientChoice({ on, onClick, gradient, children, className }: { on: boolean; onClick: () => void; gradient: string; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn('relative overflow-hidden rounded-[24px] p-[18px] text-left transition', className)}
      style={{ background: gradient, border: `2px solid ${on ? '#111113' : 'rgba(255,255,255,.85)'}` }}
    >
      <span className={cn('absolute right-3.5 top-3.5 flex size-[26px] items-center justify-center rounded-full', on ? 'bg-ink text-white' : 'bg-white/75 text-transparent')}>
        <Check className="size-3.5" />
      </span>
      {children}
    </button>
  )
}

/* ---------------------------------------------------------------- surfaces */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-[28px] bg-white p-5 shadow-[var(--shadow-card)]', className)}>{children}</div>
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-[12px] font-medium tracking-[0.08em] text-sub uppercase', className)}>{children}</p>
}

export function Notice({ tone = 'warn', icon, children, action, className }: { tone?: 'warn' | 'error' | 'info' | 'ok'; icon?: ReactNode; children: ReactNode; action?: ReactNode; className?: string }) {
  const tones = {
    warn: 'bg-[linear-gradient(140deg,#F9E4BB_0%,#FBD7C8_100%)] text-ink',
    error: 'bg-sos-soft text-sos-deep',
    info: 'bg-[linear-gradient(140deg,#DDD8FF_0%,#ECE4F8_100%)] text-ink',
    ok: 'bg-ok-soft text-ok-deep',
  }
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={cn('flex items-start gap-3 rounded-[22px] px-4 py-3.5 text-[13.5px] leading-snug', tones[tone], className)}>
      <span className="mt-0.5 shrink-0">{icon ?? <AlertCircle className="size-[18px]" />}</span>
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('t4h-skeleton', className)} />
}

export function TypingDots({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} aria-label="typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-2 rounded-full bg-faint" style={{ animation: `t4h-dot 1.2s ${i * 0.15}s infinite` }} />
      ))}
    </span>
  )
}

/* ---------------------------------------------------------------- moods + risk */

export const MOODS = [
  { v: 1, label: 'Very low', c1: '#DDD8FF', c2: '#C9C0F2', mouth: 'M13 28 Q20 22 27 28' },
  { v: 2, label: 'Low', c1: '#DBE4F1', c2: '#C2D3EC', mouth: 'M14 27 Q20 24.5 26 27' },
  { v: 3, label: 'Okay', c1: '#D9F0EA', c2: '#C7E3D0', mouth: 'M14 26 H26' },
  { v: 4, label: 'Good', c1: '#CBECF5', c2: '#A9DBE3', mouth: 'M14 25 Q20 29.5 26 25' },
  { v: 5, label: 'Great', c1: '#F9E4BB', c2: '#FBC5B2', mouth: 'M13 24 Q20 32 27 24' },
] as const

export function MoodFace({ v, size = 52, className }: { v: number; size?: number; className?: string }) {
  const m = MOODS[Math.min(5, Math.max(1, Math.round(v))) - 1]
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`mf${m.v}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m.c1} />
          <stop offset="1" stopColor={m.c2} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#mf${m.v})`} />
      <circle cx="14.5" cy="17" r="1.7" fill="#111113" />
      <circle cx="25.5" cy="17" r="1.7" fill="#111113" />
      <path d={m.mouth} fill="none" stroke="#111113" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export const RISK_LABEL: Record<Risk, string> = { red: 'Crisis', orange: 'Needs attention', green: 'Fine' }

export function RiskChip({ risk, className, label }: { risk: Risk; className?: string; label?: string }) {
  const s = { red: 'bg-sos-soft text-sos-deep', orange: 'bg-warn-soft text-warn-deep', green: 'bg-ok-soft text-ok-deep' }[risk]
  const d = { red: 'bg-sos', orange: 'bg-warn', green: 'bg-ok' }[risk]
  return (
    <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium whitespace-nowrap', s, className)}>
      <span className={cn('size-1.5 rounded-full', d)} />
      {label ?? RISK_LABEL[risk]}
    </span>
  )
}

/** 7-day mood sparkline (values 1..5, null = no check-in). */
export function Sparkline({ values, width = 120, height = 34, color = '#111113' }: { values: (number | null)[]; width?: number; height?: number; color?: string }) {
  const pts = values.map((v, i) => (v == null ? null : ([(i / Math.max(1, values.length - 1)) * (width - 6) + 3, height - 3 - ((v - 1) / 4) * (height - 6)] as const)))
  const segs: string[] = []
  let cur = ''
  for (const p of pts) {
    if (!p) {
      if (cur) segs.push(cur)
      cur = ''
      continue
    }
    cur += (cur ? ' L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)
  }
  if (cur) segs.push(cur)
  const last = [...pts].reverse().find(Boolean)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {segs.map((d) => (
        <path key={d} d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {last && <circle cx={last[0]} cy={last[1]} r="3" fill={color} />}
    </svg>
  )
}
