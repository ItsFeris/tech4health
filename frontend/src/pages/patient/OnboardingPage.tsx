// A OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'

export default function OnboardingPage() {
  return (
    <Placeholder
      owner="A"
      title="Patient onboarding"
      file="frontend/src/pages/patient/OnboardingPage.tsx"
      todo={[
        "Shown once after sign-up, before anything else",
        "Ask: nickname (not real name), language (darija / ar / fr / en), consent (summary_only or full_chat, explained in plain words, including that an alert excerpt is always shared for safety), optional emergency contact name + email",
        "On submit call onboardPatient(...), then refresh() from useAuth(), then navigate to /patient",
      ]}
      apis={[
        "onboardPatient(body: PatientOnboardingBody): Promise<Me>",
        "useAuth().refresh()",
      ]}
    />
  )
}
