import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import CareerScoreEngine from './CareerScoreEngine'
import './OverviewPanel.css'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
}

export default function OverviewPanel({ data, formData }) {
  // Listen for navigate-tab events dispatched by CareerScoreEngine tip
  useEffect(() => {
    const handler = (e) => {
      if (e.detail === 'resume') {
        // Dispatch to DashboardPage tab system
        window.dispatchEvent(new CustomEvent('dashboard-navigate', { detail: 'resume' }))
      }
    }
    window.addEventListener('navigate-tab', handler)
    return () => window.removeEventListener('navigate-tab', handler)
  }, [])

  if (!data) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No analysis yet"
        description="Run a career analysis to see your overview dashboard."
        action={{ label: 'Start Analysis', href: '/analyze' }}
      />
    )
  }

  return (
    <div className="overview">
      <motion.div {...fadeUp}>
        <CareerScoreEngine />
      </motion.div>
    </div>
  )
}
