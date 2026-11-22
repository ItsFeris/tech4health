/**
 * All routes. DHIA ONLY.
 * A and B: every screen you build already has a route here. Need a new one? Ask Dhia.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import { HomeRedirect, RequireRole } from '@/auth/RequireRole'
import { PatientLayout } from '@/components/layout/PatientLayout'
import { SpecialistLayout } from '@/components/layout/SpecialistLayout'
import LoginPage from '@/pages/LoginPage'

// A — patient app
import PatientOnboardingPage from '@/pages/patient/OnboardingPage'
import ChatPage from '@/pages/patient/ChatPage'
import CheckinPage from '@/pages/patient/CheckinPage'
import HomeworkPage from '@/pages/patient/HomeworkPage'
import QuestionnairePage from '@/pages/patient/QuestionnairePage'
import SosPage from '@/pages/patient/SosPage'
import CrisisPage from '@/pages/patient/CrisisPage'
import SettingsPage from '@/pages/patient/SettingsPage'

// B — specialist side
import SpecialistOnboardingPage from '@/pages/specialist/OnboardingPage'
import PatientsPage from '@/pages/specialist/PatientsPage'
import PatientDetailPage from '@/pages/specialist/PatientDetailPage'
import SummaryPage from '@/pages/specialist/SummaryPage'
import AlertsPage from '@/pages/specialist/AlertsPage'
import VerifyPage from '@/pages/specialist/VerifyPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/patient/onboarding" element={<PatientOnboardingPage />} />
          <Route element={<RequireRole role="patient" />}>
            <Route path="/patient/crisis" element={<CrisisPage />} />
            <Route path="/patient/sos" element={<SosPage />} />
            <Route path="/patient" element={<PatientLayout />}>
              <Route index element={<ChatPage />} />
              <Route path="checkin" element={<CheckinPage />} />
              <Route path="homework" element={<HomeworkPage />} />
              <Route path="questionnaire" element={<QuestionnairePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="/specialist/onboarding" element={<SpecialistOnboardingPage />} />
          <Route element={<RequireRole role="specialist" />}>
            <Route path="/specialist/verify" element={<VerifyPage />} />
            <Route path="/specialist" element={<SpecialistLayout />}>
              <Route index element={<PatientsPage />} />
              <Route path="patients/:patientId" element={<PatientDetailPage />} />
              <Route path="patients/:patientId/summary" element={<SummaryPage />} />
              <Route path="alerts" element={<AlertsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
