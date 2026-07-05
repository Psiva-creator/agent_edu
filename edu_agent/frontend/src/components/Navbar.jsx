import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles, ArrowRight } from 'lucide-react'
import Button from './Button'
import Container from './ui/Container'

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5" aria-label="Main navigation">
      <Container>
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3 group" aria-label="Career Guide AI home">
            <motion.div
              className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </motion.div>
            <span className="text-xl font-bold text-white font-display tracking-tight">
              Career<span className="gradient-text">Guide</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive(link.to) ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                aria-current={isActive(link.to) ? 'page' : undefined}
              >
                {isActive(link.to) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-white/[0.04] rounded-full border border-white/5"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            ))}
            <Link to="/analyze" className="ml-4">
              <Button variant="primary" size="md">
                Start Analysis
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </Container>


      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden glass border-t border-white/5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 py-4 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'text-accent-400 bg-accent-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/analyze" onClick={() => setMobileOpen(false)} className="block pt-2">
                <Button variant="primary" size="md" className="w-full">
                  Start Analysis
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar
