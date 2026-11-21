// B OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'

export default function PatientDetailPage() {
  return (
    <Placeholder
      owner="B"
      title="Patient detail"
      file="frontend/src/pages/specialist/PatientDetailPage.tsx"
      todo={[
        "Read the id: const { patientId } = useParams()",
        "Mood chart of recent check-ins",
        "Homework list + form to assign new homework",
        "Upcoming appointments + button to add a session",
        "Link to the weekly summary page",
        "Chat history only if the patient gave full_chat consent (the API returns 403 otherwise: show a friendly note)",
      ]}
      apis={[
        "getCheckins(patientId): Promise<Checkin[]>",
        "getHomework(patientId) / createHomework(body)",
        "getAppointments() / createAppointment(body) / saveSessionNote(id, body)",
        "getQuestionnaireResults(patientId)",
        "getChatHistory(patientId)",
      ]}
    />
  )
}
