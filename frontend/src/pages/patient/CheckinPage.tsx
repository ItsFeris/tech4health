import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, ChevronRight, RotateCcw, Search, Sparkles } from 'lucide-react'
import { sendCheckin } from '@/api'
import type { CheckinReply } from '@/types/contract'


const C = {
  bg: '#F2EFE9',
  dark: '#2C3A2C',
  darkMid: '#3D4F3D',
  sage: '#7A9A7A',
  sageMid: '#B5C9B5',
  sageLight: '#D8E5D8',
  cream: '#FAF8F4',
  muted: '#8A9A8A',
}

const moods = [
  { label: 'Heureux', emoji: '😊', score: 5 as const },
  { label: 'En colère', emoji: '😠', score: 2 as const },
  { label: 'Excité', emoji: '🤩', score: 4 as const },
  { label: 'Stressé', emoji: '😰', score: 2 as const },
  { label: 'Triste', emoji: '😢', score: 1 as const },
]

export default function CheckinPage() {
  const navigate = useNavigate()
  const [currentScreen, setCurrentScreen] = useState<'home' | 'meditation' | 'analytics'>('home')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [aiToast, setAiToast] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(275)
  const [selectedDay, setSelectedDay] = useState(15)

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying])

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  async function handleSelectMood(label: string, score: 1 | 2 | 3 | 4 | 5) {
    setSelectedMood(label)
    try {
      const reply: CheckinReply = await sendCheckin(score, `Humeur sélectionnée : ${label}`)
      setAiToast(reply.ai_reply)
      if (reply.crisis) navigate('/patient/crisis', { state: { crisis: reply.crisis } })
    } catch {
      // Ignore
    }
  }

  const days = [11, 12, 13, 14, 15, 16, 17, 18]
  const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S', 'D']

  return (
    <div className="mx-auto min-h-svh max-w-md pb-28" style={{ backgroundColor: C.bg, fontFamily: 'sans-serif' }}>

      {/* Screen tabs */}
      <div
        className="sticky top-0 z-20 flex items-center justify-center gap-1.5 px-4 py-2.5 backdrop-blur-md border-b"
        style={{ backgroundColor: `${C.bg}E8`, borderColor: C.sageLight }}
      >
        {(['home', 'meditation', 'analytics'] as const).map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setCurrentScreen(s)}
            className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
            style={
              currentScreen === s
                ? { backgroundColor: C.dark, color: C.cream }
                : { backgroundColor: C.sageLight, color: C.muted }
            }
          >
            {i + 1}. {s === 'home' ? 'Check-in' : s === 'meditation' ? 'Méditation' : 'Analyse'}
          </button>
        ))}
      </div>

      {/* ───────────── SCREEN 1: Home / Check-in ───────────── */}
      {currentScreen === 'home' && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-full overflow-hidden" style={{ backgroundColor: C.sageLight }}>
                <svg viewBox="0 0 36 36" className="size-full">
                  <circle cx="18" cy="13" r="7" fill={C.sageMid} />
                  <ellipse cx="18" cy="32" rx="11" ry="8" fill={C.sageMid} />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-full p-2" style={{ backgroundColor: C.sageLight }}>
                <Search className="size-4" style={{ color: C.dark }} />
              </button>
              <button className="rounded-full p-2" style={{ backgroundColor: C.sageLight }}>
                <Bell className="size-4" style={{ color: C.dark }} />
              </button>
            </div>
          </div>

          {/* Greeting */}
          <div className="px-5 pt-4">
            <p className="text-xs" style={{ color: C.muted }}>Bonjour 🌱</p>
            <h1 className="mt-0.5 text-3xl font-bold leading-tight" style={{ color: C.dark, fontFamily: 'Georgia, serif' }}>
              Comment avez-vous<br />vécu votre journée ?
            </h1>
          </div>

          {/* Mood pills */}
          <div className="mt-5 px-5">
            <div className="flex flex-wrap gap-2.5">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  type="button"
                  onClick={() => void handleSelectMood(mood.label, mood.score)}
                  className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    borderColor: selectedMood === mood.label ? C.dark : C.sageLight,
                    backgroundColor: selectedMood === mood.label ? C.sageLight : C.cream,
                    color: C.dark,
                  }}
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Reply toast */}
          {aiToast && (
            <div className="mx-5 mt-4 rounded-2xl p-4 text-xs leading-relaxed" style={{ backgroundColor: C.sageLight, color: C.darkMid }}>
              <Sparkles className="mb-1 size-4" style={{ color: C.dark }} />
              {aiToast}
            </div>
          )}

          {/* Daily focus card — dark card à la Velora */}
          <div className="mx-5 mt-5 overflow-hidden rounded-3xl" style={{ backgroundColor: C.dark }}>
            <div className="relative p-5">
              {/* Landscape SVG */}
              <svg viewBox="0 0 320 90" className="absolute inset-0 size-full opacity-20">
                <ellipse cx="80" cy="90" rx="130" ry="70" fill={C.sageMid} />
                <ellipse cx="260" cy="90" rx="120" ry="60" fill={C.sage} />
                <circle cx="240" cy="30" r="28" fill={C.sageLight} />
              </svg>
              <div className="relative">
                <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: C.sageMid }}>
                  Focus du jour
                </span>
                <h2 className="mt-1 text-xl font-bold leading-snug" style={{ color: C.cream, fontFamily: 'Georgia, serif' }}>
                  Prenez soin de votre bien-être mental
                </h2>
                <p className="mt-1 text-xs" style={{ color: C.sageMid }}>
                  Nous sommes là pour vous, chaque étape du chemin.
                </p>
                <button
                  className="mt-3 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
                  style={{ backgroundColor: C.sageLight, color: C.dark }}
                  onClick={() => setCurrentScreen('meditation')}
                >
                  ▶ Commencer
                </button>
              </div>
            </div>
          </div>

          {/* Journal section */}
          <div className="mt-6 px-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base" style={{ color: C.dark, fontFamily: 'Georgia, serif' }}>Votre journal</h3>
              <button className="text-xs font-semibold" style={{ color: C.sage }}>Voir tout</button>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {[
                { date: '12 Septembre 2024', title: 'Écrire librement sur ce qui occupe vos pensées.' },
                { date: '10 Novembre 2024', title: "Qu'est-ce qui a traversé votre esprit aujourd'hui ?" },
              ].map((j, i) => (
                <button
                  key={i}
                  className="flex items-center justify-between rounded-2xl p-4 text-left"
                  style={{ backgroundColor: C.cream, border: `1px solid ${C.sageLight}` }}
                >
                  <div>
                    <p className="text-[10px]" style={{ color: C.muted }}>{j.date}</p>
                    <p className="mt-0.5 text-xs font-medium" style={{ color: C.dark }}>{j.title}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0" style={{ color: C.muted }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ───────────── SCREEN 2: Meditation ───────────── */}
      {currentScreen === 'meditation' && (
        <div className="flex flex-col items-center px-5 pt-6">
          {/* Back + icons */}
          <div className="flex w-full items-center justify-between mb-6">
            <button onClick={() => setCurrentScreen('home')} className="rounded-full p-2" style={{ backgroundColor: C.sageLight }}>
              <ArrowLeft className="size-4" style={{ color: C.dark }} />
            </button>
            <div className="flex gap-2">
              <button className="rounded-full p-2" style={{ backgroundColor: C.sageLight }}>
                <Search className="size-4" style={{ color: C.dark }} />
              </button>
              <button className="rounded-full p-2" style={{ backgroundColor: C.sageLight }}>
                <Bell className="size-4" style={{ color: C.dark }} />
              </button>
            </div>
          </div>

          {/* AI badge */}
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold"
            style={{ backgroundColor: C.sageLight, color: C.dark }}
          >
            <Sparkles className="size-3" />
            Propulsé par l'IA
          </div>

          <h1 className="mt-3 text-center text-3xl font-bold leading-tight" style={{ color: C.dark, fontFamily: 'Georgia, serif' }}>
            Méditation<br />Stress & Relaxation
          </h1>

          <p className="mt-2 text-2xl font-mono font-bold" style={{ color: C.sage }}>
            {formatTimer(secondsLeft)}
          </p>

          {/* Waveform */}
          <div className="mt-4 flex items-center gap-0.5 h-8">
            {Array.from({ length: 32 }, (_, i) => (
              <div
                key={i}
                className="w-1 rounded-full transition-all duration-300"
                style={{
                  height: isPlaying ? `${10 + Math.sin(i * 0.6 + Date.now() * 0.001) * 14 + 14}px` : '6px',
                  backgroundColor: i < 16 ? C.dark : C.sageMid,
                }}
              />
            ))}
          </div>

          {/* Illustration — landscape with meditating figure */}
          <div
            className="mt-6 w-full overflow-hidden rounded-3xl"
            style={{ backgroundColor: C.sageLight, height: 220 }}
          >
            <svg viewBox="0 0 320 220" className="size-full">
              {/* Sky gradient */}
              <defs>
                <radialGradient id="sunGrad" cx="50%" cy="60%" r="50%">
                  <stop offset="0%" stopColor="#FAF8F4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#D8E5D8" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="320" height="220" fill="#D8E5D8" />
              {/* Sun */}
              <circle cx="160" cy="110" r="55" fill="url(#sunGrad)" />
              {/* Hills */}
              <ellipse cx="60" cy="220" rx="150" ry="90" fill="#B5C9B5" opacity="0.6" />
              <ellipse cx="270" cy="220" rx="130" ry="80" fill="#7A9A7A" opacity="0.5" />
              <ellipse cx="160" cy="220" rx="200" ry="65" fill="#2C3A2C" opacity="0.12" />
              {/* Meditating figure */}
              <ellipse cx="160" cy="175" rx="30" ry="10" fill="#B5C9B5" opacity="0.4" />
              <circle cx="160" cy="145" r="10" fill="#E8D5C8" />
              {/* Body */}
              <path d="M140 155 Q160 165 180 155 Q175 185 160 183 Q145 185 140 155Z" fill="#E8D5C8" />
              {/* Arms */}
              <path d="M140 162 Q125 170 120 165" stroke="#E8D5C8" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M180 162 Q195 170 200 165" stroke="#E8D5C8" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Decorative elements */}
              <path d="M80 60 Q95 40 110 60 Q95 75 80 60Z" fill="#7A9A7A" opacity="0.4" />
              <circle cx="250" cy="80" r="6" fill="#E8D5C8" opacity="0.6" />
              <circle cx="70" cy="90" r="4" fill="#E8D5C8" opacity="0.5" />
            </svg>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              className="flex size-11 items-center justify-center rounded-full border-2 text-sm font-bold"
              style={{ borderColor: C.sageMid, color: C.dark }}
            >
              15
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex size-16 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105"
              style={{ backgroundColor: C.dark }}
            >
              {isPlaying
                ? <div className="flex gap-1"><div className="h-5 w-1.5 rounded-full" style={{ backgroundColor: C.cream }} /><div className="h-5 w-1.5 rounded-full" style={{ backgroundColor: C.cream }} /></div>
                : <div className="ml-1 border-y-8 border-l-[14px] border-transparent border-l-current" style={{ color: C.cream }} />
              }
            </button>
            <button className="rounded-full p-2.5" style={{ backgroundColor: C.sageLight }}>
              <RotateCcw className="size-5" style={{ color: C.dark }} />
            </button>
          </div>
        </div>
      )}

      {/* ───────────── SCREEN 3: Emotion Analysis ───────────── */}
      {currentScreen === 'analytics' && (
        <div className="px-5 pt-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentScreen('home')} className="rounded-full p-2" style={{ backgroundColor: C.sageLight }}>
              <ArrowLeft className="size-4" style={{ color: C.dark }} />
            </button>
            <div className="flex gap-2">
              <button className="rounded-full p-2" style={{ backgroundColor: C.sageLight }}>
                <Search className="size-4" style={{ color: C.dark }} />
              </button>
              <button className="rounded-full p-2" style={{ backgroundColor: C.sageLight }}>
                <Bell className="size-4" style={{ color: C.dark }} />
              </button>
            </div>
          </div>

          <p className="text-xs" style={{ color: C.muted }}>12 Novembre 2024</p>
          <h1 className="mt-0.5 text-2xl font-bold" style={{ color: C.dark, fontFamily: 'Georgia, serif' }}>
            Analyse Émotionnelle
          </h1>

          {/* Week calendar */}
          <div className="mt-4 flex justify-between">
            {days.map((d, i) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[9px] font-semibold uppercase" style={{ color: C.muted }}>{dayLabels[i]}</span>
                <div
                  className="flex size-7 items-center justify-center rounded-full text-xs font-bold transition-all"
                  style={
                    selectedDay === d
                      ? { backgroundColor: C.dark, color: C.cream }
                      : { backgroundColor: 'transparent', color: C.darkMid }
                  }
                >
                  {d}
                </div>
              </button>
            ))}
          </div>

          {/* AI Analytic label */}
          <div className="mt-5 flex items-center gap-1.5">
            <Sparkles className="size-3.5" style={{ color: C.dark }} />
            <span className="text-xs font-semibold" style={{ color: C.dark }}>IA Analytique</span>
          </div>

          {/* Mood curve chart */}
          <div
            className="mt-3 overflow-hidden rounded-2xl p-4"
            style={{ backgroundColor: C.cream, border: `1px solid ${C.sageLight}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: C.dark }}>Humeur</span>
              <span className="text-xs font-bold" style={{ color: C.sage }}>88%</span>
            </div>
            {/* Y axis labels */}
            <div className="relative" style={{ height: 100 }}>
              {[20, 40, 60, 80, 100].map((v) => (
                <div
                  key={v}
                  className="absolute w-full border-t text-[9px]"
                  style={{
                    bottom: `${v}%`,
                    borderColor: `${C.sageLight}`,
                    color: C.muted,
                  }}
                >
                  <span className="pr-1">{v}%</span>
                </div>
              ))}
              {/* SVG Curve */}
              <svg viewBox="0 0 280 100" className="absolute inset-0 size-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="curveGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={C.sage} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={C.sage} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 70 C40 60 60 80 100 50 C130 30 150 15 180 12 C210 10 240 30 280 25"
                  fill="none"
                  stroke={C.sage}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M0 70 C40 60 60 80 100 50 C130 30 150 15 180 12 C210 10 240 30 280 25 L280 100 L0 100Z"
                  fill="url(#curveGrad)"
                />
                {/* Peak dot */}
                <circle cx="180" cy="12" r="4" fill={C.dark} />
              </svg>
            </div>
          </div>

          {/* Stat cards 2×2 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { value: '78%', label: 'Niveau de Stress' },
              { value: '4X', label: "Fréquence d'Anxiété" },
              { value: '5h', label: 'Qualité du Sommeil' },
              { value: '60%', label: 'Stabilité du Focus' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col rounded-2xl p-4"
                style={{ backgroundColor: C.cream, border: `1px solid ${C.sageLight}` }}
              >
                <span className="text-2xl font-bold" style={{ color: C.dark, fontFamily: 'Georgia, serif' }}>
                  {stat.value}
                </span>
                <span className="mt-1 text-[11px]" style={{ color: C.muted }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
