// B OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'

export default function OnboardingPage() {
  return (
    <Placeholder
      owner="B"
      title="Specialist onboarding"
      file="frontend/src/pages/specialist/OnboardingPage.tsx"
      todo={[
        "Shown once after a specialist signs up",
        "Ask: display name, language, specialty, short bio",
        "On submit call onboardSpecialist(...), then refresh() from useAuth(), then navigate to /specialist",
      ]}
      apis={[
        "onboardSpecialist(body: SpecialistOnboardingBody): Promise<Me>",
        "useAuth().refresh()",
      ]}
    />
  )
}
