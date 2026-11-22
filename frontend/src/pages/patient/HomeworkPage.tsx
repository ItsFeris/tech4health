import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react'
import { getHomework, updateHomework } from '@/api'
import type { Homework } from '@/types/contract'
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
}

export default function HomeworkPage() {
  const [items, setItems] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await getHomework()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger vos exercices.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function toggleDone(item: Homework) {
    const nextDone = !item.done
    setItems((prev) => prev.map((h) => (h.id === item.id ? { ...h, done: nextDone } : h)))
    try {
      await updateHomework(item.id, { done: nextDone })
    } catch {
      setItems((prev) => prev.map((h) => (h.id === item.id ? { ...h, done: item.done } : h)))
    }
  }

  const doneCount = items.filter((h) => h.done).length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const filteredItems = items.filter((h) => {
    if (filter === 'pending') return !h.done
    if (filter === 'done') return h.done
    return true
  })

  return (
    <div className="flex flex-col px-5 pt-5 pb-8" style={{ backgroundColor: C.bg, minHeight: '100%', fontFamily: 'sans-serif' }}>

      {/* Header landscape card */}
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
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: C.sageMid }}
          >
            Devoirs Thérapeutiques
          </span>
          <h1
            className="mt-1.5 text-2xl font-bold leading-snug"
            style={{ color: C.cream, fontFamily: 'Georgia, serif' }}
          >
            Vos exercices<br />de la semaine
          </h1>
          <p className="mt-1 text-xs" style={{ color: C.sageMid }}>
            Petites étapes pour renforcer votre bien-être.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div
          className="mb-5 rounded-2xl p-4"
          style={{ backgroundColor: C.cream, border: `1px solid ${C.sageLight}` }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold" style={{ color: C.dark }}>Progression</span>
            <span className="font-bold" style={{ color: C.sage }}>
              {doneCount} / {totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: C.sageLight }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, backgroundColor: C.dark }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
      )}

      {/* Filter tabs */}
      <div
        className="mb-4 flex items-center gap-1 rounded-2xl p-1"
        style={{ backgroundColor: C.sageLight }}
      >
        {(['all', 'pending', 'done'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="flex-1 rounded-xl py-2 text-xs font-semibold transition-all"
            style={
              filter === f
                ? { backgroundColor: C.dark, color: C.cream }
                : { backgroundColor: 'transparent', color: C.muted }
            }
          >
            {f === 'all' ? `Tous (${totalCount})` : f === 'pending' ? `À faire (${totalCount - doneCount})` : `Terminés (${doneCount})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-xs" style={{ color: C.muted }}>
          Chargement de vos exercices...
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="flex flex-col items-center rounded-3xl border-2 border-dashed p-8 text-center"
          style={{ borderColor: C.sageMid }}
        >
          <div
            className="mb-3 flex size-12 items-center justify-center rounded-full"
            style={{ backgroundColor: C.sageLight }}
          >
            <Sparkles className="size-6" style={{ color: C.dark }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: C.dark, fontFamily: 'Georgia, serif' }}>
            Aucun exercice pour le moment
          </p>
          <p className="mt-1 text-xs" style={{ color: C.muted }}>
            Prenez soin de vous et reposez-vous cette semaine.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => void toggleDone(item)}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition-all hover:scale-[1.01]',
              )}
              style={{
                borderColor: item.done ? C.sageMid : C.sageLight,
                backgroundColor: item.done ? C.sageLight : C.cream,
                opacity: item.done ? 0.8 : 1,
              }}
            >
              <div className="mt-0.5 shrink-0">
                {item.done ? (
                  <CheckCircle2 className="size-5" style={{ color: C.dark }} />
                ) : (
                  <Circle className="size-5" style={{ color: C.sageMid }} />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h3
                  className={cn('text-sm font-semibold leading-snug', item.done && 'line-through')}
                  style={{ color: item.done ? C.muted : C.dark, fontFamily: 'Georgia, serif' }}
                >
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                    {item.description}
                  </p>
                )}
                {item.due_date && (
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: C.muted }}>
                    <Clock className="size-3" />
                    <span>
                      Pour le{' '}
                      {new Date(item.due_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
