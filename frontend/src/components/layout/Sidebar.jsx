import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Map, Briefcase, TrendingUp,
  MessageCircle, Sparkles, ChevronLeft, ChevronRight, Compass,
} from 'lucide-react'
import { cn } from '../../utils/helpers'
import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard, path: '/dashboard' },
  { id: 'resume',    label: 'Resume',    icon: FileText,        path: '/dashboard/resume' },
  { id: 'roadmap',   label: 'Roadmap',   icon: Map,             path: '/dashboard/roadmap' },
  { id: 'jobs',      label: 'Jobs',      icon: Briefcase,       path: '/dashboard/jobs' },
  { id: 'market',    label: 'Market',    icon: TrendingUp,      path: '/dashboard/market' },
  { id: 'mentor',    label: 'Mentor',    icon: MessageCircle,   path: '/dashboard/mentor' },
]

export { NAV_ITEMS }

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/dashboard/overview'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className={cn('sidebar', collapsed && 'sidebar--collapsed')}>
      {/* Logo */}
      <div className="sidebar__logo" onClick={() => navigate('/')}>
        <div className="sidebar__logo-icon">
          <Sparkles size={20} />
        </div>
        {!collapsed && <span className="sidebar__logo-text">Career Guide<span className="text-gradient"> AI</span></span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <div className="sidebar__section-label">{!collapsed && 'Dashboard'}</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={cn('sidebar__item', isActive(item.path) && 'sidebar__item--active')}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* New Analysis CTA */}
      <div className="sidebar__footer">
        <button
          className="sidebar__cta"
          onClick={() => navigate('/analyze')}
          title={collapsed ? 'New Analysis' : undefined}
        >
          <Compass size={18} />
          {!collapsed && <span>New Analysis</span>}
        </button>

        {/* Collapse Toggle */}
        <button className="sidebar__toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}
