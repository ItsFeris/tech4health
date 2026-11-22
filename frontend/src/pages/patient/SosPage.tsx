// SOS confirmation (design: 7 · SOS confirmation). Full screen, no navigation bar.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ShieldAlert, X } from 'lucide-react'
import { sendSos, ApiRequestError } from '@/api'
import { Cta, GhostButton, GlassCircle, Headline, Hero, Notice, Pill } from '@/components/t4h/kit'

export default function SosPage() {
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)

  async function confirm() {
    setSending(true)
    setError(false)
    try {
      const r = await sendSos()
      navigate('/patient/crisis', { replace: true, state: { crisis: r.crisis, alerted: true } })
    } catch (e) {
      // No specialist to alert: still go to the crisis screen (emergency number, breathing).
      if (e instanceof ApiRequestError && e.code === 'no_specialist') navigate('/patient/crisis', { replace: true, state: { alerted: false } })
      else setError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    // Desktop (design D07): the same content as a centered card over a soft backdrop.
    <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col overflow-hidden lg:max-w-none lg:justify-center lg:bg-[linear-gradient(140deg,#F9E4BB_0%,#FBD7C8_55%,#F6CDDB_100%)]">
      <div className="lg:hidden">
        <Hero tone="peach" variant="flower" height={520} />
      </div>
      <div className="relative z-10 flex flex-1 flex-col px-5 pb-7 pt-6 lg:mx-auto lg:w-[480px] lg:flex-none lg:rounded-[34px] lg:bg-white/95 lg:p-8 lg:shadow-[0_30px_80px_rgba(40,30,70,.22)]">
        <div className="flex items-center justify-between">
          <GlassCircle aria-label="Close" onClick={() => navigate(-1)}>
            <X className="size-5" />
          </GlassCircle>
          <Pill>
            <ShieldAlert className="size-4" fill="currentColor" stroke="white" /> SOS
          </Pill>
          <span className="w-[52px]" />
        </div>

        <span className="mx-auto mt-24 flex size-[124px] lg:mt-2 items-center justify-center rounded-full bg-white/60 p-3">
          <span className="flex size-full items-center justify-center rounded-full bg-white shadow-[var(--shadow-card)]">
            <Heart className="size-8 text-sos" fill="currentColor" />
          </span>
        </span>
        <Headline eyebrow="We're right here with you" title="Alert your specialist now?" className="mt-8" />
        <p className="mt-3 text-center text-[15.5px] leading-relaxed text-ink-2">Your specialist gets an urgent alert straight away. You can keep talking to Nour while you wait.</p>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          {error && (
            <Notice tone="error">
              The alert could not be sent. If you are in danger, call <a className="font-semibold underline" href="tel:190">190</a> now, or try again.
            </Notice>
          )}
          <Cta tone="sos" onClick={() => void confirm()} loading={sending}>
            Alert my specialist now
          </Cta>
          <GhostButton onClick={() => navigate(-1)}>Cancel, I&apos;m okay</GhostButton>
        </div>
      </div>
    </div>
  )
}
