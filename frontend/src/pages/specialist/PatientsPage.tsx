// B OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'
import { getPatients } from '@/api'

export default function PatientsPage() {
  return (
    <Placeholder
      owner="B"
      title="My patients"
      file="frontend/src/pages/specialist/PatientsPage.tsx"
      todo={[
        "Table or cards: nickname, risk badge (red / orange / green), open alerts, last mood, 7-day mood sparkline, next appointment",
        "Already sorted red first",
        "Click a patient -> /specialist/patients/:patientId",
      ]}
      apis={[
        "getPatients(): Promise<PatientRow[]>",
      ]}
      preview={() => getPatients()}
    />
  )
}
