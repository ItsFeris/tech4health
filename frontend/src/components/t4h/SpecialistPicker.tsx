/** Filters + list of verified specialists to pick from (onboarding step 3 and /patient/choose-specialist). */
import { useEffect, useState } from 'react'
import { listSpecialists } from '@/api'
import type { SpecialistCard } from '@/types/contract'
import { cn } from '@/lib/utils'
import { Notice, Skeleton } from './kit'
import { SpecialistChoice } from './specialist'

const FILTERS: { id: string; label: string; test: (c: SpecialistCard) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'anxiety', label: 'Anxiety', test: (c) => /anxi|stress|panic/i.test(`${c.bio} ${c.specialty}`) },
  { id: 'mood', label: 'Low mood', test: (c) => /depress|grief|mood|bipolar/i.test(`${c.bio} ${c.specialty}`) },
  { id: 'students', label: 'Students', test: (c) => /student|exam|young/i.test(`${c.bio} ${c.specialty}`) },
  { id: 'budget', label: 'Under 60 DT', test: (c) => c.price != null && c.price < 60 },
]

type Props = {
  value: SpecialistCard | null
  onChange: (card: SpecialistCard | null) => void
  /** Hide this specialist (e.g. the one the patient just left). */
  exclude?: string | null
  /** Text when nobody is listed or the list fails to load. */
  emptyHint?: string
}

export function SpecialistPicker({ value, onChange, exclude, emptyHint = "Continue: we'll match you with one." }: Props) {
  const [list, setList] = useState<SpecialistCard[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let alive = true
    listSpecialists()
      .then((all) => {
        if (!alive) return
        const usable = all.filter((c) => c.id !== exclude)
        setList(usable)
        if (!value && usable[0]) onChange(usable[0])
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
    // Load once; `value`/`onChange` only matter for the first auto-pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exclude])

  const shown = (list ?? []).filter(FILTERS.find((f) => f.id === filter)!.test)

  return (
    <>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 lg:justify-center" role="group" aria-label="Filter">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn('h-10 shrink-0 rounded-full px-4 text-[14px] transition', filter === f.id ? 'bg-ink text-white' : 'bg-white text-ink shadow-[0_6px_16px_rgba(40,30,70,.07)]')}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Specialists" className="flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
        {list === null && !failed && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[150px] rounded-[26px]" />)}
        {failed && <Notice tone="error">Could not load the specialists. {emptyHint}</Notice>}
        {list?.length === 0 && <Notice tone="info">No specialists are listed yet. {emptyHint}</Notice>}
        {shown.map((c) => (
          <SpecialistChoice key={c.id} card={c} on={c.id === value?.id} onPick={() => onChange(c)} />
        ))}
        {list && list.length > 0 && shown.length === 0 && <p className="py-6 text-center text-[14px] text-sub">No one matches this filter.</p>}
      </div>
      <p className="text-center text-[12.5px] text-sub">Every specialist here checked their ID and license with us.</p>
    </>
  )
}
