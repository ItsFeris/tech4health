import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Paperclip, Send, Sparkles } from 'lucide-react'
import { getAppointments, getChatHistory, sendChat } from '@/api'
import type { Appointment, Message } from '@/types/contract'
import { cn } from '@/lib/utils'

export default function ChatPage() {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [urgentBanner, setUrgentBanner] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

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
    setSendError(null)
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
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })
        setUrgentBanner(`Votre spécialiste a été notifié et vous recevra en priorité le ${dateStr}.`)
      }
    } catch {
      // Never lose what the patient wrote: put it back and say so.
      setInput(userText)
      setSendError("Votre message n'a pas pu être envoyé. Vérifiez votre connexion et réessayez. En cas d'urgence, utilisez le bouton SOS.")
    } finally {
      setSending(false)
    }
  }

  const nextAppointment = appointments.find((a) => a.status === 'scheduled')

  return (
    <div className="mx-auto min-h-svh max-w-md bg-[#F7F5F0] text-[#222126] font-sans pb-32 selection:bg-amber-100 flex flex-col justify-between">
      <div className="flex flex-col gap-4 p-5">
        
        {/* Top AI Conversational Greeting */}
        <div className="text-center pt-2 pb-1">
          <div className="mx-auto mb-2 flex size-7 items-center justify-center text-[#7F9E75]">
            <Sparkles className="size-5" />
          </div>
          <h1 className="font-serif text-[22px] font-normal tracking-tight text-[#222126] leading-snug">
            Bonjour, je suis votre compagnon. <br /> De quoi aimeriez-vous parler ?
          </h1>
          <p className="text-[#86838F] text-[11px] mt-1">
            Espace d'écoute bienveillant, anonyme et sécurisé 24h/24.
          </p>
        </div>

        {/* Doctor / Specialist Card (from mockup) */}
        {nextAppointment && (
          <div className="rounded-[2rem] bg-white p-4 shadow-xs border border-black/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full overflow-hidden bg-amber-100 border border-black/10">
                <img
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80"
                  alt="Doctor"
                  className="size-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1F1E24]">Dr. Marjorie Black</p>
                <p className="text-[10px] text-[#86838F]">
                  Prochaine séance : {new Date(nextAppointment.starts_at).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[#EAF3E7] px-2.5 py-1 text-[10px] font-bold text-[#437536]">
              Confirmé
            </span>
          </div>
        )}

        {/* Urgent Appointment Notification */}
        {urgentBanner && (
          <div className="rounded-2xl border border-amber-200 bg-[#FFF7ED] p-3.5 text-xs text-amber-900 shadow-xs">
            {urgentBanner}
          </div>
        )}

        {sendError && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 shadow-xs">
            {sendError}
          </div>
        )}

        {/* Chat Messages Stream */}
        {loading ? (
          <div className="flex h-36 items-center justify-center text-xs text-[#86838F]">
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
                    className={cn(
                      'rounded-[1.8rem] px-4 py-3 text-xs leading-relaxed shadow-xs',
                      isUser
                        ? 'bg-[#8A583C] text-white rounded-br-xs'
                        : 'bg-white text-[#222126] border border-black/[0.04] rounded-bl-xs'
                    )}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-[#A2A0AB] mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {sending && (
              <div className="self-start rounded-[1.8rem] rounded-bl-xs bg-white border border-black/[0.04] px-4 py-3 shadow-xs">
                <div className="flex items-center gap-1">
                  <div className="size-1.5 animate-bounce rounded-full bg-[#8A583C]" style={{ animationDelay: '0ms' }} />
                  <div className="size-1.5 animate-bounce rounded-full bg-[#8A583C]" style={{ animationDelay: '150ms' }} />
                  <div className="size-1.5 animate-bounce rounded-full bg-[#8A583C]" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 text-xs">
          <button
            type="button"
            onClick={() => setInput("J'ai besoin de conseils pour calmer mon anxiété...")}
            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-[#65636B] border border-black/[0.04] hover:border-[#8A583C]"
          >
            🌿 Calmer mon anxiété
          </button>
          <button
            type="button"
            onClick={() => setInput("Comment s'est passée ma semaine selon mes notes ?")}
            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-[#65636B] border border-black/[0.04] hover:border-[#8A583C]"
          >
            📊 Bilan de ma semaine
          </button>
          <button
            type="button"
            onClick={() => navigate('/patient/homework')}
            className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-[#65636B] border border-black/[0.04] hover:border-[#8A583C]"
          >
            ✨ Voir mes exercices
          </button>
        </div>
      </div>

      {/* Floating Bottom Input Bar (Identical to reference mockup) */}
      <div className="fixed inset-x-0 bottom-16 mx-auto max-w-md px-4 z-30">
        <form
          onSubmit={(e) => void handleSend(e)}
          className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-2.5 shadow-lg shadow-black/10 border border-black/[0.06]"
        >
          <button type="button" aria-label="Microphone" className="text-[#8B8896] hover:text-[#1F1E24]">
            <Mic className="size-4" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez un message à votre compagnon..."
            className="flex-1 text-xs text-[#1F1E24] bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder:text-[#A4A2AC]"
          />

          <button type="button" aria-label="Attach" className="text-[#8B8896] hover:text-[#1F1E24]">
            <Paperclip className="size-4" />
          </button>

          <button
            type="submit"
            disabled={!input.trim() || sending}
            aria-label="Send"
            className="flex size-7 items-center justify-center rounded-full bg-[#8A583C] text-white hover:bg-[#774B32] transition-colors disabled:opacity-50"
          >
            <Send className="size-3.5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
