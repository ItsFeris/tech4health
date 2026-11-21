import type { Alert } from '@/types/contract'
import { USE_MOCKS, mock, mockError, qs, request } from './client'
import { alerts as store } from '@/mocks/alerts'

/** GET /alerts (specialist) — newest first. Default: only open alerts. Pass null for all. */
export function getAlerts(status: Alert['status'] | null = 'open'): Promise<Alert[]> {
  if (USE_MOCKS) {
    const list = store.filter((a) => !status || a.status === status)
    return mock([...list].sort((a, b) => b.created_at.localeCompare(a.created_at)))
  }
  return request<Alert[]>('GET', `/alerts${qs({ status })}`)
}

/** PATCH /alerts/{id} (specialist) — e.g. updateAlert(id, 'seen') or 'false_alarm'. */
export function updateAlert(id: string, status: Alert['status']): Promise<Alert> {
  if (USE_MOCKS) {
    const a = store.find((x) => x.id === id)
    if (!a) return mockError('not_found', 'Alert not found', 404)
    a.status = status
    return mock(a)
  }
  return request<Alert>('PATCH', `/alerts/${id}`, { status })
}
