// A OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'
import { getHomework } from '@/api'

export default function HomeworkPage() {
  return (
    <Placeholder
      owner="A"
      title="Homework from my specialist"
      file="frontend/src/pages/patient/HomeworkPage.tsx"
      todo={[
        "List of homework with title, description, due date",
        "Checkbox to mark done / not done",
        "Empty state: \"No homework this week\"",
      ]}
      apis={[
        "getHomework(): Promise<Homework[]>",
        "updateHomework(id, { done }): Promise<Homework>",
      ]}
      preview={() => getHomework()}
    />
  )
}
