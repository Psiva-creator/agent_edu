import { useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from './Sidebar'
import { Compass } from 'lucide-react'
import { cn } from '../../utils/helpers'
import './MobileNav.css'

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const items = [
    ...NAV_ITEMS.slice(0, 4),
    { id: 'analyze', label: 'Analyze', icon: Compass, path: '/analyze' },
  ]

  const isActive = (path) => {
    if (path === '/dashboard/overview') return location.pathname === '/dashboard' || location.pathname === '/dashboard/overview'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="mobile-nav">
      {items.map((item) => (
        <button
          key={item.id}
          className={cn('mobile-nav__item', isActive(item.path) && 'mobile-nav__item--active')}
          onClick={() => navigate(item.path)}
        >
          <item.icon size={20} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
