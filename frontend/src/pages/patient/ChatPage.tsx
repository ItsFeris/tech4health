import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Paperclip, Send, Sparkles } from 'lucide-react'
import { getAppointments, getChatHistory, sendChat } from '@/api'
import type { Appointment, Message } from '@/types/contract'
import { cn } from '@/lib/utils'

const C = {
  bg: '#F2EFE9',
  dark: '#2C3A2C',
  darkMid: '#3D4F3D',
  sage: '#7A9A7A',
  sageMid: '#B5C9B5',
  sageLight: '#D8E5D8',
  cream: '#FAF8F4',
  muted: '#8A9A8A',
  userBubble: '#2C3A2C',
  aiBubble: '#FAF8F4',
}

export default function ChatPage() {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [urgentBanner, setUrgentBanner] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        const [history, appts] = await Promise.all([
          getChatHistory(),
          getAppointments().catch(() => []),
        ])
        setMessages(history)
        setAppointments(appts)
      } catch {
        // Ignore
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!input.trim() || sending) return

    const userText = input.trim()
    setInput('')
    setSending(true)

    try {
      const reply = await sendChat(userText)
      setMessages((prev) => [...prev, reply.user_message, reply.ai_message])

      if (reply.crisis) {
        navigate('/patient/crisis', { state: { crisis: reply.crisis } })
        return
      }

      if (reply.urgent_appointment) {
        const dateStr = new Date(reply.urgent_appointment.starts_at).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
        })
        setUrgentBanner(`Votre spécialiste a été notifié et vous recevra en priorité le ${dateStr}.`)
      }
    } catch {
      // Ignore
    } finally {
      setSending(false)
    }
  }

  const nextAppointment = appointments.find((a) => a.status === 'scheduled')

  return (
    <div
      className="mx-auto flex min-h-svh max-w-md flex-col pb-32"
      style={{ backgroundColor: C.bg, fontFamily: 'sans-serif' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-4"
        style={{ backgroundColor: C.bg }}
      >
        {/* AI greeting */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className="flex size-7 items-center justify-center rounded-full"
            style={{ backgroundColor: C.sageLight }}
          >
            <Sparkles className="size-3.5" style={{ color: C.dark }} />
          </div>
          <span className="text-xs font-semibold tracking-wide" style={{ color: C.muted }}>
            COMPAGNON IA
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: C.dark, fontFamily: 'Georgia, serif' }}>
          Bonjour, je vous écoute.
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
          Espace d'écoute bienveillant, anonyme et sécurisé 24h/24.
        </p>

        {/* Appointment card */}
        {nextAppointment && (
          <div
            className="mt-4 flex items-center justify-between rounded-2xl p-3.5"
            style={{ backgroundColor: C.dark }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: C.sageLight }}>Prochaine consultation</p>
              <p className="text-xs mt-0.5" style={{ color: C.sageMid }}>
                {new Date(nextAppointment.starts_at).toLocaleDateString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ backgroundColor: C.sageLight, color: C.dark }}
            >
              Confirmé
            </span>
          </div>
        )}

        {urgentBanner && (
          <div
            className="mt-3 rounded-2xl border p-3 text-xs"
            style={{ borderColor: C.sageMid, backgroundColor: C.sageLight, color: C.darkMid }}
          >
            {urgentBanner}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="flex h-36 items-center justify-center text-xs" style={{ color: C.muted }}>
            Chargement de la discussion...
          </div>
        ) : (
          <div className="flex flex-col gap-3 pt-2">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user'
              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col max-w-[82%]', isUser ? 'self-end items-end' : 'self-start items-start')}
                >
                  <div
                    className="rounded-3xl px-4 py-3 text-xs leading-relaxed shadow-sm"
                    style={
                      isUser
                        ? { backgroundColor: C.userBubble, color: C.cream, borderBottomRightRadius: 4 }
                        : { backgroundColor: C.aiBubble, color: C.dark, border: `1px solid ${C.sageLight}`, borderBottomLeftRadius: 4 }
                    }
                  >
                    {msg.content}
                  </div>
                  <span className="mt-1 px-1 text-[9px]" style={{ color: C.muted }}>
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}

            {/* Typing indicator */}
            {sending && (
              <div
                className="self-start rounded-3xl px-4 py-3 shadow-sm"
                style={{ backgroundColor: C.aiBubble, border: `1px solid ${C.sageLight}`, borderBottomLeftRadius: 4 }}
              >
                <div className="flex items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="size-1.5 animate-bounce rounded-full"
                      style={{ backgroundColor: C.sage, animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Quick suggestion pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-4 text-xs">
          {[
            { emoji: '🌿', label: 'Calmer mon anxiété', msg: "J'ai besoin de conseils pour calmer mon anxiété..." },
            { emoji: '📊', label: 'Bilan de semaine', msg: "Comment s'est passée ma semaine selon mes notes ?" },
            { emoji: '✨', label: 'Mes exercices', action: () => navigate('/patient/homework') },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => s.action ? s.action() : setInput(s.msg ?? '')}
              className="shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: C.cream, borderColor: C.sageLight, color: C.darkMid }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom input bar */}
      <div className="fixed inset-x-0 bottom-16 mx-auto max-w-md px-4 z-30">
        <form
          onSubmit={(e) => void handleSend(e)}
          className="flex items-center gap-2 rounded-full px-4 py-3 shadow-lg"
          style={{ backgroundColor: C.cream, border: `1px solid ${C.sageLight}` }}
        >
          <button type="button" aria-label="Microphone" style={{ color: C.muted }}>
            <Mic className="size-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-1 border-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0"
            style={{ color: C.dark }}
          />
          <button type="button" aria-label="Attach" style={{ color: C.muted }}>
            <Paperclip className="size-4" />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send"
            className="flex size-7 items-center justify-center rounded-full transition-colors disabled:opacity-50"
            style={{ backgroundColor: C.dark, color: C.cream }}
          >
            <Send className="size-3.5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
