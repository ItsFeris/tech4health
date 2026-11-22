/** Date / mood helpers shared by every screen. Dhia owns this file; everyone can import it. */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const toDate = (d: string | Date) => (d instanceof Date ? d : new Date(d.length === 10 ? d + 'T12:00:00' : d))

/** "Mon 23 Nov" */
export function dayLabel(d: string | Date): string {
  const x = toDate(d)
  return `${DAYS[x.getDay()]} ${x.getDate()} ${MONTHS[x.getMonth()]}`
}

/** "Sunday, 22 Nov" */
export function longDay(d: string | Date = new Date()): string {
  const x = toDate(d)
  return `${DAYS_LONG[x.getDay()]}, ${x.getDate()} ${MONTHS[x.getMonth()]}`
}

/** "Mon" */
export function weekday(d: string | Date): string {
  return DAYS[toDate(d).getDay()]
}

/** "16:00" */
export function timeLabel(d: string | Date): string {
  const x = toDate(d)
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
}

/** "Today 02:57", "Yesterday 21:10" or "Sat 21 Nov · 18:05" */
export function whenLabel(d: string | Date): string {
  const x = toDate(d)
  const today = new Date()
  const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(x.toDateString()).getTime()) / 864e5)
  if (diff === 0) return `Today ${timeLabel(x)}`
  if (diff === 1) return `Yesterday ${timeLabel(x)}`
  return `${dayLabel(x)} · ${timeLabel(x)}`
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function partOfDay(now = new Date()): string {
  const h = now.getHours()
  return h < 5 || h >= 18 ? 'tonight' : 'today'
}

export const MOOD_WORDS = ['', 'Very low', 'Low', 'Okay', 'Good', 'Great'] as const

export function moodWord(m: number | null | undefined): string {
  return m ? MOOD_WORDS[Math.round(m)] ?? '' : '–'
}

/** Monday of the week containing `d`, as YYYY-MM-DD (local time). */
export function mondayOf(d = new Date()): string {
  const x = new Date(d)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export function initials(name: string): string {
  const parts = name.replace(/^dr\.?\s+/i, '').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function avg(nums: (number | null | undefined)[]): number | null {
  const v = nums.filter((n): n is number => typeof n === 'number')
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null
}
