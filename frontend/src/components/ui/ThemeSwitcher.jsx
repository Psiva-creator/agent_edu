import { Sun, Moon, Laptop } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/helpers'
import { useState, useRef, useEffect } from 'react'
import './ThemeSwitcher.css'

export default function ThemeSwitcher({ className }) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const getIcon = (t) => {
    switch (t) {
      case 'light': return <Sun size={15} />
      case 'dark': return <Moon size={15} />
      default: return <Laptop size={15} />
    }
  }

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Laptop },
  ]

  return (
    <div className={cn('theme-switcher', className)} ref={dropdownRef}>
      <button 
        className="theme-switcher__toggle" 
        onClick={() => setIsOpen(!isOpen)} 
        aria-label="Toggle theme"
        type="button"
      >
        {getIcon(theme)}
        <span className="theme-switcher__current-label">{theme}</span>
      </button>

      {isOpen && (
        <div className="theme-switcher__dropdown animate-scale-in">
          {themes.map((t) => (
            <button
              key={t.id}
              className={cn(
                'theme-switcher__option',
                theme === t.id && 'theme-switcher__option--active'
              )}
              onClick={() => {
                setTheme(t.id)
                setIsOpen(false)
              }}
              type="button"
            >
              <t.icon size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
