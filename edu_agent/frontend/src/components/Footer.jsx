import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Container from './ui/Container'

const GithubIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const TwitterIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
)

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-white/5 mt-auto" role="contentinfo">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-500/40 to-transparent" />

      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-white font-display">
                Career<span className="gradient-text">Guide</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md mb-6">
              AI-powered career guidance platform. Get personalized insights, skill gap analysis,
              learning roadmaps, and resume feedback — powered by 6 specialized AI agents.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: GithubIcon, href: 'https://github.com', label: 'GitHub' },
                { Icon: TwitterIcon, href: 'https://twitter.com', label: 'Twitter' },
              ].map(({ Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg glass-light flex items-center justify-center text-slate-400 hover:text-accent-400 transition-colors"
                  whileHover={{ y: -2 }}
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-5 uppercase tracking-widest">
              Product
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/analyze', label: 'Career Analysis' },
                { to: '/dashboard', label: 'Dashboard' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-500 hover:text-accent-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Agents */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-5 uppercase tracking-widest">
              AI Agents
            </h4>
            <ul className="space-y-3">
              {[
                'Resume Analysis',
                'Skill Gap Detection',
                'Job Matching',
                'Market Intelligence',
                'Roadmap Generation',
                'AI Mentor',
              ].map((agent) => (
                <li key={agent}>
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-accent-500/60" aria-hidden="true" />
                    {agent}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-600">
            &copy; {currentYear} Career Guide AI. Built for hackathon.
          </p>
          <span className="text-xs text-slate-600 flex items-center gap-1.5">
            Powered by
            <span className="gradient-text font-semibold">Multi-Agent AI</span>
          </span>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
