import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, ArrowRight, Target, Briefcase, Map,
  FileText, TrendingUp, MessageCircle, Zap, Shield, Globe,
  ShieldCheck, Brain
} from 'lucide-react'
import Button from '../components/ui/Button'
import ThemeSwitcher from '../components/ui/ThemeSwitcher'
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

const AI_AGENTS = [
  { icon: ShieldCheck, name: 'Resume Intelligence Agent', desc: 'Grades your resume against ATS engines, highlights styling flaws, and refines work bullet points.' },
  { icon: Target, name: 'Skill Gap Profiler Agent', desc: 'Cross-references your skill catalog against real job requirements to map out training needs.' },
  { icon: Map, name: 'Roadmap Architect Agent', desc: 'Designs a week-by-week personalized learning syllabus complete with exercises and official docs.' },
  { icon: TrendingUp, name: 'Market Intelligence Agent', desc: 'Delivers real-time reports on local salary scales, job market growth rate, and hot roles.' },
  { icon: Briefcase, name: 'Smart Job Matcher Agent', desc: 'Aligns your verified skills with current open job listings that represent the best career match.' },
  { icon: Brain, name: 'AI Coach & Mentor Agent', desc: 'Conducts simulated practice interviews, gives instant feedback, and is available for chats 24/7.' },
]

const BENEFITS = [
  { icon: Zap, title: 'Accelerated Learning Curve', desc: 'Don\'t waste time researching where to study. Get linked directly to top-tier docs and video playlists.' },
  { icon: Shield, title: 'Optimized Job Applications', desc: 'Tailor your application profile for every single target role with specific keywords and cover letters.' },
  { icon: Globe, title: 'Strategic Decisions', desc: 'Base your next career move on hard market data, projected demand metrics, and salary potential.' },
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
            <a href="#ai-agents">AI Agents</a>
            <a href="#benefits">Benefits</a>
            <a href="#" className="landing__signin-link" onClick={(e) => { e.preventDefault(); navigate('/login') }}>Sign In</a>
            <Button id="nav-get-started" variant="primary" size="sm" onClick={() => navigate('/auth')}>Get Started</Button>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing__hero">
        <div className="landing__hero-bg" />
        {/* Soft, colorful animated gradient blobs */}
        <div className="landing__blob landing__blob--1" />
        <div className="landing__blob landing__blob--2" />
        <div className="landing__blob landing__blob--3" />
        
        <div className="container landing__hero-content">
          <motion.div className="landing__hero-badge" {...fadeUp(0)}>
            <Sparkles size={14} className="landing__hero-badge-icon" />
            <span>AI Powered Career Platform</span>
          </motion.div>
          <motion.h1 className="landing__hero-title" {...fadeUp(0.1)}>
            Your Career,<br />
            <span className="text-gradient">Powered by AI</span>
          </motion.h1>
          <motion.p className="landing__hero-desc" {...fadeUp(0.2)}>
            Discover your strengths, explore career paths, improve your resume, and receive personalized guidance from six intelligent AI agents.
          </motion.p>
          <motion.div className="landing__hero-actions" {...fadeUp(0.3)}>
            <Button id="hero-start-analysis" variant="primary" size="xl" iconRight={ArrowRight} onClick={() => navigate('/auth')} className="btn-hero-primary">
              Start AI Analysis
            </Button>
            <Button id="hero-explore-dashboard" variant="secondary" size="xl" onClick={() => navigate('/dashboard')} className="btn-hero-secondary">
              Explore Dashboard
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
                <div className="landing__step-card">
                  <span className="landing__step-num">{step.num}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents */}
      <section id="ai-agents" className="landing__agents">
        <div className="container">
          <motion.div className="landing__section-header" {...fadeUp()}>
            <h2>Meet Your Specialized <span className="text-gradient">AI Agents</span></h2>
            <p>A collaborative team of six digital experts, each masterfully trained in a critical domain of career strategy.</p>
          </motion.div>
          <div className="landing__agents-grid">
            {AI_AGENTS.map((agent, i) => (
              <motion.div key={agent.name} className="landing__agent-card" {...fadeUp(i * 0.06)}>
                <div className="landing__agent-icon">
                  <agent.icon size={24} />
                </div>
                <h3>{agent.name}</h3>
                <p>{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="landing__benefits">
        <div className="container">
          <motion.div className="landing__section-header" {...fadeUp()}>
            <h2>Why Choose <span className="text-gradient">Career Guide AI</span></h2>
            <p>Unlocking professional potential through hyper-personalized, data-backed insights.</p>
          </motion.div>
          <div className="landing__benefits-grid">
            {BENEFITS.map((benefit, i) => (
              <motion.div key={benefit.title} className="landing__benefit-card" {...fadeUp(i * 0.08)}>
                <div className="landing__benefit-icon-wrapper">
                  <benefit.icon size={26} />
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.desc}</p>
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
            <Button variant="primary" size="lg" className="hero-cta" onClick={() => navigate('/auth')}>
              Get Started Now <ArrowRight size={20} />
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
            <a href="#ai-agents">AI Agents</a>
            <a href="#benefits">Benefits</a>
          </div>
          <p className="landing__footer-copy">© 2026 Career Guide AI. Built with ❤️ and AI.</p>
        </div>
      </footer>
    </div>
  )
}
