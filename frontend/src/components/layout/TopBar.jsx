import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, ArrowLeft, LogOut } from 'lucide-react'
import { cn } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'
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
  const { signOut, userData } = useAuth()
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
        {userData && (
          <div className="topbar__user" onClick={() => navigate('/dashboard/settings')} style={{ cursor: 'pointer' }}>
            {userData.profilePicture ? (
              <img src={userData.profilePicture} alt={userData.fullName} className="topbar__user-avatar" />
            ) : (
              <div className="topbar__user-initials">
                {userData.fullName
                  ? userData.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'U'}
              </div>
            )}
            <span className="topbar__user-name">{userData.fullName || 'User'}</span>
          </div>
        )}
        <div className="topbar__status">
          <span className="topbar__status-dot" />
          <span className="topbar__status-text">AI Ready</span>
        </div>
        <ThemeSwitcher />
        <button className="topbar__menu-btn" onClick={signOut} aria-label="Sign out" style={{ marginLeft: '8px' }} title="Sign Out">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
