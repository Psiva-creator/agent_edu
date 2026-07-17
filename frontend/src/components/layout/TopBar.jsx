import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, ArrowLeft } from 'lucide-react'
import { cn } from '../../utils/helpers'
import ThemeSwitcher from '../ui/ThemeSwitcher'
import './TopBar.css'

const TITLE_MAP = {
  '/dashboard': 'Overview',
  '/dashboard/resume': 'Resume Analysis',
  '/dashboard/roadmap': 'Career Roadmap',
  '/dashboard/jobs': 'Job Search',
  '/dashboard/market': 'Market Insights',
  '/dashboard/mentor': 'AI Mentor',
  '/dashboard/settings': 'Settings',
  '/analyze': 'Career Analysis',
}

export default function TopBar({ onMenuClick, className }) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = TITLE_MAP[location.pathname] || 'Career Guide AI'
  const showBack = location.pathname !== '/dashboard' && location.pathname !== '/'

  return (
    <header className={cn('topbar', className)}>
      <div className="topbar__left">
        <button className="topbar__menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        {showBack && (
          <button className="topbar__back" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={18} />
          </button>
        )}
        <h1 className="topbar__title">{title}</h1>
      </div>
      <div className="topbar__right">
        <div className="topbar__status">
          <span className="topbar__status-dot" />
          <span className="topbar__status-text">AI Ready</span>
        </div>
        <ThemeSwitcher />
      </div>
    </header>
  )
}
