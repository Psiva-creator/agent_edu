import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import Loading from '../components/Loading'
import AnimatedBackground from '../components/ui/AnimatedBackground'
import Button from '../components/Button'
import { analyzeCareer, getRoadmap } from '../services/api'

function LoadingPage() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const processAnalysis = async () => {
      try {
        const stored = sessionStorage.getItem('careerFormData')
        const formData = stored ? JSON.parse(stored) : {
          name: 'User',
          current_role: 'Computer Science Student',
          target_role: 'Senior Software Engineer',
          skills: ['JavaScript', 'React', 'Python'],
          experience_years: 1,
          education: "Bachelor's",
          location: 'Bangalore, India',
        }

        const [careerData, roadmapData] = await Promise.all([
          analyzeCareer({
            name: formData.name || formData.current_role || 'User',
            current_role: formData.current_role,
            target_role: formData.target_role,
            skills: formData.skills || [],
            experience_years: formData.experience_years || 0,
            education: formData.education || null,
            location: formData.location || null,
          }),
          getRoadmap({
            current_role: formData.current_role,
            target_role: formData.target_role,
            skill_gaps: [],
            hours_per_week: 10,
            deadline_weeks: 10,
            skills: formData.skills || [],
          }),
        ])

        sessionStorage.setItem(
          'dashboardData',
          JSON.stringify({ career: careerData, roadmap: roadmapData, formData })
        )
        navigate('/dashboard')
      } catch (err) {
        console.error('Analysis failed:', err)
        setError('Something went wrong. Please try again.')
      }
    }

    processAnalysis()
  }, [navigate])

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden flex items-center justify-center">
      <AnimatedBackground variant="loading" />

      <div className="relative z-10 w-full">
        {error ? (
          <motion.div
            className="text-center space-y-5 px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 flex items-center justify-center">
              <span className="text-3xl" role="img" aria-label="Error">😞</span>
            </div>
            <p className="text-rose-400 font-medium" role="alert">{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </Button>
          </motion.div>
        ) : (
          <Loading />
        )}
      </div>
    </div>
  )
}

export default LoadingPage
