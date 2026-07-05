import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Zap, Bot, Lock } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StudentForm from '../components/StudentForm'
import AnimatedBackground from '../components/ui/AnimatedBackground'
import PageTransition from '../components/ui/PageTransition'
import Container from '../components/ui/Container'

function StudentFormPage() {
  const navigate = useNavigate()

  const handleSubmit = (formData) => {
    sessionStorage.setItem('careerFormData', JSON.stringify(formData))
    navigate('/loading')
  }

  const trustSignals = [
    { icon: Lock, text: 'Your data stays private' },
    { icon: Zap, text: 'Results in 30 seconds' },
    { icon: Bot, text: '6 AI agents working for you' },
  ]

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-x-hidden flex flex-col">
      <AnimatedBackground />
      <Navbar />

      <PageTransition>
        <main className="relative pt-28 pb-20 flex-1">
          <Container className="max-w-[950px]!">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-accent-500/10 text-accent-400 border border-accent-500/20 mb-4">
                <Shield className="w-3 h-3" aria-hidden="true" />
                Secure & Private
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-white mb-3 tracking-tight">
                Tell Us About <span className="gradient-text">Yourself</span>
              </h1>
              <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
                Fill in your details and our 6 AI agents will analyze your career path,
                identify skill gaps, and create a personalized roadmap.
              </p>
            </motion.div>

            <motion.div
              className="glass-card p-6 sm:p-8 lg:p-10"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <StudentForm onSubmit={handleSubmit} />
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center items-center gap-6 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {trustSignals.map((signal) => (
                <span key={signal.text} className="flex items-center gap-2 text-xs text-slate-500">
                  <signal.icon className="w-3.5 h-3.5 text-accent-400/60" aria-hidden="true" />
                  {signal.text}
                </span>
              ))}
            </motion.div>
          </Container>
        </main>
      </PageTransition>

      <Footer />
    </div>
  )
}

export default StudentFormPage
