import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Clock, ListChecks, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getHomework, updateHomework } from '@/api'
import type { Homework } from '@/types/contract'
import { cn } from '@/lib/utils'

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
    // Optimistic UI update
    setItems((prev) => prev.map((h) => (h.id === item.id ? { ...h, done: nextDone } : h)))
    try {
      await updateHomework(item.id, { done: nextDone })
    } catch {
      // Revert on failure
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
    <div className="flex flex-col gap-5 p-4">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 text-primary">
          <ListChecks className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Devoirs Thérapeutiques</span>
        </div>
        <h1 className="font-serif mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Vos exercices de la semaine
        </h1>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Petites étapes suggérées par votre spécialiste pour renforcer votre bien-être au quotidien.
        </p>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-4 rounded-2xl bg-card/70 p-3 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Progression</span>
              <span className="text-primary font-semibold">{doneCount} / {totalCount} terminés ({progressPercent}%)</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-2xl p-3 text-xs">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn(
            'flex-1 rounded-xl py-1.5 text-xs font-medium transition-all',
            filter === 'all' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Tous ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={cn(
            'flex-1 rounded-xl py-1.5 text-xs font-medium transition-all',
            filter === 'pending' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          À faire ({totalCount - doneCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('done')}
          className={cn(
            'flex-1 rounded-xl py-1.5 text-xs font-medium transition-all',
            filter === 'done' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Terminés ({doneCount})
        </button>
      </div>

      {/* Homework List */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
          Chargement de vos exercices...
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-border/70 bg-card/40 p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <p className="mt-3 font-medium text-sm text-foreground">Aucun exercice pour le moment</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Prenez soin de vous et reposez-vous cette semaine.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              onClick={() => void toggleDone(item)}
              className={cn(
                'cursor-pointer rounded-2xl border transition-all duration-200 hover:shadow-sm',
                item.done
                  ? 'border-emerald-200/60 bg-emerald-50/30 opacity-75 dark:border-emerald-950 dark:bg-emerald-950/20'
                  : 'border-border/60 bg-card/80 hover:border-primary/50'
              )}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <button
                  type="button"
                  aria-label={item.done ? 'Marquer comme non fait' : 'Marquer comme fait'}
                  className="mt-0.5 shrink-0 text-primary transition-transform hover:scale-110"
                >
                  {item.done ? (
                    <CheckCircle2 className="size-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/60" />
                  )}
                </button>
                <div className="flex-1 space-y-1">
                  <h3
                    className={cn(
                      'font-medium text-sm text-foreground leading-snug',
                      item.done && 'line-through text-muted-foreground'
                    )}
                  >
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  {item.due_date && (
                    <div className="mt-2 flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <Clock className="size-3 text-primary" />
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
