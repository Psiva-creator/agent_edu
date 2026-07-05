import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import StudentFormPage from './pages/StudentFormPage'
import LoadingPage from './pages/LoadingPage'
import Dashboard from './pages/Dashboard'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<StudentFormPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={
          <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-center px-4">
            <p className="text-8xl font-bold gradient-text font-display mb-4">404</p>
            <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
            <p className="text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
            <Link to="/" className="text-accent-400 hover:text-accent-300 underline transition-colors">
              ← Go back home
            </Link>
          </div>
        } />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  )
}

export default App
