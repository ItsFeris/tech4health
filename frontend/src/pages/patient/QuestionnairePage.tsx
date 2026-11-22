import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, History, RotateCcw, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getQuestionnaireResults, submitQuestionnaire } from '@/api'
import type { QuestionnaireResult, Severity } from '@/types/contract'
import { cn } from '@/lib/utils'

const phq9Questions = [
  "Peu d'intérêt ou de plaisir à faire les choses",
  "Sentiment d'être triste, déprimé(e) ou désespéré(e)",
  "Difficultés à s'endormir, réveils fréquents ou sommeil excessif",
  "Sentiment de fatigue inhabituelle ou manque d'énergie",
  "Peu d'appétit ou tendance à manger excessivement",
  "Mauvaise image de soi, sentiment d'échec ou de décevoir vos proches",
  "Difficultés de concentration (lecture, télévision, travail)",
  "Ralentissement dans vos mouvements/paroles, ou au contraire agitation inhabituelle",
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
  minimal: { label: 'Ressenti léger / Équilibré', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Vos réponses indiquent un bon équilibre émotionnel global.' },
  mild: { label: 'Tension légère', color: 'text-teal-600 bg-teal-50 border-teal-200', desc: 'Quelques moments de fatigue ou de stress passagers.' },
  moderate: { label: 'Charge émotionnelle modérée', color: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Un niveau d\'inconfort qui mérite une attention bienveillante et des exercices de relaxation.' },
  moderately_severe: { label: 'Charge importante', color: 'text-orange-600 bg-orange-50 border-orange-200', desc: 'Un épisode exigeant. Votre spécialiste est là pour vous accompagner.' },
  severe: { label: 'Soutien prioritaire recommandé', color: 'text-rose-600 bg-rose-50 border-rose-200', desc: 'Votre bien-être est notre priorité absolue. N\'hésitez pas à solliciter de l\'aide dès maintenant.' },
}

export default function QuestionnairePage() {
  const navigate = useNavigate()

  const [history, setHistory] = useState<QuestionnaireResult[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Test mode: 'choice' | 'testing' | 'result'
  const [mode, setMode] = useState<'choice' | 'testing' | 'result'>('choice')
  const [kind, setKind] = useState<'phq9' | 'gad7'>('phq9')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [latestResult, setLatestResult] = useState<QuestionnaireResult | null>(null)

  useEffect(() => {
    loadPastResults()
  }, [])

  async function loadPastResults() {
    try {
      setLoadingHistory(true)
      const data = await getQuestionnaireResults()
      setHistory(data)
    } catch {
      // Ignore
    } finally {
      setLoadingHistory(false)
    }
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
      // Final submission
      setSubmitting(true)
      try {
        const reply = await submitQuestionnaire(kind, nextAnswers)
        setLatestResult(reply.result)
        setHistory((prev) => [reply.result, ...prev])

        if (reply.crisis) {
          navigate('/patient/crisis', { state: { crisis: reply.crisis } })
          return
        }

        setMode('result')
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur lors de la validation.')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const questions = kind === 'phq9' ? phq9Questions : gad7Questions
  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100)

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 text-primary">
          <ClipboardCheck className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Bilan de Bien-Être</span>
        </div>
        <h1 className="font-serif mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Auto-évaluation clinique
        </h1>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Questionnaires validés scientifiquement (PHQ-9 et GAD-7) pour suivre votre évolution sans aucun jugement.
        </p>
      </div>

      {/* MODE 1: Choice Screen */}
      {mode === 'choice' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3">
            <Card
              onClick={() => startTest('phq9')}
              className="cursor-pointer rounded-2xl border border-border/70 bg-card/80 p-5 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    9 questions · ~3 min
                  </span>
                  <h3 className="font-serif mt-2 text-lg font-semibold text-foreground">Échelle PHQ-9 (Humeur & Énergie)</h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Évalue votre niveau de vitalité, de motivation et de moral au cours des deux dernières semaines.
                  </p>
                </div>
                <ArrowRight className="text-primary size-5 shrink-0" />
              </div>
            </Card>

            <Card
              onClick={() => startTest('gad7')}
              className="cursor-pointer rounded-2xl border border-border/70 bg-card/80 p-5 transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                    7 questions · ~2 min
                  </span>
                  <h3 className="font-serif mt-2 text-lg font-semibold text-foreground">Échelle GAD-7 (Anxiété & Sérénité)</h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                    Mesure l'intensité du stress, de la nervosité et des tensions intérieures récentes.
                  </p>
                </div>
                <ArrowRight className="text-teal-600 size-5 shrink-0" />
              </div>
            </Card>
          </div>

          {/* Past Results */}
          <div className="mt-3">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
              <History className="size-4 text-primary" />
              <span>Vos bilans précédents</span>
            </div>

            {loadingHistory ? (
              <p className="text-muted-foreground text-xs">Chargement...</p>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground rounded-2xl border border-dashed p-4 text-center text-xs">
                Aucun bilan enregistré. Choisissez un questionnaire ci-dessus pour débuter !
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.slice(0, 5).map((item) => {
                  const sInfo = severityLabels[item.severity]
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border bg-card p-3 text-xs"
                    >
                      <div>
                        <span className="font-semibold uppercase text-primary text-[10px]">
                          {item.kind.toUpperCase()}
                        </span>
                        <p className="text-muted-foreground text-[11px]">
                          {new Date(item.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-medium', sInfo.color)}>
                          {sInfo.label}
                        </span>
                        <p className="text-muted-foreground text-[10px] mt-0.5">Score : {item.score} pts</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Taking the test (One question at a time) */}
      {mode === 'testing' && (
        <div className="flex flex-col gap-5">
          {/* Progress Indicator */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Question {currentIdx + 1} sur {questions.length}
              </span>
              <span className="text-primary font-semibold">{progressPercent}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="rounded-3xl border-border/70 bg-card p-6 shadow-sm">
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Ces 2 dernières semaines :</span>
            <h2 className="font-serif mt-2 text-xl font-semibold leading-relaxed text-foreground">
              {questions[currentIdx]}
            </h2>
          </Card>

          {/* Answers */}
          <div className="flex flex-col gap-2.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={submitting}
                onClick={() => void handleOptionSelect(opt.value)}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/90 p-4 text-left transition-all hover:border-primary hover:bg-primary/5 hover:scale-[1.01]"
              >
                <div>
                  <p className="font-medium text-sm text-foreground">{opt.label}</p>
                  <p className="text-muted-foreground text-xs">{opt.desc}</p>
                </div>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/60 text-xs text-muted-foreground font-semibold">
                  {opt.value}
                </div>
              </button>
            ))}
          </div>

          {/* Back button */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                if (currentIdx > 0) setCurrentIdx((prev) => prev - 1)
                else setMode('choice')
              }}
            >
              <ArrowLeft className="mr-1 size-4" /> {currentIdx > 0 ? 'Question précédente' : 'Annuler'}
            </Button>
          </div>
        </div>
      )}

      {/* MODE 3: Results Display */}
      {mode === 'result' && latestResult && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 className="size-8" />
          </div>

          <div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase">
              Bilan {latestResult.kind.toUpperCase()} complété
            </span>
            <h2 className="font-serif mt-3 text-2xl font-bold text-foreground">
              {severityLabels[latestResult.severity].label}
            </h2>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed max-w-xs mx-auto">
              {severityLabels[latestResult.severity].desc}
            </p>
          </div>

          <div className="w-full rounded-2xl border border-border/60 bg-card p-4 text-xs text-muted-foreground leading-relaxed">
            <ShieldCheck className="mx-auto mb-1.5 size-5 text-primary" />
            <p>
              Ce bilan constitue un indicateur indicatif pour votre suivi. Il ne remplace pas une consultation et ne pose aucun diagnostic.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full rounded-2xl shadow-md"
            onClick={() => setMode('choice')}
          >
            <RotateCcw className="mr-2 size-4" /> Retour aux bilans
          </Button>
        </div>
      )}
    </div>
  )
}
