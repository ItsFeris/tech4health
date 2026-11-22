/** Specialist pieces (v1.4): illustrated portrait, photo, Verified badge, the card patients choose from. */
import { Check } from 'lucide-react'
import type { Lang, SpecialistCard } from '@/types/contract'
import { cn } from '@/lib/utils'

const LONG = 'M62 98c0-40 16-64 38-64s38 24 38 64v56c-10 6-20 7-26 4V104H88v54c-6 3-16 2-26-4z'
const LONGF = 'M66 90c2-26 16-42 34-42s32 16 34 42c-14-4-26-14-30-24-6 12-20 20-38 24z'
const SHORT = 'M66 88c0-30 14-46 34-46s34 16 34 46c-6-14-18-20-34-20s-28 6-34 20z'
const HIJAB = 'M54 100c0-42 20-66 46-66s46 24 46 66v44c0 16-22 28-46 28s-46-12-46-28z'
const HIJABF = 'M64 86c4-24 18-38 36-38s32 14 36 38c-10-10-22-14-36-14s-26 4-36 14z'
const CURLY = 'M58 104c-8-20 2-42 14-50 6-16 22-22 34-18 16-2 30 10 32 24 12 10 14 30 6 44-4-10-6-22-10-30-14 2-40 2-60-6-6 10-10 24-16 36z'
const BEARD = 'M70 104c2 22 14 34 30 34s28-12 30-34c-6 10-16 14-30 14s-24-4-30-14z'

type Look = { bg: string; col: string; skin: string; hair: string; cloth: string; back: string; front: string; beard: string }
const LOOKS: Look[] = [
  { bg: 'linear-gradient(160deg, #DDD8FF 0%, #ECE4F8 100%)', col: '#6A5BBE', skin: '#E8B896', hair: '#3B2A22', cloth: '#7A69C8', back: LONG, front: LONGF, beard: '' },
  { bg: 'linear-gradient(160deg, #CBECF5 0%, #D9F0EA 100%)', col: '#2F7889', skin: '#C98E6B', hair: '#2B2320', cloth: '#2F7889', back: '', front: SHORT, beard: BEARD },
  { bg: 'linear-gradient(160deg, #F9E4BB 0%, #FBD7C8 100%)', col: '#A35A2A', skin: '#D9A27E', hair: '#C9806A', cloth: '#A35A2A', back: HIJAB, front: HIJABF, beard: '' },
  { bg: 'linear-gradient(160deg, #E4F2F9 0%, #D4EAF0 100%)', col: '#3F6FA8', skin: '#B97A57', hair: '#1E1A18', cloth: '#4F7FB8', back: '', front: SHORT, beard: '' },
  { bg: 'linear-gradient(160deg, #FBD7C8 0%, #F6CDDB 100%)', col: '#A63E63', skin: '#EDC4A2', hair: '#5A3A28', cloth: '#C46A8A', back: CURLY, front: '', beard: '' },
]

/** Same look for the same person everywhere (picked from the id). */
export function lookOf(id: string): Look {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return LOOKS[h % LOOKS.length]
}

export const LANG_LABEL: Record<Lang, string> = { darija: 'Tounsi', fr: 'Français', ar: 'العربية', en: 'English' }

/** "Dr. Salma Trabelsi" -> "Dr. Salma", "Leila Mabrouk" -> "Leila" */
export function shortName(nickname: string): string {
  const w = nickname.trim().split(/\s+/)
  return /^dr\.?$/i.test(w[0]) && w[1] ? `${w[0]} ${w[1]}` : w[0]
}

export function Portrait({ id, size = 120, className }: { id: string; size?: number; className?: string }) {
  const l = lookOf(id)
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className={className}>
      {l.back && <path d={l.back} fill={l.hair} />}
      <path d="M30 200c6-40 36-62 70-62s64 22 70 62z" fill={l.cloth} />
      <rect x="88" y="118" width="24" height="26" rx="10" fill={l.skin} />
      <ellipse cx="100" cy="94" rx="33" ry="39" fill={l.skin} />
      {l.front && <path d={l.front} fill={l.hair} />}
      {l.beard && <path d={l.beard} fill={l.hair} opacity=".9" />}
      <path d="M84 96q5-4 10 0M106 96q5-4 10 0" stroke="#2A1D17" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M91 112q9 7 18 0" stroke="#7A3B2E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="80" cy="108" rx="7" ry="4" fill="#E58F7A" opacity=".35" />
      <ellipse cx="120" cy="108" rx="7" ry="4" fill="#E58F7A" opacity=".35" />
    </svg>
  )
}

/** Round photo: the uploaded one, else the illustrated portrait. */
export function SpecialistPhoto({ id, photoUrl, name, size = 56, className }: { id: string; photoUrl?: string | null; name: string; size?: number; className?: string }) {
  return (
    <span className={cn('relative inline-flex shrink-0 items-end justify-center overflow-hidden rounded-full', className)} style={{ width: size, height: size, background: lookOf(id).bg }}>
      {photoUrl ? <img src={photoUrl} alt={`Photo of ${name}`} className="size-full object-cover" /> : <Portrait id={id} size={size * 1.05} />}
    </span>
  )
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-7 items-center gap-1.5 rounded-full bg-[#E3F4EA] px-2.5 text-[12px] text-[#1C6B45]', className)}>
      <Check className="size-3" strokeWidth={3.5} /> Verified
    </span>
  )
}

/** The card a patient picks in onboarding (design D00). */
export function SpecialistChoice({ card, on, onPick }: { card: SpecialistCard; on: boolean; onPick: () => void }) {
  const l = lookOf(card.id)
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onPick}
      className={cn(
        'flex w-full overflow-hidden rounded-[26px] bg-white text-start transition',
        on ? 'shadow-[0_0_0_2px_#111113,0_16px_40px_rgba(40,30,70,.12)]' : 'shadow-[0_10px_30px_rgba(40,30,70,.06)]',
      )}
    >
      <span className="relative flex w-[112px] shrink-0 items-end justify-center overflow-hidden" style={{ background: l.bg }}>
        <span aria-hidden="true" className="absolute -right-5 -top-5 size-16 rotate-45 rounded-[100%_0_100%_0] bg-white/40" />
        {card.photo_url ? <img src={card.photo_url} alt="" className="size-full object-cover" /> : <Portrait id={card.id} size={112} className="relative" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 p-3.5">
        <span className="flex items-start justify-between gap-2">
          <span className="text-[17px] leading-tight tracking-[-0.3px]">
            {card.nickname}
            <span className="block text-[14px]" style={{ color: l.col }}>
              {card.specialty ?? 'Specialist'}
            </span>
          </span>
          {card.verified && <VerifiedBadge className="h-6 shrink-0 px-2 text-[11px]" />}
        </span>
        {card.bio && <span className="line-clamp-2 text-[12.5px] leading-snug text-ink-2">{card.bio}</span>}
        <span className="text-[12px] text-sub">
          {card.languages.map((x, i) => (
            <span key={x}>
              {i > 0 && ', '}
              <bdi>{LANG_LABEL[x]}</bdi>
            </span>
          ))}
          {card.years != null && ` · ${card.years} years`}
        </span>
        <span className="mt-auto flex items-end justify-between pt-1">
          {card.price != null ? (
            <span>
              <span className="text-[24px] font-light leading-none tracking-[-1px]">{card.price}</span> <span className="text-[12px]">DT</span>
              <span className="block text-[11px] text-sub">per 50-min session</span>
            </span>
          ) : (
            <span />
          )}
          <span className={cn('inline-flex h-9 items-center rounded-full px-3.5 text-[13px]', on ? 'bg-ink text-white' : 'border border-line bg-white')}>{on ? 'Chosen' : 'Choose'}</span>
        </span>
      </span>
    </button>
  )
}
