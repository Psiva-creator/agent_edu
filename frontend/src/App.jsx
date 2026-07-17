import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import DashboardPage from './pages/DashboardPage'
import AuthPage from './pages/AuthPage'
import { CareerMemoryProvider } from './context/CareerMemoryContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CareerMemoryProvider>
          <Router>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Landing page — standalone (no sidebar) */}
              <Route path="/" element={<LandingPage />} />

              {/* Analysis wizard — standalone (no sidebar) */}
              <Route path="/analyze" element={
                <ProtectedRoute>
                  <AnalyzePage />
                </ProtectedRoute>
              } />

              {/* Onboarding redirect mapped to analyze */}
              <Route path="/onboarding" element={<Navigate to="/analyze" replace />} />

              {/* Authentication */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Dashboard — uses sidebar layout */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="/dashboard/:tab" element={<DashboardPage />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </Router>
      </CareerMemoryProvider>
    </AuthProvider>
  </ThemeProvider>
  )
}

export default App
