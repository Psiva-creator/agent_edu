import { useMemo } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { cn } from '../../utils/helpers'
import './ThemeSwitcher.css'

export default function ThemeSwitcher({ className }) {
  const { theme, setTheme } = useTheme()

  const isDark = useMemo(() => {
    if (theme === 'dark') return true
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  }, [theme])

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button 
      className={cn('theme-switcher-btn', className)} 
      onClick={toggleTheme} 
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      type="button"
    >
      {isDark ? <Sun size={15} className="theme-icon" /> : <Moon size={15} className="theme-icon" />}
      <span className="theme-switcher-label">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
