// B OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'
import { getAlerts } from '@/api'

export default function AlertsPage() {
  return (
    <Placeholder
      owner="B"
      title="Alerts inbox"
      file="frontend/src/pages/specialist/AlertsPage.tsx"
      todo={[
        "List open alerts, newest first: level badge, patient, reason, message excerpt, time",
        "Buttons: Seen / False alarm / Resolved",
        "New alerts arrive live: in mock mode a red alert appears ~20 s after opening the dashboard",
        "Explain each alert: which layer caught it (source) and why (reason)",
      ]}
      apis={[
        "getAlerts(): Promise<Alert[]>",
        "updateAlert(id, status): Promise<Alert>",
        "subscribeToAlerts(onAlert) inside useEffect (returns the cleanup function)",
      ]}
      preview={() => getAlerts()}
    />
  )
}
