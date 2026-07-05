import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, ArrowRight, Target, Briefcase, Map,
  FileText, TrendingUp, MessageCircle, Zap, Shield, Globe,
} from 'lucide-react'
import Button from '../components/ui/Button'
import './LandingPage.css'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
})

const FEATURES = [
  { icon: Target, title: 'Skill Gap Analysis', desc: 'AI identifies missing skills for your target role and recommends learning paths.' },
  { icon: Briefcase, title: 'Smart Job Matching', desc: 'Get matched with relevant opportunities based on your skills and preferences.' },
  { icon: Map, title: 'Career Roadmap', desc: 'Generate personalized milestone-based roadmaps with resource recommendations.' },
  { icon: FileText, title: 'Resume Analysis', desc: 'AI-powered resume scoring with actionable improvement suggestions.' },
  { icon: TrendingUp, title: 'Market Insights', desc: 'Stay ahead with real-time industry trends and in-demand skill analysis.' },
  { icon: MessageCircle, title: 'AI Mentor', desc: 'Get personalized career advice from your AI-powered mentor anytime.' },
]

const STEPS = [
  { num: '01', title: 'Share Your Profile', desc: 'Tell us about your education, skills, interests, and career goals.' },
  { num: '02', title: 'AI Analysis', desc: 'Six specialized AI agents analyze your profile simultaneously.' },
  { num: '03', title: 'Get Your Guide', desc: 'Receive a comprehensive career dashboard with actionable insights.' },
]

const STATS = [
  { value: '6', label: 'AI Agents' },
  { value: '< 2min', label: 'Analysis Time' },
  { value: '100%', label: 'Personalized' },
  { value: '24/7', label: 'AI Mentor' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing__nav">
        <div className="landing__nav-inner container">
          <div className="landing__brand">
            <div className="landing__brand-icon"><Sparkles size={18} /></div>
            <span>Career Guide <span className="text-gradient">AI</span></span>
          </div>
          <div className="landing__nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Button variant="primary" size="sm" onClick={() => navigate('/analyze')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__hero-bg" />
        <div className="container landing__hero-content">
          <motion.div className="landing__hero-badge" {...fadeUp(0)}>
            <Zap size={14} />
            <span>Powered by Multi-Agent AI</span>
          </motion.div>
          <motion.h1 className="landing__hero-title" {...fadeUp(0.1)}>
            Your Career Path,<br />
            <span className="text-gradient">Guided by AI</span>
          </motion.h1>
          <motion.p className="landing__hero-desc" {...fadeUp(0.2)}>
            Six specialized AI agents analyze your skills, match you with jobs,
            build career roadmaps, review your resume, and provide personalized mentoring — all in one platform.
          </motion.p>
          <motion.div className="landing__hero-actions" {...fadeUp(0.3)}>
            <Button variant="primary" size="xl" iconRight={ArrowRight} onClick={() => navigate('/analyze')}>
              Start Free Analysis
            </Button>
            <Button variant="secondary" size="xl" onClick={() => navigate('/dashboard')}>
              View Dashboard
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="landing__stats">
        <div className="container landing__stats-grid">
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} className="landing__stat" {...fadeUp(i * 0.08)}>
              <span className="landing__stat-value">{stat.value}</span>
              <span className="landing__stat-label">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing__features">
        <div className="container">
          <motion.div className="landing__section-header" {...fadeUp()}>
            <h2>Everything You Need to <span className="text-gradient">Accelerate Your Career</span></h2>
            <p>Six AI agents working together to give you the most comprehensive career guidance available.</p>
          </motion.div>
          <div className="landing__features-grid">
            {FEATURES.map((feature, i) => (
              <motion.div key={feature.title} className="landing__feature-card" {...fadeUp(i * 0.06)}>
                <div className="landing__feature-icon">
                  <feature.icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="landing__how">
        <div className="container">
          <motion.div className="landing__section-header" {...fadeUp()}>
            <h2>How It <span className="text-gradient">Works</span></h2>
            <p>Get personalized career guidance in three simple steps.</p>
          </motion.div>
          <div className="landing__steps">
            {STEPS.map((step, i) => (
              <motion.div key={step.num} className="landing__step" {...fadeUp(i * 0.1)}>
                <span className="landing__step-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing__cta">
        <div className="container">
          <motion.div className="landing__cta-inner" {...fadeUp()}>
            <h2>Ready to shape your career?</h2>
            <p>Start your free AI-powered career analysis today.</p>
            <Button variant="primary" size="xl" iconRight={ArrowRight} onClick={() => navigate('/analyze')}>
              Get Started Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="container landing__footer-inner">
          <div className="landing__footer-brand">
            <Sparkles size={16} />
            <span>Career Guide AI</span>
          </div>
          <div className="landing__footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
          </div>
          <p className="landing__footer-copy">© 2026 Career Guide AI. Built with ❤️ and AI.</p>
        </div>
      </footer>
    </div>
  )
}
