import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Target,
  Briefcase,
  Map,
  FileText,
  Brain,
  ArrowRight,
  Zap,
  Users,
  Clock,
  Sparkles,
  Bot,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'
import AnimatedBackground from '../components/ui/AnimatedBackground'
import PageTransition from '../components/ui/PageTransition'
import SectionHeader from '../components/ui/SectionHeader'
import FeatureCard from '../components/ui/FeatureCard'
import TestimonialCard from '../components/ui/TestimonialCard'
import HeroIllustration from '../components/ui/HeroIllustration'
import AnimatedCounter from '../components/ui/AnimatedCounter'
import Container from '../components/ui/Container'

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Market Analysis',
    description: 'Real-time job market insights powered by our Market Agent. Understand demand, salary trends, and industry shifts.',
  },
  {
    icon: Target,
    title: 'Skill Gap Detection',
    description: 'Our Skill Gap Agent identifies exactly what skills you need to bridge the gap between your current and target role.',
  },
  {
    icon: Briefcase,
    title: 'Job Matching',
    description: 'AI-powered job matching finds opportunities that align with your skills, experience, and career goals.',
  },
  {
    icon: Map,
    title: 'Career Roadmap',
    description: 'Get a personalized month-by-month roadmap with milestones, tasks, and resources to reach your goal.',
  },
  {
    icon: FileText,
    title: 'Resume Analysis',
    description: 'Upload your resume for section-by-section feedback with specific improvement suggestions.',
  },
  {
    icon: Brain,
    title: 'AI Mentor',
    description: 'Your personal AI career mentor provides tailored advice on strategy, interviews, and networking.',
  },
]

const STEPS = [
  { number: '01', title: 'Tell Us About You', description: 'Fill in your current role, target role, skills, and experience. The more detail, the better our analysis.' },
  { number: '02', title: 'AI Agents Analyze', description: 'Our 6 specialized AI agents work together to analyze your profile, the market, and generate personalized insights.' },
  { number: '03', title: 'Get Your Dashboard', description: 'Receive a comprehensive dashboard with your career score, skill gaps, roadmap, resume feedback, and mentor advice.' },
]

const TESTIMONIALS = [
  { quote: 'Career Guide helped me identify exactly which skills I was missing for my dream role. The roadmap was incredibly detailed and actionable.', author: 'Priya Sharma', role: 'CS Student → Software Engineer', avatar: 'PS' },
  { quote: 'The AI mentor gave me interview tips that actually worked. I landed my first internship within 2 months of following the roadmap.', author: 'Arjun Patel', role: 'Bootcamp Graduate', avatar: 'AP' },
  { quote: 'Seeing my readiness score and skill gaps visualized made my career plan feel concrete for the first time. Game changer.', author: 'Meera Reddy', role: 'Junior Developer', avatar: 'MR' },
]

function Home() {
  return (
    <div className="min-h-screen bg-dark-950 relative overflow-x-hidden flex flex-col">
      <AnimatedBackground />
      <Navbar />

      <PageTransition>
        {/* Hero */}
        <section className="relative min-h-[80vh] flex items-center pt-28 pb-16">
          <Container>
            <div className="grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    Powered by Multi-Agent AI
                  </span>
                </motion.div>

                <motion.h1
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-display leading-[1.05] mb-8 tracking-tight text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Your AI-Powered
                  <br />
                  <span className="gradient-text">Career Guide</span>
                </motion.h1>

                <motion.p
                  className="text-lg sm:text-xl text-slate-400 max-w-xl mb-10 leading-relaxed font-normal"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Get personalized career insights, skill gap analysis, learning roadmaps,
                  and resume feedback — all powered by 6 specialized AI agents working together.
                </motion.p>

                <motion.div
                  className="flex flex-col sm:flex-row items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link to="/analyze">
                    <Button variant="primary" size="lg">
                      Get Started — It&apos;s Free
                      <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="secondary" size="lg">
                      View Demo Dashboard
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                className="hidden lg:block"
              >
                <HeroIllustration />
              </motion.div>
            </div>
          </Container>
        </section>

        {/* Stats */}
        <section className="relative py-16 border-y border-white/5 bg-dark-900/10">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: 6, label: 'AI Agents', icon: Bot, suffix: '' },
                { value: 30, label: 'Sec Analysis', icon: Clock, prefix: '< ', suffix: 's' },
                { value: 100, label: 'Free to Use', icon: Sparkles, suffix: '%' },
                { value: 1000, label: 'Students Helped', icon: Users, suffix: '+' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center p-4"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <stat.icon className="w-5 h-5 text-accent-400 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-2xl sm:text-3xl font-bold gradient-text font-display">
                    {stat.prefix}
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Features (single unified section — replaces the duplicate Agents + Features) */}
        <section className="py-24 relative">
          <Container>
            <SectionHeader
              badge="Powered by 6 AI Agents"
              title="Everything You Need to"
              highlight="Accelerate"
              description="Each agent specializes in a different aspect of your career development, working together for comprehensive guidance."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {FEATURES.map((feature, index) => (
                <FeatureCard key={feature.title} {...feature} index={index} />
              ))}
            </div>
          </Container>
        </section>

        {/* Timeline / How it works */}
        <section className="py-24 relative bg-dark-900/10 border-y border-white/5">
          <Container>
            <SectionHeader
              badge="Simple Process"
              title="How It"
              highlight="Works"
              description="Three simple steps to get your personalized AI career guidance."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 relative">
              {STEPS.map((step, index) => (
                <motion.div
                  key={step.number}
                  className="glass-card relative flex flex-col items-start bg-dark-900 border border-white/[0.03] shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm mb-6 shadow-md shadow-emerald-500/10">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-white font-display mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Testimonials */}
        <section className="py-24 relative">
          <Container>
            <SectionHeader
              badge="Success Stories"
              title="Loved by"
              highlight="Students"
              description="See how Career Guide AI is helping students and professionals reach their career goals."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {TESTIMONIALS.map((t, i) => (
                <TestimonialCard key={t.author} {...t} index={i} />
              ))}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-24 relative bg-dark-900/10 border-t border-white/5">
          <Container>
            <motion.div
              className="glass-card p-10 sm:p-14 lg:p-20 text-center gradient-border relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 gradient-bg-subtle pointer-events-none" aria-hidden="true" />
              <div className="relative z-10">
                <Zap className="w-10 h-10 text-emerald-400 mx-auto mb-6" aria-hidden="true" />
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display mb-6 tracking-tight">
                  Ready to Transform Your <span className="gradient-text">Career</span>?
                </h2>
                <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                  Join thousands of students using AI-powered career guidance. Get your personalized analysis in under 30 seconds.
                </p>
                <Link to="/analyze">
                  <Button variant="primary" size="lg">
                    Start Your Career Analysis
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </Container>
        </section>
      </PageTransition>

      <Footer />
    </div>
  )
}

export default Home
