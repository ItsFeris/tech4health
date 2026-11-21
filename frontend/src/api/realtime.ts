/**
 * Live alerts for the specialist dashboard. DHIA ONLY.
 * Usage in a page:  useEffect(() => subscribeToAlerts((a) => ...), [])   // returns the unsubscribe function
 */
import type { Alert } from '@/types/contract'
import { USE_MOCKS } from './client'
import { alerts as store, liveRedAlert } from '@/mocks/alerts'
import { supabase } from '@/lib/supabase'
import { getAlerts } from './alerts'

export function subscribeToAlerts(onAlert: (alert: Alert) => void): () => void {
  if (USE_MOCKS) {
    // Simulate one red alert arriving 20 s after the dashboard opens.
    const t = setTimeout(() => {
      const alert = { ...liveRedAlert, created_at: new Date().toISOString() }
      if (!store.some((a) => a.id === alert.id)) store.unshift(alert)
      onAlert(alert)
    }, 20_000)
    return () => clearTimeout(t)
  }
  if (!supabase) return () => {}
  // Supabase sends the raw row; refetch through the API so the payload matches the Alert type (adds patient_nickname, excerpt).
  const channel = supabase
    .channel('alerts-feed')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, async (payload) => {
      const id = (payload.new as { id: string }).id
      const open = await getAlerts('open')
      const alert = open.find((a) => a.id === id)
      if (alert) onAlert(alert)
    })
    .subscribe()
  return () => {
    void supabase?.removeChannel(channel)
  }
}
