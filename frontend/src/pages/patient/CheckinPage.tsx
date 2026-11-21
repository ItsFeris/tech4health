// A OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'
import { getCheckins } from '@/api'

export default function CheckinPage() {
  return (
    <Placeholder
      owner="A"
      title="Daily check-in"
      file="frontend/src/pages/patient/CheckinPage.tsx"
      todo={[
        "Mood picker 1..5 (faces or emojis), optional note",
        "After sending show reply.ai_reply",
        "If reply.crisis: go to the crisis screen (same as chat)",
        "Show the last 7 check-ins as a small row of moods",
      ]}
      apis={[
        "sendCheckin(mood, note?): Promise<CheckinReply>",
        "getCheckins(): Promise<Checkin[]>",
      ]}
      preview={() => getCheckins()}
    />
  )
}
