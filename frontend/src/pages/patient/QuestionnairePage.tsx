// A OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'
import { getQuestionnaireResults } from '@/api'

export default function QuestionnairePage() {
  return (
    <Placeholder
      owner="A"
      title="PHQ-9 / GAD-7 check-up"
      file="frontend/src/pages/patient/QuestionnairePage.tsx"
      todo={[
        "Choose PHQ-9 (9 questions) or GAD-7 (7 questions); answers 0..3 each (\"Not at all\" ... \"Nearly every day\")",
        "Show one question at a time with a progress bar",
        "Submit, then show score + severity in calm words (no diagnosis!)",
        "If reply.crisis: go to the crisis screen",
        "Show past results as a small list or chart",
      ]}
      apis={[
        "submitQuestionnaire(kind, answers): Promise<QuestionnaireReply>",
        "getQuestionnaireResults(): Promise<QuestionnaireResult[]>",
      ]}
      preview={() => getQuestionnaireResults()}
    />
  )
}
