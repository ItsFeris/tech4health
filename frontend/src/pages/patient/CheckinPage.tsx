import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, ChevronRight, RotateCcw, Search, Sparkles } from 'lucide-react'
import { sendCheckin } from '@/api'
import type { CheckinReply } from '@/types/contract'
import { cn } from '@/lib/utils'

export default function CheckinPage() {
  const navigate = useNavigate()

  // Screen selection matching the 3 mockup phones: 'home' | 'meditation' | 'analytics'
  const [currentScreen, setCurrentScreen] = useState<'home' | 'meditation' | 'analytics'>('home')

  // Screen 1: Home / Check-in State
  const [selectedMood, setSelectedMood] = useState<string | null>('Happy')
  const [aiToast, setAiToast] = useState<string | null>(null)

  // Screen 2: Meditation State
  const [isPlaying, setIsPlaying] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(275) // 04:35 = 275s

  // Screen 3: Analytics State
  const [selectedDay, setSelectedDay] = useState(15)

  // Timer effect for Meditation screen
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

  // Handle Mood selection and trigger API
  async function handleSelectMood(label: string, score: 1 | 2 | 3 | 4 | 5) {
    setSelectedMood(label)
    try {
      const reply: CheckinReply = await sendCheckin(score, `Humeur sélectionnée : ${label}`)
      setAiToast(reply.ai_reply)
      if (reply.crisis) {
        navigate('/patient/crisis', { state: { crisis: reply.crisis } })
      }
    } catch {
      // Ignore
    }
  }

  return (
    <div className="mx-auto min-h-svh max-w-md bg-[#FAF9F5] text-[#242426] font-sans pb-28 selection:bg-teal-100">
      
      {/* Phone Screen Switcher Tabs (To toggle between the 3 mockup screens) */}
      <div className="sticky top-0 z-20 flex items-center justify-center gap-1.5 bg-[#FAF9F5]/90 px-4 py-2.5 backdrop-blur-md border-b border-black/5">
        <button
          type="button"
          onClick={() => setCurrentScreen('home')}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-all',
            currentScreen === 'home'
              ? 'bg-[#1E1F24] text-white shadow-xs'
              : 'text-[#6D6E73] hover:text-[#1E1F24] bg-black/5'
          )}
        >
          1. Home Check-in
        </button>
        <button
          type="button"
          onClick={() => setCurrentScreen('meditation')}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-all',
            currentScreen === 'meditation'
              ? 'bg-[#1E1F24] text-white shadow-xs'
              : 'text-[#6D6E73] hover:text-[#1E1F24] bg-black/5'
          )}
        >
          2. Méditation
        </button>
        <button
          type="button"
          onClick={() => setCurrentScreen('analytics')}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-all',
            currentScreen === 'analytics'
              ? 'bg-[#1E1F24] text-white shadow-xs'
              : 'text-[#6D6E73] hover:text-[#1E1F24] bg-black/5'
          )}
        >
          3. Analytics
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: HOME (Exact match of left mockup) */}
      {/* ========================================================================= */}
      {currentScreen === 'home' && (
        <div className="flex flex-col gap-6 p-5">
          {/* Top Bar with Avatar, Greeting & Icons */}
          <div className="flex items-center justify-between pt-1">
            <div className="size-9 overflow-hidden rounded-full border border-black/10 bg-amber-100 p-0.5 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Avatar"
                className="size-full rounded-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2 text-center">
              <span className="text-amber-500 text-sm">🌅</span>
              <span className="text-xs font-medium text-[#4A4B4F]">Good Morning</span>
            </div>

            <div className="flex items-center gap-3 text-[#3E4044]">
              <button type="button" aria-label="Search" className="hover:opacity-75">
                <Search className="size-5" />
              </button>
              <button type="button" aria-label="Notifications" className="hover:opacity-75">
                <Bell className="size-5" />
              </button>
            </div>
          </div>

          {/* Main Question */}
          <div className="text-center pt-1">
            <h1 className="font-serif text-[30px] font-normal tracking-tight text-[#1E1F24] leading-tight">
              How have things <br /> been today?
            </h1>
          </div>

          {/* Mood Pill Buttons (2 Rows exactly as in mockup) */}
          <div className="flex flex-col items-center gap-2.5 pt-1">
            {/* Row 1: Happy, Angry, Excited */}
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => void handleSelectMood('Happy', 5)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all shadow-xs',
                  selectedMood === 'Happy'
                    ? 'bg-[#E3DCF7] text-[#473B7B] ring-2 ring-[#473B7B]/30 scale-105'
                    : 'bg-[#EDE8F9] text-[#55478E] hover:bg-[#E3DCF7]'
                )}
              >
                <span>😊</span>
                <span>Happy</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSelectMood('Angry', 1)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all shadow-xs',
                  selectedMood === 'Angry'
                    ? 'bg-[#FFD7CE] text-[#8C2E1B] ring-2 ring-[#8C2E1B]/30 scale-105'
                    : 'bg-[#FFE5DF] text-[#A63722] hover:bg-[#FFD7CE]'
                )}
              >
                <span>😡</span>
                <span>Angry</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSelectMood('Excited', 5)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all shadow-xs',
                  selectedMood === 'Excited'
                    ? 'bg-[#FFE2C2] text-[#8A5214] ring-2 ring-[#8A5214]/30 scale-105'
                    : 'bg-[#FFECD9] text-[#9E5F18] hover:bg-[#FFE2C2]'
                )}
              >
                <span>🤩</span>
                <span>Excited</span>
              </button>
            </div>

            {/* Row 2: Stressed, Sad */}
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => void handleSelectMood('Stressed', 2)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all shadow-xs',
                  selectedMood === 'Stressed'
                    ? 'bg-[#BFE9F5] text-[#135C6E] ring-2 ring-[#135C6E]/30 scale-105'
                    : 'bg-[#D3F1FA] text-[#1B6F84] hover:bg-[#BFE9F5]'
                )}
              >
                <span>😰</span>
                <span>Stressed</span>
              </button>

              <button
                type="button"
                onClick={() => void handleSelectMood('Sad', 1)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all shadow-xs',
                  selectedMood === 'Sad'
                    ? 'bg-[#FEECA7] text-[#785E00] ring-2 ring-[#785E00]/30 scale-105'
                    : 'bg-[#FFF3C2] text-[#8A6C00] hover:bg-[#FEECA7]'
                )}
              >
                <span>😢</span>
                <span>Sad</span>
              </button>
            </div>
          </div>

          {/* AI Response Toast if clicked */}
          {aiToast && (
            <div className="rounded-2xl bg-white p-3.5 shadow-sm border border-emerald-100 text-xs text-[#2A2B2E] flex items-start gap-2.5 animate-in fade-in">
              <Sparkles className="size-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-teal-900">Compagnon IA</p>
                <p className="mt-0.5 text-muted-foreground">{aiToast}</p>
              </div>
            </div>
          )}

          {/* Large Mint Banner Card ("Take charge of your mental well-being") */}
          <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-r from-[#DDF2E7] via-[#D5EDE1] to-[#EAF5EF] p-6 shadow-xs border border-[#CDE5D8]">
            <div className="flex items-start justify-between">
              <div className="max-w-[190px] space-y-2 z-10">
                <h3 className="font-sans text-[17px] font-bold text-[#193325] leading-snug">
                  Take charge of your mental well-being
                </h3>
                <p className="text-[11px] text-[#4F6E5E] leading-relaxed">
                  We're here for you every step of the way
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/patient')}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#17261E] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#23382D] transition-all"
                >
                  <Sparkles className="size-3 text-teal-300" />
                  <span>Help With AI</span>
                </button>
              </div>

              {/* Illustration: Cute Pink Floral Brain with sprout and butterflies */}
              <div className="relative shrink-0 -mr-2 -mt-1">
                <svg viewBox="0 0 120 120" className="size-28">
                  {/* Sprout Stem & Leaves */}
                  <path d="M 60 45 Q 60 25 50 15 Q 62 20 60 45" fill="#58A36E" />
                  <ellipse cx="48" cy="18" rx="8" ry="4" transform="rotate(-30 48 18)" fill="#78C48E" />
                  <ellipse cx="68" cy="24" rx="7" ry="3.5" transform="rotate(25 68 24)" fill="#78C48E" />

                  {/* Brain / Flower Petals (Pink Cloud Cluster) */}
                  <circle cx="45" cy="65" r="14" fill="#F8A7B8" />
                  <circle cx="60" cy="55" r="16" fill="#FCAFC0" />
                  <circle cx="75" cy="65" r="14" fill="#F8A7B8" />
                  <circle cx="52" cy="78" r="13" fill="#FCA5B7" />
                  <circle cx="68" cy="78" r="13" fill="#FCA5B7" />
                  <circle cx="60" cy="70" r="14" fill="#FFAEC0" />

                  {/* Small decorative heart */}
                  <path d="M 90 40 C 90 35 96 35 98 38 C 100 35 106 35 106 40 C 106 45 98 50 98 50 C 98 50 90 45 90 40 Z" fill="#FCAFC0" />
                  {/* Floating Yellow Butterfly */}
                  <ellipse cx="28" cy="46" rx="4" ry="7" transform="rotate(-35 28 46)" fill="#FEE072" />
                  <ellipse cx="24" cy="49" rx="3" ry="5" transform="rotate(35 24 49)" fill="#FDD048" />
                  <circle cx="27" cy="47" r="1.5" fill="#D49910" />
                </svg>
              </div>
            </div>
          </div>

          {/* Section: "Your Journal" */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[20px] font-normal text-[#1E1F24]">Your Journal</h2>
              <button
                type="button"
                onClick={() => setCurrentScreen('analytics')}
                className="text-xs font-medium text-[#7C7E83] hover:text-[#1E1F24]"
              >
                See All
              </button>
            </div>

            {/* Journal Item 1 */}
            <div
              onClick={() => setCurrentScreen('meditation')}
              className="cursor-pointer flex items-center justify-between rounded-3xl bg-white p-4 shadow-xs border border-black/5 hover:border-black/15 transition-all"
            >
              <div className="flex items-center gap-3.5">
                {/* Pastel bubble icon */}
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#EDE7F9]">
                  <span className="text-xl">💭</span>
                </div>
                <div>
                  <p className="text-[11px] text-[#86888E]">12 September 2024</p>
                  <p className="text-xs font-medium text-[#222326] mt-0.5 leading-snug">
                    Write freely about what's occupying your thoughts today.
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-[#A1A3A8] shrink-0 ml-2" />
            </div>

            {/* Journal Item 2 */}
            <div
              onClick={() => setCurrentScreen('meditation')}
              className="cursor-pointer flex items-center justify-between rounded-3xl bg-white p-4 shadow-xs border border-black/5 hover:border-black/15 transition-all"
            >
              <div className="flex items-center gap-3.5">
                {/* Sun & sprout icon */}
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FFF6D9]">
                  <span className="text-xl">🌱</span>
                </div>
                <div>
                  <p className="text-[11px] text-[#86888E]">10 November 2024</p>
                  <p className="text-xs font-medium text-[#222326] mt-0.5 leading-snug">
                    What's been running through your head today?
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-[#A1A3A8] shrink-0 ml-2" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: MEDITATION STRESS RELAXATION (Center Mockup) */}
      {/* ========================================================================= */}
      {currentScreen === 'meditation' && (
        <div className="flex flex-col gap-6 p-5">
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setCurrentScreen('home')}
              className="flex size-9 items-center justify-center rounded-full bg-white shadow-xs border border-black/5"
            >
              <ArrowLeft className="size-4" />
            </button>

            <div className="flex items-center gap-3 text-[#3E4044]">
              <Search className="size-5" />
              <Bell className="size-5" />
            </div>
          </div>

          {/* Badge: Powered by AI */}
          <div className="flex justify-center pt-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E3F6F4] px-3.5 py-1 text-xs font-medium text-[#1A736B]">
              <Sparkles className="size-3.5" />
              <span>Powered by AI</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="font-serif text-[28px] font-normal tracking-tight text-[#1E1F24] leading-tight">
              Meditation Stress <br /> Relaxation
            </h1>
            <p className="font-mono text-xs font-semibold text-[#66686E] mt-3">
              {formatTimer(secondsLeft)}
            </p>
          </div>

          {/* Waveform Soundwave Visualization */}
          <div className="flex items-center justify-center gap-1 h-12 px-4">
            {[18, 30, 24, 42, 35, 20, 28, 48, 32, 22, 16, 26, 40, 30, 22, 18, 34, 28, 16].map((h, i) => (
              <div
                key={i}
                className={cn(
                  'w-1 rounded-full transition-all duration-300',
                  isPlaying ? 'bg-[#299C95] animate-pulse' : 'bg-[#9CD3CF]'
                )}
                style={{ height: `${isPlaying ? (h * 1.2) % 48 + 12 : h}px` }}
              />
            ))}
          </div>

          {/* Centerpiece Illustration: Meditating Person on Arches */}
          <div className="relative flex items-center justify-center py-4">
            <svg viewBox="0 0 240 200" className="w-64 h-52">
              {/* Glowing Arches (Yellow to Orange) */}
              <path d="M 40 180 A 80 80 0 0 1 200 180" fill="#F8C843" opacity="0.9" />
              <path d="M 60 180 A 60 60 0 0 1 180 180" fill="#ECA92F" />

              {/* Floating Purple Ribbons */}
              <path d="M 10 90 Q 70 70 120 100 T 230 80" fill="none" stroke="#A793E8" strokeWidth="12" strokeLinecap="round" opacity="0.8" />
              <path d="M 20 120 Q 80 100 140 130 T 220 110" fill="none" stroke="#B8A7EF" strokeWidth="8" strokeLinecap="round" opacity="0.6" />

              {/* Floating Butterfly & Heart */}
              <ellipse cx="30" cy="95" rx="6" ry="10" transform="rotate(-25 30 95)" fill="#FEE072" />
              <path d="M 210 95 C 210 90 216 90 218 93 C 220 90 226 90 226 95 C 226 100 218 105 218 105 Z" fill="#F8A7B8" />

              {/* Meditating Figure (Pink) */}
              {/* Head */}
              <circle cx="120" cy="115" r="9" fill="#F8A7B8" />
              {/* Torso */}
              <path d="M 112 125 Q 120 120 128 125 L 128 145 L 112 145 Z" fill="#F8A7B8" />
              {/* Crossed Legs */}
              <ellipse cx="120" cy="155" rx="35" ry="8" fill="#F8A7B8" />
              {/* Hands in Mudra */}
              <path d="M 112 130 L 98 142 L 108 146" fill="none" stroke="#F8A7B8" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 128 130 L 142 142 L 132 146" fill="none" stroke="#F8A7B8" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Media Player Controls (15s back, Play/Pause Teal Circle, Skip) */}
          <div className="flex items-center justify-center gap-7 pt-2">
            {/* -15s Button */}
            <button
              type="button"
              onClick={() => setSecondsLeft((prev) => Math.min(275, prev + 15))}
              className="flex size-11 items-center justify-center rounded-full bg-white shadow-xs border border-black/10 text-xs font-bold text-[#3E4044] hover:bg-black/5"
            >
              15
            </button>

            {/* Big Teal Play/Pause Button */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex size-16 items-center justify-center rounded-full bg-[#20B0A7] text-white shadow-lg shadow-[#20B0A7]/30 hover:bg-[#1A9C94] transition-transform active:scale-95"
            >
              {isPlaying ? (
                <div className="size-5 rounded-sm bg-white" />
              ) : (
                <div className="ml-1 size-0 border-y-[9px] border-y-transparent border-l-[15px] border-l-white" />
              )}
            </button>

            {/* Skip Button */}
            <button
              type="button"
              onClick={() => setSecondsLeft(275)}
              className="flex size-11 items-center justify-center rounded-full bg-white shadow-xs border border-black/10 text-[#3E4044] hover:bg-black/5"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: EMOTION ANALYSIS (Right Mockup) */}
      {/* ========================================================================= */}
      {currentScreen === 'analytics' && (
        <div className="flex flex-col gap-6 p-5">
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setCurrentScreen('home')}
              className="flex size-9 items-center justify-center rounded-full bg-white shadow-xs border border-black/5"
            >
              <ArrowLeft className="size-4" />
            </button>

            <div className="flex items-center gap-3 text-[#3E4044]">
              <Search className="size-5" />
              <Bell className="size-5" />
            </div>
          </div>

          {/* Date & Title */}
          <div className="text-center">
            <p className="text-xs text-[#7B7D82]">12 November 2024</p>
            <h1 className="font-serif text-[28px] font-normal tracking-tight text-[#1E1F24] mt-0.5">
              Emotion Analysis
            </h1>
          </div>

          {/* Calendar Week Selector */}
          <div className="flex items-center justify-between px-1">
            {[
              { d: 11, day: 'S' },
              { d: 12, day: 'M' },
              { d: 13, day: 'T' },
              { d: 14, day: 'W' },
              { d: 15, day: 'T' },
              { d: 16, day: 'F' },
              { d: 17, day: 'S' },
              { d: 18, day: 'S' },
            ].map((item) => {
              const isSelected = selectedDay === item.d
              return (
                <button
                  key={item.d}
                  type="button"
                  onClick={() => setSelectedDay(item.d)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={cn(
                      'flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all',
                      isSelected
                        ? 'bg-[#29B0A7] text-white shadow-sm'
                        : 'text-[#484A4F] hover:bg-black/5'
                    )}
                  >
                    {item.d}
                  </div>
                  <span className="text-[10px] text-[#8C8E94]">{item.day}</span>
                </button>
              )
            })}
          </div>

          {/* AI Analytic Curve Card */}
          <div className="rounded-3xl bg-white p-5 shadow-xs border border-black/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#209F97]">
                <Sparkles className="size-4" />
                <span>AI Analytic</span>
              </div>
            </div>

            {/* SVG Wavy Curve with Mood 88% Pill Tag */}
            <div className="relative pt-6 pb-2">
              {/* Mood 88% floating tag */}
              <div className="absolute right-14 top-0 rounded-full bg-[#F3EBF9] px-2.5 py-0.5 text-[10px] font-bold text-[#6D478A] shadow-xs">
                Mood 88%
              </div>

              <svg viewBox="0 0 320 100" className="w-full h-24 overflow-visible">
                {/* Horizontal Dotted Gridlines */}
                <line x1="0" y1="20" x2="320" y2="20" stroke="#F0F0F2" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="320" y2="50" stroke="#F0F0F2" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="320" y2="80" stroke="#F0F0F2" strokeDasharray="3 3" />

                {/* Smooth Lilac Wave Curve */}
                <path
                  d="M 10 75 Q 60 40 100 68 T 190 70 T 260 25 T 310 55"
                  fill="none"
                  stroke="#C289D9"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Highlight Point on Peak */}
                <circle cx="260" cy="25" r="4.5" fill="#C289D9" />
                <circle cx="260" cy="25" r="7" fill="none" stroke="#C289D9" strokeWidth="1.5" />
              </svg>

              {/* Percentages along bottom */}
              <div className="flex items-center justify-between text-[10px] text-[#A2A4AA] pt-2">
                <span>20%</span>
                <span>40%</span>
                <span>60%</span>
                <span>80%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* 4 Stats Cards (2x2 Grid with exact icons & stats) */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Card 1: 78% Stress Level */}
            <div className="rounded-3xl bg-white p-4 shadow-xs border border-black/5 flex flex-col justify-between">
              <div className="flex justify-end">
                {/* Pink tangled scribble */}
                <svg viewBox="0 0 40 40" className="size-8">
                  <path
                    d="M 10 20 Q 25 5 15 25 Q 30 35 25 15 Q 10 30 30 20 Q 5 10 25 25"
                    fill="none"
                    stroke="#F695A6"
                    strokeWidth="2.2"
                  />
                </svg>
              </div>
              <div className="mt-2">
                <p className="font-serif text-[26px] font-bold text-[#1E1F24] leading-none">78%</p>
                <p className="text-[11px] text-[#7C7E84] mt-1">Stress Level</p>
              </div>
            </div>

            {/* Card 2: 4X Anxiety Frequency */}
            <div className="rounded-3xl bg-white p-4 shadow-xs border border-black/5 flex flex-col justify-between">
              <div className="flex justify-end">
                {/* Purple Heart */}
                <div className="size-6 text-[#9F8BE7]">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <p className="font-serif text-[26px] font-bold text-[#1E1F24] leading-none">4X</p>
                <p className="text-[11px] text-[#7C7E84] mt-1">Anxiety Frequency</p>
              </div>
            </div>

            {/* Card 3: 5h Sleep Quality */}
            <div className="rounded-3xl bg-white p-4 shadow-xs border border-black/5 flex flex-col justify-between">
              <div className="flex justify-end">
                {/* Green Zzz */}
                <div className="flex flex-col items-end text-[#71C598] font-bold text-xs leading-none">
                  <span className="text-sm">z</span>
                  <span className="text-xs mr-1">z</span>
                  <span className="text-[10px] mr-2">z</span>
                </div>
              </div>
              <div className="mt-2">
                <p className="font-serif text-[26px] font-bold text-[#1E1F24] leading-none">5h</p>
                <p className="text-[11px] text-[#7C7E84] mt-1">Sleep Quality</p>
              </div>
            </div>

            {/* Card 4: 60% Focus Stability */}
            <div className="rounded-3xl bg-white p-4 shadow-xs border border-black/5 flex flex-col justify-between">
              <div className="flex justify-end">
                {/* Golden target circles */}
                <svg viewBox="0 0 30 30" className="size-7">
                  <circle cx="15" cy="15" r="12" fill="none" stroke="#E5B239" strokeWidth="1.8" />
                  <circle cx="15" cy="15" r="7" fill="none" stroke="#E5B239" strokeWidth="1.8" />
                  <circle cx="15" cy="15" r="2.5" fill="#E5B239" />
                </svg>
              </div>
              <div className="mt-2">
                <p className="font-serif text-[26px] font-bold text-[#1E1F24] leading-none">60%</p>
                <p className="text-[11px] text-[#7C7E84] mt-1">Focus Stability</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
