import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/layout/AppLayout'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import DashboardPage from './pages/DashboardPage'
import { CareerMemoryProvider } from './context/CareerMemoryContext'

function App() {
  return (
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
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/:tab" element={<DashboardPage />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </Router>
    </CareerMemoryProvider>
  )
}

export default App
