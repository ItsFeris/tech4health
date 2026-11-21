// B OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'

export default function SummaryPage() {
  return (
    <Placeholder
      owner="B"
      title="Weekly summary"
      file="frontend/src/pages/specialist/SummaryPage.tsx"
      todo={[
        "Read the id: const { patientId } = useParams()",
        "Show the latest summary: mood trend + average, key events, homework done / not done, concerns, suggested topic for the next session",
        "Button \"Generate this week summary\" (takes a few seconds: show a spinner)",
      ]}
      apis={[
        "getSummaries(patientId): Promise<WeeklySummary[]>",
        "generateSummary(patientId, weekStart): Promise<WeeklySummary>",
      ]}
    />
  )
}
