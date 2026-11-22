// Specialist verification (design M03 intro, M04 ID card, M05 ID result, M06 license, M07 selfie, M08 review, M09 verified).
// Hackathon: the camera is real when allowed, the document checks are simulated, then POST /me/verify. Dhia owns this file.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, FileText, IdCard, Loader2, Lock, UserRound, X } from 'lucide-react'
import { getSpecialist, verifyMe } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { SpecialistCard } from '@/types/contract'
import { Cta, GlassCircle, Headline, Hero, Notice, Pill } from '@/components/t4h/kit'
import { Portrait, SpecialistPhoto, VerifiedBadge, lookOf } from '@/components/t4h/specialist'
import { cn } from '@/lib/utils'

type Stage = 'intro' | 'id-front' | 'id-back' | 'id-result' | 'license' | 'selfie' | 'review' | 'done'

export default function VerifyPage() {
  const navigate = useNavigate()
  const { me } = useAuth()
  const [stage, setStage] = useState<Stage>('intro')
  const [card, setCard] = useState<SpecialistCard | null>(null)

  useEffect(() => {
    if (me) getSpecialist(me.id).then(setCard).catch(() => setCard(null))
  }, [me])

  const onVerified = useCallback((c: SpecialistCard) => {
    setCard(c)
    setStage('done')
  }, [])
  const name = card?.nickname ?? me?.nickname ?? ''
  const id = me?.id ?? 'me'

  if (stage === 'id-front' || stage === 'id-back')
    return (
      <ScanScreen
        key={stage}
        label="ID card"
        eyebrow={stage === 'id-front' ? 'Front side' : 'Back side'}
        title="Fit your ID card inside the frame"
        reading="Hold steady — reading your card…"
        tips={['Good light', 'No glare', 'Whole card visible']}
        facing="environment"
        onClose={() => setStage('intro')}
        onCaptured={() => setStage(stage === 'id-front' ? 'id-back' : 'id-result')}
        footer={<Steps items={['Front', 'Back']} at={stage === 'id-front' ? 0 : 1} />}
      >
        <IdArt id={id} name={name} back={stage === 'id-back'} />
      </ScanScreen>
    )
  if (stage === 'license')
    return (
      <ScanScreen
        key="license"
        label="License"
        eyebrow="Your authorization to practice"
        title="Place the whole page in the frame"
        reading="Captured · reading license number…"
        tips={['Flat surface', 'All 4 corners']}
        facing="environment"
        onClose={() => setStage('intro')}
        onCaptured={() => setStage('selfie')}
        footer={<Steps items={['ID card', 'License', 'Selfie']} at={1} />}
      >
        <LicenseArt name={name} specialty={card?.specialty ?? 'Specialist'} />
      </ScanScreen>
    )
  if (stage === 'selfie')
    return (
      <ScanScreen
        key="selfie"
        label="Selfie"
        eyebrow="Slowly turn your head left"
        title="Keep your face in the oval"
        reading="Matching with your ID photo…"
        tips={['Remove glasses', 'Face the light']}
        facing="user"
        oval
        onClose={() => setStage('intro')}
        onCaptured={() => setStage('review')}
        footer={<Steps items={['ID card', 'License', 'Selfie']} at={2} />}
      >
        <Portrait id={id} size={220} />
      </ScanScreen>
    )

  return (
    <div className="min-h-svh bg-[#EDEBF2]">
      <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col overflow-hidden bg-background">
        <Hero tone={stage === 'done' ? 'mint' : stage === 'review' ? 'lavender' : 'teal'} variant="petals" />
        <div className="relative z-10 flex flex-1 flex-col px-5 pb-7 pt-6">
          <div className="flex items-center justify-between">
            {stage === 'done' ? (
              <span className="w-[52px]" />
            ) : (
              <GlassCircle aria-label="Back" onClick={() => (stage === 'intro' ? navigate('/specialist') : setStage('intro'))}>
                <ArrowLeft className="size-5" />
              </GlassCircle>
            )}
            <Pill>{stage === 'review' ? 'Step 4 of 4 · Review' : stage === 'done' ? 'Step 4 of 4 · Done' : 'Step 3 of 4 · Verification'}</Pill>
            <span className="w-[52px]" />
          </div>
          <div className="mt-5 grid grid-cols-4 gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn('h-1 rounded-full', i <= (stage === 'review' || stage === 'done' ? 3 : 2) ? 'bg-ink' : 'bg-white/80')} />
            ))}
          </div>

          {stage === 'intro' && <Intro onStart={() => setStage('id-front')} />}
          {stage === 'id-result' && <IdResult name={name} onRescan={() => setStage('id-front')} onNext={() => setStage('license')} />}
          {stage === 'review' && <Review name={name} onVerified={onVerified} />}
          {stage === 'done' && card && <Done card={card} onGo={() => navigate('/specialist', { replace: true })} />}
        </div>
      </div>
    </div>
  )
}

/* ---------- M03 intro ---------- */

function Intro({ onStart }: { onStart: () => void }) {
  const rows = [
    { icon: <IdCard className="size-5" />, a: 'Scan your ID card', b: 'Front and back of your CIN', t: '1 min', bg: 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)', col: '#2F7889' },
    { icon: <FileText className="size-5" />, a: 'Scan your license', b: 'Your authorization to practice', t: '1 min', bg: 'linear-gradient(140deg, #DDD8FF 0%, #ECE4F8 100%)', col: '#6A5BBE' },
    { icon: <UserRound className="size-5" />, a: 'Take a quick selfie', b: 'We match it to your ID photo', t: '30 s', bg: 'linear-gradient(140deg, #F9E4BB 0%, #FBD7C8 100%)', col: '#A35A2A' },
  ]
  return (
    <>
      <section className="mt-12 flex flex-col gap-3">
        <Headline eyebrow="Patients only see verified specialists" title="Let's check it's really you" />
        <ul className="mt-4 flex flex-col gap-2.5">
          {rows.map((r) => (
            <li key={r.a} className="flex items-center gap-3.5 rounded-[22px] px-4 py-3.5" style={{ background: r.bg }}>
              <span className="flex size-11 items-center justify-center rounded-[14px] bg-white">{r.icon}</span>
              <span className="flex-1">
                <span className="block text-[18px] tracking-[-0.3px]">{r.a}</span>
                <span className="block text-[13px]" style={{ color: r.col }}>
                  {r.b}
                </span>
              </span>
              <span className="text-[12.5px] text-ink-2">{r.t}</span>
            </li>
          ))}
        </ul>
        <Notice tone="info" icon={<Lock className="size-4" />} className="bg-white bg-none text-ink-2 shadow-[var(--shadow-soft)]">
          Your documents are encrypted and used only for verification. Patients never see them — only your <strong className="font-semibold text-ink">Verified</strong> badge.
        </Notice>
      </section>
      <div className="mt-auto pt-8">
        <Cta onClick={onStart}>Start scanning</Cta>
      </div>
    </>
  )
}

/* ---------- camera screens (M04, M06, M07) ---------- */

function useCamera(facing: 'user' | 'environment') {
  const ref = useRef<HTMLVideoElement>(null)
  const [live, setLive] = useState(false)
  useEffect(() => {
    let stream: MediaStream | null = null
    let alive = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((s) => {
        if (!alive) return s.getTracks().forEach((t) => t.stop())
        stream = s
        if (ref.current) {
          ref.current.srcObject = s
          setLive(true)
        }
      })
      .catch(() => setLive(false))
    return () => {
      alive = false
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [facing])
  return { ref, live }
}

function ScanScreen(props: {
  label: string
  eyebrow: string
  title: string
  reading: string
  tips: string[]
  facing: 'user' | 'environment'
  oval?: boolean
  onClose: () => void
  onCaptured: () => void
  footer: ReactNode
  children: ReactNode
}) {
  const { ref, live } = useCamera(props.facing)
  const [reading, setReading] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  function capture() {
    if (reading) return
    setReading(true)
    timer.current = window.setTimeout(props.onCaptured, 1800)
  }

  return (
    <div className="min-h-svh bg-[#0E0E11]">
      <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_80%_100%,#3A3346_0%,#151518_55%,#0E0E11_100%)] text-white">
        <div className="flex items-center justify-between px-5 pt-6">
          <button type="button" aria-label="Close" onClick={props.onClose} className="flex size-[52px] items-center justify-center rounded-full border border-white/25 bg-white/10">
            <X className="size-5" />
          </button>
          <Pill className="text-ink">Step 3 of 4 · {props.label}</Pill>
          <span className="w-[52px]" />
        </div>
        <div className="mt-8 px-6 text-center">
          <p className="text-[15px] text-white/70">{props.eyebrow}</p>
          <h1 className="headline mt-1 text-[28px] text-white">{props.title}</h1>
        </div>

        <div className={cn('relative mx-auto mt-8 flex items-center justify-center', props.oval ? 'h-[300px] w-[240px]' : 'h-[236px] w-[350px]')}>
          {props.oval ? (
            <div className="absolute inset-0 overflow-hidden rounded-[50%] border-[3px] border-white/90 bg-[linear-gradient(160deg,#DDD8FF,#ECE4F8)]">
              <div className="flex size-full items-end justify-center">{props.children}</div>
              <video ref={ref} autoPlay playsInline muted className={cn('absolute inset-0 size-full -scale-x-100 object-cover', !live && 'hidden')} />
            </div>
          ) : (
            <>
              <Corners />
              <div className="relative h-[200px] w-[314px] overflow-hidden rounded-[16px]">
                {props.children}
                <video ref={ref} autoPlay playsInline muted className={cn('absolute inset-0 size-full object-cover', !live && 'hidden')} />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-center px-5" aria-live="polite">
          {reading ? (
            <span className="inline-flex h-11 items-center gap-2.5 rounded-full bg-white px-5 text-[15px] text-ink">
              <Loader2 className="size-4 animate-spin" /> {props.reading}
            </span>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {props.tips.map((t) => (
                <span key={t} className="inline-flex h-9 items-center rounded-full border border-white/20 bg-white/10 px-3.5 text-[13.5px]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between px-5 pb-8 pt-6">
          <div className="w-[120px]">{props.footer}</div>
          <button type="button" aria-label="Take photo" onClick={capture} disabled={reading} className="flex size-[76px] items-center justify-center rounded-full border-[4px] border-white/90 transition disabled:opacity-60">
            <span className="size-[60px] rounded-full bg-white" />
          </button>
          <span className="w-[120px] text-right text-[12.5px] text-white/60">{live ? 'Camera on' : 'No camera: tap to continue'}</span>
        </div>
      </div>
    </div>
  )
}

function Corners() {
  const c = 'absolute size-11 border-white/90'
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className={cn(c, 'left-0 top-0 rounded-tl-[22px] border-l-[3px] border-t-[3px]')} />
      <span className={cn(c, 'right-0 top-0 rounded-tr-[22px] border-r-[3px] border-t-[3px]')} />
      <span className={cn(c, 'bottom-0 left-0 rounded-bl-[22px] border-b-[3px] border-l-[3px]')} />
      <span className={cn(c, 'bottom-0 right-0 rounded-br-[22px] border-b-[3px] border-r-[3px]')} />
    </span>
  )
}

function Steps({ items, at }: { items: string[]; at: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <span key={t} className={cn('inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px]', i === at ? 'bg-white text-ink' : 'bg-white/10 text-white/80')}>
          {i < at && <Check className="size-3" />}
          {t}
        </span>
      ))}
    </div>
  )
}

function IdArt({ id, name, back }: { id: string; name: string; back: boolean }) {
  const parts = name.replace(/^dr\.?\s+/i, '').toUpperCase().split(/\s+/)
  return (
    <div className="flex size-full gap-4 bg-[linear-gradient(140deg,#D9F0EA_0%,#E4F2F9_50%,#ECE4F8_100%)] p-4 text-ink">
      {back ? (
        <div className="flex w-full flex-col justify-end gap-2 font-mono text-[12px] tracking-[0.12em] text-ink-2">
          <span className="h-2 w-3/4 rounded bg-ink/15" />
          <span className="h-2 w-2/3 rounded bg-ink/15" />
          <span>IDTUN&lt;&lt;••••••••&lt;&lt;&lt;&lt;</span>
          <span>••••••&lt;&lt;{parts.at(-1) ?? ''}</span>
        </div>
      ) : (
        <>
          <span className="flex w-[82px] shrink-0 items-end justify-center overflow-hidden rounded-[10px]" style={{ background: lookOf(id).bg }}>
            <Portrait id={id} size={96} />
          </span>
          <span className="flex flex-col gap-1.5 pt-1">
            <span className="text-[10px] tracking-[0.14em] text-teal-ink">IDENTITY CARD</span>
            <span className="text-[14px] font-semibold tracking-[0.04em]">{parts.at(-1)}</span>
            <span className="text-[12.5px] tracking-[0.04em]">{parts.slice(0, -1).join(' ')}</span>
            <span className="mt-1 h-1.5 w-36 rounded bg-ink/15" />
            <span className="h-1.5 w-28 rounded bg-ink/15" />
            <span className="mt-1 text-[12px] tracking-[0.2em]">•••• ••••</span>
          </span>
        </>
      )}
    </div>
  )
}

function LicenseArt({ name, specialty }: { name: string; specialty: string }) {
  return (
    <div className="flex size-full flex-col gap-2 bg-white p-5 text-ink">
      <span className="text-[10px] tracking-[0.14em] text-sub">AUTHORIZATION TO PRACTICE</span>
      <span className="text-[14px]">
        {name} · {specialty}
      </span>
      <span className="h-1.5 w-full rounded bg-ink/10" />
      <span className="h-1.5 w-5/6 rounded bg-ink/10" />
      <span className="h-1.5 w-2/3 rounded bg-ink/10" />
      <span className="mt-auto flex items-center justify-between text-[12px] text-ink-2">
        No. ••••-••••
        <span className="size-10 rounded-full border-2 border-lav-deep/50" />
      </span>
    </div>
  )
}

/* ---------- M05 ID result ---------- */

function IdResult({ name, onRescan, onNext }: { name: string; onRescan: () => void; onNext: () => void }) {
  const checks = ['Real document, not a photo of a screen', 'Photo and text are readable', `Name matches your profile “${name}”`]
  return (
    <>
      <section className="mt-12 flex flex-col gap-3">
        <Headline eyebrow="ID card · front and back read" title="Your ID looks good" />
        <ul className="mt-4 flex flex-col gap-2 rounded-[26px] bg-white p-5 shadow-[var(--shadow-soft)]">
          {checks.map((c) => (
            <li key={c} className="flex items-start gap-3 text-[15px]">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E3F4EA] text-[#1C6B45]">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              {c}
            </li>
          ))}
        </ul>
        <button type="button" onClick={onRescan} className="mx-auto mt-1 text-[14px] underline underline-offset-4">
          Something&apos;s wrong? Scan again
        </button>
      </section>
      <div className="mt-auto pt-8">
        <Cta onClick={onNext}>Next: scan your license</Cta>
      </div>
    </>
  )
}

/* ---------- M08 review ---------- */

function Review({ name, onVerified }: { name: string; onVerified: (c: SpecialistCard) => void }) {
  const rows = [
    { a: 'ID card', b: 'Read and checked automatically' },
    { a: 'Selfie', b: 'Matches your ID photo' },
    { a: 'License to practice', b: 'Number and name read' },
  ]
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (done < rows.length) {
      const t = window.setTimeout(() => setDone(done + 1), 700)
      return () => window.clearTimeout(t)
    }
    let alive = true
    verifyMe({ id_card: true, license: true, selfie: true })
      .then((c) => alive && window.setTimeout(() => onVerified(c), 600))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Verification failed. Please try again.'))
    return () => {
      alive = false
    }
  }, [done, rows.length, onVerified])

  return (
    <section className="mt-12 flex flex-col gap-3">
      <Headline eyebrow={`Almost there, ${name.split(' ').slice(0, 2).join(' ')}`} title="We're checking your documents" />
      <ul className="mt-4 flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <li key={r.a} className="flex items-center gap-3.5 rounded-[22px] bg-white px-4 py-3.5 shadow-[var(--shadow-soft)]">
            <span className={cn('flex size-9 items-center justify-center rounded-full', i < done ? 'bg-[#E3F4EA] text-[#1C6B45]' : 'bg-soft text-sub')}>
              {i < done ? <Check className="size-4" strokeWidth={3} /> : <Loader2 className="size-4 animate-spin" />}
            </span>
            <span>
              <span className="block text-[16px]">{r.a}</span>
              <span className="block text-[13px] text-sub">{r.b}</span>
            </span>
          </li>
        ))}
      </ul>
      {error && <Notice tone="error">{error}</Notice>}
    </section>
  )
}

/* ---------- M09 done ---------- */

function Done({ card, onGo }: { card: SpecialistCard; onGo: () => void }) {
  return (
    <>
      <section className="mt-12 flex flex-col items-center gap-3">
        <Headline eyebrow="Verification complete" title="You're verified" />
        <p className="text-center text-[15px] text-ink-2">Patients can now find and choose you. This is how your card looks:</p>
        <div className="mt-3 w-full rounded-[28px] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-4">
            <SpecialistPhoto id={card.id} photoUrl={card.photo_url} name={card.nickname} size={72} />
            <div className="flex-1">
              <VerifiedBadge />
              <p className="mt-1.5 text-[20px] leading-tight tracking-[-0.4px]">{card.nickname}</p>
              <p className="text-[14px]" style={{ color: lookOf(card.id).col }}>
                {card.specialty ?? 'Specialist'}
              </p>
            </div>
          </div>
          {card.price != null && (
            <p className="mt-4 border-t border-line pt-3 text-[14px] text-ink-2">
              <span className="text-[24px] font-light text-ink">{card.price}</span> DT / session
            </p>
          )}
        </div>
      </section>
      <div className="mt-auto pt-8">
        <Cta onClick={onGo}>Go to my patients</Cta>
      </div>
    </>
  )
}
