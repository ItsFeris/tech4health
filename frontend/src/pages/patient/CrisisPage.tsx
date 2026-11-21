// A OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'

export default function CrisisPage() {
  return (
    <Placeholder
      owner="A"
      title="Crisis screen"
      file="frontend/src/pages/patient/CrisisPage.tsx"
      todo={[
        "Read the crisis payload: const crisis = (useLocation().state as { crisis?: Crisis } | null)?.crisis",
        "Show crisis.title and crisis.body large and calm",
        "One button per crisis.actions item: call -> tel: link (number comes from B content later), sos -> sendSos(), breathing -> simple breathing animation",
        "No other navigation distractions",
      ]}
      apis={[
        "sendSos(): Promise<SosReply>",
      ]}
    />
  )
}
