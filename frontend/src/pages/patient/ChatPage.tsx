// Patient home: chat with Nour (design: 3 · Chat, plus loading, offline/error and Arabic RTL states).
import { Children, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, CalendarDays, WifiOff, X } from 'lucide-react'
import { getAppointments, getChatHistory, getHomework, getSpecialist, sendChat } from '@/api'
import { useAuth } from '@/auth/AuthContext'
import type { Appointment, ChatAction, Homework, Lang, Message, SpecialistCard } from '@/types/contract'
import { Headline, Hero, LogoOrb, Notice, Pill, Skeleton, SmallButton, TopBar, TypingDots } from '@/components/t4h/kit'
import { ActionCard } from '@/components/t4h/actions'
import { shortName } from '@/components/t4h/specialist'
import { dayLabel, greeting, partOfDay, timeLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDesktop } from '@/lib/useMedia'

const WELCOME: Record<Lang, string> = {
  darija: 'Ahla! Ena Nour. Ena hna bech nesma3ek ay wa9t. Kifech t7es lyoum?',
  ar: 'أهلاً! أنا نور. أنا هنا لأسمعك في أي وقت. كيف تشعر اليوم؟',
  fr: "Bonjour ! Moi c'est Nour. Je suis là pour t'écouter, à tout moment. Comment tu te sens aujourd'hui ?",
  en: "Hi! I'm Nour. I'm here to listen, any time. How are you feeling today?",
}

interface Pending {
  id: string
  content: string
  failed: boolean
}

const FADE_TOP = { maskImage: 'linear-gradient(to bottom, transparent 0, #000 40px)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 40px)' }

export default function ChatPage() {
  const navigate = useNavigate()
  const { me } = useAuth()
  const lang: Lang = me?.language ?? 'en'
  const desktop = useDesktop()
  const rtl = lang === 'ar'
  const bottomRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [input, setInput] = useState('')
  const [urgent, setUrgent] = useState<Appointment | null>(null)
  const [cards, setCards] = useState<Record<string, ChatAction[]>>({}) // Nour's tool cards, by AI message id
  const [specialist, setSpecialist] = useState<SpecialistCard | null>(null)

  useEffect(() => {
    if (me?.specialist_id) getSpecialist(me.specialist_id).then(setSpecialist).catch(() => setSpecialist(null))
  }, [me?.specialist_id])

  async function load() {
    setLoading(true)
    setLoadError(false)
    try {
      const [history, appts, hw] = await Promise.all([getChatHistory(), getAppointments().catch(() => []), getHomework().catch(() => [])])
      setMessages(history)
      setAppointments(appts)
      setHomework(hw)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pending])

  async function send(text: string) {
    const content = text.trim()
    if (!content || (pending && !pending.failed)) return
    setInput('')
    setPending({ id: crypto.randomUUID(), content, failed: false })
    try {
      const reply = await sendChat(content)
      setPending(null)
      setMessages((prev) => [...prev, reply.user_message, reply.ai_message])
      if (reply.actions?.length) setCards((prev) => ({ ...prev, [reply.ai_message.id]: reply.actions }))
      if (reply.urgent_appointment) {
        setUrgent(reply.urgent_appointment)
        setAppointments((prev) => [...prev.filter((a) => a.id !== reply.urgent_appointment!.id), reply.urgent_appointment!])
      }
      if (reply.crisis) navigate('/patient/crisis', { state: { crisis: reply.crisis } })
    } catch {
      // Never lose what the patient wrote: keep it on screen, marked "Not sent".
      setPending({ id: crypto.randomUUID(), content, failed: true })
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  const now = new Date().toISOString()
  const next = appointments.filter((a) => a.status === 'scheduled' && a.starts_at >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0]
  const todo = homework.filter((h) => !h.done).length
  const offline = loadError || Boolean(pending?.failed)
  const sending = Boolean(pending && !pending.failed)

  const urgentBanner = urgent && (
    <div className="flex items-center gap-3 rounded-[22px] bg-white px-3 py-2.5 shadow-[var(--shadow-float)]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lav text-lav-deep">
        <CalendarDays className="size-[18px]" />
      </span>
      <p className="flex-1 text-[14px] leading-snug">
        {specialist ? shortName(specialist.nickname) : 'Your specialist'} found an earlier slot to see you: <strong className="font-semibold">{dayLabel(urgent.starts_at)} at {timeLabel(urgent.starts_at)}</strong>.
      </p>
      <button type="button" aria-label="Dismiss" onClick={() => setUrgent(null)} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-soft">
        <X className="size-4" />
      </button>
    </div>
  )

  const offlineNotice = offline && (
    <Notice
      icon={
        <span className="flex size-8 items-center justify-center rounded-full bg-white">
          <WifiOff className="size-4" />
        </span>
      }
      action={
        <SmallButton onClick={() => (pending?.failed ? void send(pending.content) : void load())} className="border-0">
          Retry
        </SmallButton>
      }
    >
      <strong className="font-semibold">You&apos;re offline.</strong> Messages will send when you&apos;re back. SOS still calls 190.
    </Notice>
  )

  const nextCard = next && (
    <div className="relative min-w-[236px] overflow-hidden rounded-[26px] p-4 shadow-[var(--shadow-soft)]" style={{ background: 'linear-gradient(140deg, #CBECF5 0%, #D9F0EA 100%)' }}>
      <span aria-hidden="true" className="absolute -right-3 top-3 size-14 rotate-45 rounded-2xl border border-white/80 bg-white/30" />
      <p className="text-[20px] leading-tight tracking-[-0.4px]">Next session</p>
      <p className="text-[20px] leading-tight tracking-[-0.4px] text-teal-ink">{dayLabel(next.starts_at)}</p>
      <p className="mt-3 flex items-baseline gap-2 border-l-2 border-white/80 pl-2.5">
        <span className="text-[38px] leading-none tracking-[-1.5px]">{timeLabel(next.starts_at)}</span>
        <span className="text-[12.5px] text-teal-deep">{next.type === 'urgent' ? 'earlier slot' : 'weekly session'}</span>
      </p>
      {specialist && <p className="mt-2 text-[13px] text-teal-deep">with {shortName(specialist.nickname)}</p>}
    </div>
  )

  const homeworkCard = homework.length > 0 && (
    <button
      type="button"
      onClick={() => navigate('/patient/homework')}
      className="min-w-[150px] rounded-[26px] p-4 text-left shadow-[var(--shadow-soft)]"
      style={{ background: 'linear-gradient(140deg, #DDD8FF 0%, #ECE4F8 100%)' }}
    >
      <p className="text-[20px] leading-tight tracking-[-0.4px]">Homework</p>
      <p className="text-[20px] leading-tight tracking-[-0.4px] text-lav-ink">{todo} to do</p>
      <p className="mt-3 text-[34px] leading-none tracking-[-1.2px]">
        {homework.length - todo}/{homework.length}
      </p>
    </button>
  )

  const conversation = (
    <section aria-label="Conversation" aria-live="polite" dir={rtl ? 'rtl' : undefined} lang={rtl ? 'ar' : undefined} className="flex flex-col gap-2.5">
      {loading ? (
        <>
          <Skeleton className="h-12 w-3/4 rounded-[22px]" />
          <Skeleton className="ms-auto h-16 w-2/3 rounded-[22px]" />
          <Skeleton className="h-20 w-4/5 rounded-[22px]" />
        </>
      ) : (
        <>
          {messages.length === 0 && <Bubble sender="ai" text={WELCOME[lang]} />}
          {messages.map((m) => (
            <Bubble key={m.id} sender={m.sender} text={m.content}>
              {cards[m.id]?.map((a, i) => <ActionCard key={i} action={a} onSend={(t) => void send(t)} />)}
            </Bubble>
          ))}
          {pending && (
            <div className="flex flex-col items-end gap-1.5">
              <Bubble sender="user" text={pending.content} muted={pending.failed} />
              {pending.failed && (
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="flex items-center gap-1 text-sos">
                    <AlertCircle className="size-3.5" /> Not sent
                  </span>
                  <SmallButton onClick={() => void send(pending.content)}>Tap to retry</SmallButton>
                </div>
              )}
            </div>
          )}
          {sending && (
            <div className="flex items-center gap-2.5">
              <span className="rounded-[18px] bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
                <TypingDots />
              </span>
              <span className="text-[12.5px] text-sub">Nour is typing…</span>
            </div>
          )}
        </>
      )}
      <div ref={bottomRef} aria-hidden="true" className={cn('shrink-0', desktop ? 'h-2' : 'h-[180px]')} />
    </section>
  )

  const form = (
    <form onSubmit={onSubmit} className={cn('flex items-center gap-2.5', !desktop && 'px-4')}>
      <label htmlFor="chat-input" className="sr-only">
        Message to Nour
      </label>
      <input
        id="chat-input"
        dir="auto"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Write to Nour…"
        maxLength={2000}
        className="h-[52px] min-w-0 flex-1 rounded-full border-0 bg-white px-5 text-[15px] shadow-[var(--shadow-float)] outline-none placeholder:text-faint focus:ring-2 focus:ring-ink/15"
      />
      <button type="submit" aria-label="Send" disabled={!input.trim() || sending} className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-ink text-white transition disabled:opacity-50">
        <ArrowRight className={cn('size-5', rtl && 'rotate-180')} />
      </button>
    </form>
  )

  // Desktop (design D01): chat panel on the left, session / homework / check-in on the right.
  if (desktop)
    return (
      <div className="relative h-svh overflow-hidden">
        <Hero tone="teal" height={460} />
        <div className="relative z-10 mx-auto grid h-full max-w-[1216px] grid-cols-[minmax(0,1fr)_320px] gap-5 px-6 pb-6 pt-[100px]">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-[30px] bg-[#FAFAFB]/90 shadow-[var(--shadow-card)] backdrop-blur">
            <div className="flex items-center gap-3 border-b border-line/70 px-6 py-4">
              <LogoOrb size={44} className="shadow-none" />
              <div className="flex-1">
                <p className="text-[18px] leading-tight">Nour</p>
                <p className="flex items-center gap-1.5 text-[12.5px] text-sub">
                  <span className={cn('size-2 rounded-full', offline ? 'bg-warn' : 'bg-ok')} />
                  {offline ? 'Offline' : 'Your companion · here 24/7'}
                </p>
              </div>
              <Pill className="h-9 text-[13px] shadow-none">
                {greeting()}, {me?.nickname ?? ''}
              </Pill>
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pt-5" style={FADE_TOP}>
              {conversation}
            </div>
            <div className="px-6 pb-5 pt-2">
              {form}
            </div>
          </div>
          <aside className="no-scrollbar flex min-h-0 flex-col gap-3 overflow-y-auto">
            {urgentBanner}
            {offlineNotice}
            {nextCard}
            {homeworkCard}
            <div className="flex items-center justify-between rounded-[26px] p-4 shadow-[var(--shadow-soft)]" style={{ background: 'linear-gradient(140deg, #F9E4BB 0%, #FBD7C8 100%)' }}>
              <p className="text-[20px] leading-tight tracking-[-0.4px]">
                Today&apos;s
                <span className="block text-[#A35A2A]">check-in</span>
              </p>
              <SmallButton tone="ink" onClick={() => navigate('/patient/checkin')}>
                How are you?
              </SmallButton>
            </div>
          </aside>
        </div>
      </div>
    )

  return (
    // Phone: fixed full-height screen, the header stays put, only the conversation scrolls.
    <div className="fixed inset-0 mx-auto flex max-w-[430px] flex-col overflow-hidden bg-background">
      <Hero tone="teal" height={380} />
      <div className="relative z-10 flex shrink-0 flex-col gap-4 px-5 pt-6">
        <TopBar
          center={
            <Pill>
              <span className={cn('size-2 rounded-full', offline ? 'bg-warn' : 'bg-ok')} />
              {offline ? 'Offline' : 'Nour · here 24/7'}
            </Pill>
          }
        />
        <Headline eyebrow={`${greeting()}, ${me?.nickname ?? ''}`} title={`How are you ${partOfDay()}?`} className="mt-3" />
        {urgentBanner}
        {offlineNotice}
        {(next || homework.length > 0) && (
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {nextCard}
            {homeworkCard}
          </div>
        )}
      </div>

      {/* Soft fade at the top edge so messages melt under the header instead of a hard cut */}
      <div className="no-scrollbar relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-6" style={FADE_TOP}>
        {conversation}
      </div>

      <div className="fixed inset-x-0 bottom-[88px] z-20 mx-auto max-w-[430px] bg-[linear-gradient(180deg,rgba(248,248,250,0)_0%,#F8F8FA_30%)] pb-3 pt-6">
        {form}
      </div>
    </div>
  )
}

function Bubble({ sender, text, muted, children }: { sender: 'user' | 'ai'; text: string; muted?: boolean; children?: ReactNode }) {
  const ai = sender === 'ai'
  // Tool cards (exercise, mood saved...) live inside Nour's bubble, as the end of the same reply.
  const extra = ai && Children.toArray(children).length > 0
  return (
    <div className={cn('flex items-end gap-2', ai ? 'justify-start' : 'justify-end')}>
      {ai && <LogoOrb size={28} className="mb-0.5 shadow-none" />}
      <div
        className={cn(
          'rounded-[22px] px-4 py-3 text-[15.5px] leading-[1.4]',
          extra ? 'w-[82%]' : 'max-w-[78%]',
          ai ? 'rounded-bl-md bg-white text-ink shadow-[var(--shadow-soft)]' : muted ? 'rounded-br-md bg-[#77767E] text-white' : 'rounded-br-md bg-ink text-white',
        )}
      >
        <p dir="auto" className="whitespace-pre-wrap">
          {text}
        </p>
        {extra && children}
      </div>
    </div>
  )
}
