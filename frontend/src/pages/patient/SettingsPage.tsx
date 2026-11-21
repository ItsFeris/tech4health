// A OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'
import { getAppointments } from '@/api'

export default function SettingsPage() {
  return (
    <Placeholder
      owner="A"
      title="Settings"
      file="frontend/src/pages/patient/SettingsPage.tsx"
      todo={[
        "Show nickname and language",
        "Change consent (summary_only / full_chat) with a clear explanation",
        "Show next appointments",
      ]}
      apis={[
        "useAuth().me",
        "updateConsent(consent): Promise<Me>",
        "getAppointments(): Promise<Appointment[]>",
      ]}
      preview={() => getAppointments()}
    />
  )
}
