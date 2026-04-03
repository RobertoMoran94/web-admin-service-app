import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }           from './hooks/useAuth'
import { FeatureFlagsProvider }   from './hooks/useFeatureFlags'
import ProtectedRoute          from './components/ProtectedRoute'
import Layout                  from './components/Layout'
import LoginPage               from './pages/LoginPage'
import OverviewPage            from './pages/OverviewPage'
import CalendarPage            from './pages/CalendarPage'
import ServicesPage            from './pages/ServicesPage'
import TeamPage                from './pages/TeamPage'
import BusinessProfilePage     from './pages/BusinessProfilePage'
import UsersPage               from './pages/UsersPage'
import BusinessPage            from './pages/BusinessPage'

function DashboardRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="overview" element={<OverviewPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="team"     element={<TeamPage />} />
        <Route path="profile"  element={<BusinessProfilePage />} />
        <Route path="business" element={<BusinessPage />} />
        <Route path="users"    element={<UsersPage />} />
        <Route path="*"        element={<Navigate to="/overview" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <FeatureFlagsProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardRoutes />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </FeatureFlagsProvider>
    </BrowserRouter>
  )
}
