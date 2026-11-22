import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, History, RotateCcw, ShieldCheck } from 'lucide-react'
import { getQuestionnaireResults, submitQuestionnaire } from '@/api'
import type { QuestionnaireResult, Severity } from '@/types/contract'


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

const phq9Questions = [
  "Peu d'intérêt ou de plaisir à faire les choses",
  "Sentiment d'être triste, déprimé(e) ou désespéré(e)",
  "Difficultés à s'endormir, réveils fréquents ou sommeil excessif",
  "Sentiment de fatigue inhabituelle ou manque d'énergie",
  "Peu d'appétit ou tendance à manger excessivement",
  "Mauvaise image de soi, sentiment d'échec ou de décevoir vos proches",
  "Difficultés de concentration (lecture, télévision, travail)",
  "Ralentissement dans vos mouvements/paroles, ou agitation inhabituelle",
  "Pensées que vous seriez mieux mort(e) ou envie de vous faire du mal",
]

const gad7Questions = [
  "Sentiment de nervosité, d'anxiété ou d'être sur le qui-vive",
  "Incapacité à arrêter de vous inquiéter ou à contrôler vos craintes",
  "Inquiétude excessive concernant différents aspects de votre vie",
  "Difficulté prononcée à vous détendre",
  "Agitation telle qu'il vous est difficile de rester en place",
  "Tendance à vous énerver ou à devenir irritable très facilement",
  "Sentiment de peur soudaine, comme si quelque chose de terrible allait arriver",
]

const options = [
  { value: 0, label: 'Jamais', desc: 'Pas du tout ces 2 dernières semaines' },
  { value: 1, label: 'Plusieurs jours', desc: 'De temps en temps' },
  { value: 2, label: 'Plus de la moitié du temps', desc: 'Fréquemment' },
  { value: 3, label: 'Presque tous les jours', desc: 'Quasiment quotidiennement' },
]

const severityLabels: Record<Severity, { label: string; color: string; desc: string }> = {
  minimal: { label: 'Ressenti léger / Équilibré', color: '#7A9A7A', desc: 'Vos réponses indiquent un bon équilibre émotionnel global.' },
  mild: { label: 'Tension légère', color: '#7A9A7A', desc: 'Quelques moments de fatigue ou de stress passagers.' },
  moderate: { label: 'Charge émotionnelle modérée', color: '#B5956A', desc: "Un niveau d'inconfort qui mérite une attention bienveillante." },
  moderately_severe: { label: 'Charge importante', color: '#B5956A', desc: 'Un épisode exigeant. Votre spécialiste est là pour vous accompagner.' },
  severe: { label: 'Soutien prioritaire recommandé', color: '#8B4A4A', desc: "Votre bien-être est notre priorité absolue. N'hésitez pas à solliciter de l'aide." },
}

export default function QuestionnairePage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<QuestionnaireResult[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [mode, setMode] = useState<'choice' | 'testing' | 'result'>('choice')
  const [kind, setKind] = useState<'phq9' | 'gad7'>('phq9')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [latestResult, setLatestResult] = useState<QuestionnaireResult | null>(null)

  useEffect(() => { loadPastResults() }, [])

  async function loadPastResults() {
    try {
      setLoadingHistory(true)
      const data = await getQuestionnaireResults()
      setHistory(data)
    } catch { /* ignore */ }
    finally { setLoadingHistory(false) }
  }

  function startTest(selectedKind: 'phq9' | 'gad7') {
    setKind(selectedKind)
    setAnswers(new Array(selectedKind === 'phq9' ? 9 : 7).fill(-1))
    setCurrentIdx(0)
    setMode('testing')
  }

  async function handleOptionSelect(value: number) {
    const nextAnswers = [...answers]
    nextAnswers[currentIdx] = value
    setAnswers(nextAnswers)
    const questions = kind === 'phq9' ? phq9Questions : gad7Questions
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      setSubmitting(true)
      try {
        const reply = await submitQuestionnaire(kind, nextAnswers)
        setLatestResult(reply.result)
        setHistory((prev) => [reply.result, ...prev])
        if (reply.crisis) { navigate('/patient/crisis', { state: { crisis: reply.crisis } }); return }
        setMode('result')
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur lors de la validation.')
      } finally { setSubmitting(false) }
    }
  }

  const questions = kind === 'phq9' ? phq9Questions : gad7Questions
  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100)

  return (
    <div className="flex flex-col px-5 pt-5 pb-8" style={{ backgroundColor: C.bg, minHeight: '100%', fontFamily: 'sans-serif' }}>

      {/* Header card */}
      <div
        className="relative mb-5 overflow-hidden rounded-3xl p-5"
        style={{ backgroundColor: C.dark }}
      >
        <svg viewBox="0 0 320 90" className="absolute inset-0 size-full opacity-15">
          <ellipse cx="80" cy="90" rx="130" ry="70" fill={C.sageMid} />
          <ellipse cx="260" cy="90" rx="120" ry="60" fill={C.sage} />
          <circle cx="250" cy="30" r="28" fill={C.sageLight} />
        </svg>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="size-4" style={{ color: C.sageMid }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.sageMid }}>
              Bilan de Bien-Être
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-snug" style={{ color: C.cream, fontFamily: 'Georgia, serif' }}>
            Auto-évaluation clinique
          </h1>
          <p className="mt-1 text-xs" style={{ color: C.sageMid }}>
            PHQ-9 & GAD-7 — Sans jugement, à votre rythme.
          </p>
        </div>
      </div>

      {/* MODE 1: Choice */}
      {mode === 'choice' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {(['phq9', 'gad7'] as const).map((k) => (
              <button
                key={k}
                onClick={() => startTest(k)}
                className="flex items-start justify-between rounded-2xl border p-5 text-left transition-all hover:scale-[1.01]"
                style={{ borderColor: C.sageLight, backgroundColor: C.cream }}
              >
                <div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ backgroundColor: C.sageLight, color: C.dark }}
                  >
                    {k === 'phq9' ? '9 questions · ~3 min' : '7 questions · ~2 min'}
                  </span>
                  <h3
                    className="mt-2 text-lg font-bold"
                    style={{ color: C.dark, fontFamily: 'Georgia, serif' }}
                  >
                    {k === 'phq9' ? 'Échelle PHQ-9' : 'Échelle GAD-7'}
                  </h3>
                  <p className="mt-0.5 text-xs" style={{ color: C.muted }}>
                    {k === 'phq9'
                      ? 'Évalue votre vitalité, motivation et moral ces 2 dernières semaines.'
                      : "Mesure le stress, la nervosité et les tensions récentes."}
                  </p>
                </div>
                <ArrowRight className="size-5 shrink-0 mt-1" style={{ color: C.sage }} />
              </button>
            ))}
          </div>

          {/* History */}
          <div className="mt-2">
            <div className="mb-3 flex items-center gap-2">
              <History className="size-4" style={{ color: C.dark }} />
              <span className="text-xs font-bold" style={{ color: C.dark }}>Vos bilans précédents</span>
            </div>

            {loadingHistory ? (
              <p className="text-xs" style={{ color: C.muted }}>Chargement...</p>
            ) : history.length === 0 ? (
              <p
                className="rounded-2xl border-2 border-dashed p-4 text-center text-xs"
                style={{ borderColor: C.sageMid, color: C.muted }}
              >
                Aucun bilan enregistré. Choisissez un questionnaire ci-dessus !
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.slice(0, 5).map((item) => {
                  const sInfo = severityLabels[item.severity]
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border p-3 text-xs"
                      style={{ borderColor: C.sageLight, backgroundColor: C.cream }}
                    >
                      <div>
                        <span className="font-bold uppercase text-[10px]" style={{ color: C.dark }}>
                          {item.kind.toUpperCase()}
                        </span>
                        <p className="text-[11px]" style={{ color: C.muted }}>
                          {new Date(item.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: C.sageLight, color: C.dark }}
                        >
                          {sInfo.label}
                        </span>
                        <p className="mt-0.5 text-[10px]" style={{ color: C.muted }}>
                          Score : {item.score} pts
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Testing */}
      {mode === 'testing' && (
        <div className="flex flex-col gap-5">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: C.muted }}>Question {currentIdx + 1} sur {questions.length}</span>
              <span className="font-bold" style={{ color: C.dark }}>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: C.sageLight }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: C.dark }}
              />
            </div>
          </div>

          {/* Question card */}
          <div
            className="rounded-3xl p-6 shadow-sm"
            style={{ backgroundColor: C.cream, border: `1px solid ${C.sageLight}` }}
          >
            <span className="text-xs uppercase tracking-wide" style={{ color: C.muted }}>Ces 2 dernières semaines :</span>
            <h2
              className="mt-2 text-xl font-bold leading-relaxed"
              style={{ color: C.dark, fontFamily: 'Georgia, serif' }}
            >
              {questions[currentIdx]}
            </h2>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={submitting}
                onClick={() => void handleOptionSelect(opt.value)}
                className="flex items-center justify-between rounded-2xl border p-4 text-left transition-all hover:scale-[1.01]"
                style={{ borderColor: C.sageLight, backgroundColor: C.cream }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: C.dark }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{opt.desc}</p>
                </div>
                <div
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: C.sageLight, color: C.dark }}
                >
                  {opt.value}
                </div>
              </button>
            ))}
          </div>

          {/* Back */}
          <button
            className="flex items-center gap-1 self-start rounded-xl px-3 py-2 text-xs"
            style={{ color: C.muted }}
            onClick={() => { if (currentIdx > 0) setCurrentIdx((prev) => prev - 1); else setMode('choice') }}
          >
            <ArrowLeft className="size-3.5" />
            {currentIdx > 0 ? 'Question précédente' : 'Annuler'}
          </button>
        </div>
      )}

      {/* MODE 3: Result */}
      {mode === 'result' && latestResult && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div
            className="flex size-16 items-center justify-center rounded-full"
            style={{ backgroundColor: C.sageLight }}
          >
            <CheckCircle2 className="size-8" style={{ color: C.dark }} />
          </div>

          <div>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase"
              style={{ backgroundColor: C.sageLight, color: C.dark }}
            >
              Bilan {latestResult.kind.toUpperCase()} complété
            </span>
            <h2
              className="mt-3 text-2xl font-bold"
              style={{ color: C.dark, fontFamily: 'Georgia, serif' }}
            >
              {severityLabels[latestResult.severity].label}
            </h2>
            <p className="mt-2 mx-auto max-w-xs text-xs leading-relaxed" style={{ color: C.muted }}>
              {severityLabels[latestResult.severity].desc}
            </p>
          </div>

          <div
            className="w-full rounded-2xl border p-4 text-xs leading-relaxed"
            style={{ borderColor: C.sageLight, backgroundColor: C.cream, color: C.muted }}
          >
            <ShieldCheck className="mx-auto mb-1.5 size-5" style={{ color: C.dark }} />
            Ce bilan est un indicateur indicatif pour votre suivi. Il ne remplace pas une consultation et ne pose aucun diagnostic.
          </div>

          <button
            onClick={() => setMode('choice')}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold hover:opacity-90"
            style={{ backgroundColor: C.dark, color: C.cream }}
          >
            <RotateCcw className="size-4" /> Retour aux bilans
          </button>
        </div>
      )}
    </div>
  )
}
