// A OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'

export default function SosPage() {
  return (
    <Placeholder
      owner="A"
      title="SOS"
      file="frontend/src/pages/patient/SosPage.tsx"
      todo={[
        "Opened by the red SOS button in the header",
        "Big calm confirm button: \"Alert my specialist now\"",
        "On confirm call sendSos(), then navigate(\"/patient/crisis\", { state: { crisis: reply.crisis } })",
        "Cancel goes back",
      ]}
      apis={[
        "sendSos(): Promise<SosReply>",
      ]}
    />
  )
}
