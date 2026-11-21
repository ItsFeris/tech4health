import type { Crisis } from '@/types/contract'

/** Placeholder crisis payload. Real wording comes from B's content files via the backend. */
export const crisis: Crisis = {
  title: "You're not alone",
  body: 'Your specialist has been notified right now. If you are in danger, call emergency services. Stay with us — let\'s breathe together for a moment.',
  actions: [
    { label: 'Call emergency services', kind: 'call' },
    { label: 'Alert my specialist again', kind: 'sos' },
    { label: 'Breathe with me', kind: 'breathing' },
  ],
}
