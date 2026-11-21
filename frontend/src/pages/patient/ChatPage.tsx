// A OWNS THIS FILE. Replace everything below with the real screen (see AGENTS.md).
import { Placeholder } from '@/components/Placeholder'
import { getChatHistory } from '@/api'

export default function ChatPage() {
  return (
    <Placeholder
      owner="A"
      title="Chat with the AI companion"
      file="frontend/src/pages/patient/ChatPage.tsx"
      todo={[
        "Patient home screen: chat bubbles (user right, AI left), input + send button at the bottom",
        "Load history on open, append both messages after sending",
        "While waiting: typing indicator",
        "If reply.crisis is not null: navigate(\"/patient/crisis\", { state: { crisis: reply.crisis } })",
        "If reply.urgent_appointment: show a calm banner \"Your specialist will see you on ...\"",
        "Try typing \"ma3adch nheb n3ich\" in mock mode to test the crisis path",
      ]}
      apis={[
        "getChatHistory(): Promise<Message[]>",
        "sendChat(content): Promise<ChatReply>",
        "getAppointments(): Promise<Appointment[]> (next session card)",
      ]}
      preview={() => getChatHistory()}
    />
  )
}
