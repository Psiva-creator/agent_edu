import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import DashboardPage from './pages/DashboardPage'
import { CareerMemoryProvider } from './context/CareerMemoryContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <CareerMemoryProvider>
        <Router>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Landing page — standalone (no sidebar) */}
              <Route path="/" element={<LandingPage />} />

              {/* Analysis wizard — standalone (no sidebar) */}
              <Route path="/analyze" element={<AnalyzePage />} />

              {/* Dashboard — uses sidebar layout */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="/dashboard/:tab" element={<DashboardPage />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </Router>
      </CareerMemoryProvider>
    </ThemeProvider>
  )
}

export default App
