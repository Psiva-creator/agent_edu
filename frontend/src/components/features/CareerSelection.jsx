import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Map, Clock, ArrowRight, PenTool, BrainCircuit, Bookmark, X } from 'lucide-react'
import { CAREER_CATEGORIES } from '../../data/career-data'
import Input from '../ui/Input'
import Button from '../ui/Button'
import './CareerSelection.css'

const POPULAR_CAREERS = [
  'Full Stack Developer',
  'AI Engineer',
  'Cybersecurity Analyst',
  'Data Scientist'
]

export default function CareerSelection({ 
  onSelect, 
  onGenerateCustom, 
  loading,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  activeCategory: propActiveCategory,
  setActiveCategory: propSetActiveCategory
}) {
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [localActiveCategory, setLocalActiveCategory] = useState('all')

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;
  const activeCategory = propActiveCategory !== undefined ? propActiveCategory : localActiveCategory;
  const setActiveCategory = propSetActiveCategory !== undefined ? propSetActiveCategory : setLocalActiveCategory;
  const [showCustom, setShowCustom] = useState(false)
  const [customCareer, setCustomCareer] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [customTimeline, setCustomTimeline] = useState('12')

  // Search suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(-1)

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fav_careers') || '[]')
    } catch {
      return []
    }
  })

  // Recently viewed state
  const [recentlyViewed, setRecentlyViewed] = useState([])

  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem('recent_careers') || '[]')
      setRecentlyViewed(recent)
    } catch (e) {
      console.error('Failed to load recently viewed careers', e)
    }
  }, [])

  const saveToRecentlyViewed = (career) => {
    try {
      const recent = JSON.parse(localStorage.getItem('recent_careers') || '[]')
      const filtered = recent.filter(r => r.id !== career.id)
      filtered.unshift({
        id: career.id,
        title: career.title,
        categoryId: career.categoryId,
        categoryLabel: career.categoryLabel,
        desc: career.desc,
        time: career.time,
        difficulty: career.difficulty,
        demand: career.demand
      })
      const limited = filtered.slice(0, 5)
      localStorage.setItem('recent_careers', JSON.stringify(limited))
      setRecentlyViewed(limited)
    } catch (e) {
      console.error('Failed to save recently viewed career', e)
    }
  }

  const toggleFavorite = (e, careerId) => {
    e.stopPropagation()
    setFavorites(prev => {
      const next = prev.includes(careerId)
        ? prev.filter(id => id !== careerId)
        : [...prev, careerId]
      localStorage.setItem('fav_careers', JSON.stringify(next))
      return next
    })
  }

  const flatCareers = useMemo(() => {
    return CAREER_CATEGORIES.flatMap(cat => 
      cat.careers.map(c => ({ ...c, categoryId: cat.id, categoryLabel: cat.label, categoryIcon: cat.icon }))
    )
  }, [])

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return flatCareers.filter(c => 
      c.title.toLowerCase().includes(q) ||
      c.categoryLabel.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [searchQuery, flatCareers])

  const filteredCareers = useMemo(() => {
    let result = flatCareers
    if (activeCategory === 'favorites') {
      result = result.filter(c => favorites.includes(c.id))
    } else if (activeCategory !== 'all') {
      result = result.filter(c => c.categoryId === activeCategory)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.desc.toLowerCase().includes(q) ||
        c.categoryLabel.toLowerCase().includes(q)
      )
    }
    return result
  }, [searchQuery, activeCategory, flatCareers, favorites])

  const handleSelect = (career) => {
    saveToRecentlyViewed(career)
    onSelect(career.title)
  }

  const handleCustomSubmit = () => {
    if (!customCareer.trim() || !customRole.trim()) return
    onGenerateCustom(customRole, customCareer, parseInt(customTimeline) || 12)
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSuggestionIndex(prev => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestionIndex >= 0 && suggestionIndex < suggestions.length) {
        handleSelect(suggestions[suggestionIndex])
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSuggestionIndex(-1)
    }
  }

  const highlightMatch = (text, query) => {
    if (!query) return <span>{text}</span>
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="rh-search-highlight">{part}</mark> 
            : part
        )}
      </span>
    )
  }

  return (
    <div className="rh-career-sel">
      <div className="rh-career-sel__header">
        <div className="rh-career-sel__icon-wrap">
          <Map size={24} />
        </div>
        <h2>Select Your Career Path</h2>
        <p>Choose a specialized career to generate a personalized learning roadmap with dynamic resources, projects, and practice platforms.</p>
      </div>

      <div className="rh-career-sel__search" onKeyDown={handleKeyDown}>
        <Search size={18} className="rh-career-sel__search-icon" />
        <input 
          type="text" 
          placeholder="Search careers (e.g., Python, Cloud, Security)..." 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setShowSuggestions(true)
            setSuggestionIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          className="rh-career-sel__search-input"
        />
        {searchQuery && (
          <button 
            className="rh-career-sel__search-clear"
            onClick={() => {
              setSearchQuery('')
              setShowSuggestions(false)
            }}
            aria-label="Clear Search"
          >
            <X size={16} />
          </button>
        )}

        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div 
              className="rh-career-sel__suggestions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
            >
              {suggestions.map((s, idx) => (
                <div
                  key={s.id}
                  className={`rh-career-sel__suggestion-item ${idx === suggestionIndex ? 'rh-career-sel__suggestion-item--active' : ''}`}
                  onMouseDown={() => handleSelect(s)}
                  onMouseEnter={() => setSuggestionIndex(idx)}
                >
                  <s.categoryIcon size={14} className="rh-career-sel__suggestion-icon" />
                  <div className="rh-career-sel__suggestion-info">
                    <span className="rh-career-sel__suggestion-title">
                      {highlightMatch(s.title, searchQuery)}
                    </span>
                    <span className="rh-career-sel__suggestion-cat">{s.categoryLabel}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Popular Careers Section */}
      <div className="rh-career-sel__popular">
        <span className="rh-career-sel__popular-label">Popular:</span>
        <div className="rh-career-sel__popular-chips">
          {POPULAR_CAREERS.map(title => (
            <button
              key={title}
              className="rh-career-sel__popular-chip"
              onClick={() => {
                const career = flatCareers.find(c => c.title === title)
                if (career) handleSelect(career)
              }}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <div className="rh-career-sel__recent">
          <h4 className="rh-career-sel__recent-title">Recently Viewed</h4>
          <div className="rh-career-sel__recent-list">
            {recentlyViewed.map(c => (
              <div 
                key={c.id} 
                className="rh-career-sel__recent-item"
                onClick={() => onSelect(c.title)}
              >
                <div className="rh-career-sel__recent-info">
                  <span className="rh-career-sel__recent-name">{c.title}</span>
                  <span className="rh-career-sel__recent-cat">{c.categoryLabel}</span>
                </div>
                <ArrowRight size={12} className="rh-career-sel__recent-arrow" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="rh-career-sel__cats-container">
        <div className="rh-career-sel__cats">
          <button 
            className={`rh-career-sel__cat ${activeCategory === 'all' ? 'rh-career-sel__cat--active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Careers
          </button>
          
          <button 
            className={`rh-career-sel__cat ${activeCategory === 'favorites' ? 'rh-career-sel__cat--active' : ''}`}
            onClick={() => setActiveCategory('favorites')}
          >
            <Bookmark size={12} />
            Favorites ({favorites.length})
          </button>

          {CAREER_CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              className={`rh-career-sel__cat ${activeCategory === cat.id ? 'rh-career-sel__cat--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <cat.icon size={12} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count & Clear Button */}
      <div className="rh-career-sel__info-row">
        <span className="rh-career-sel__count">
          {filteredCareers.length === flatCareers.length 
            ? `${flatCareers.length} Careers Available` 
            : `Showing ${filteredCareers.length} of ${flatCareers.length} Careers`}
        </span>
        {(searchQuery || activeCategory !== 'all') && (
          <button 
            className="rh-career-sel__clear-btn"
            onClick={() => {
              setSearchQuery('')
              setActiveCategory('all')
            }}
          >
            Clear Filters <X size={12} />
          </button>
        )}
      </div>

      {/* Grid of Careers */}
      <div className="rh-career-sel__grid">
        <AnimatePresence mode="popLayout">
          {filteredCareers.map((c, i) => (
            <motion.div
              layout
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="rh-career-card"
              onClick={() => handleSelect(c)}
            >
              <div className="rh-career-card__top">
                <div className="rh-career-card__cat">
                  <c.categoryIcon size={12} />
                  <span>{c.categoryLabel}</span>
                </div>
                <div className="rh-career-card__actions-top">
                  <button 
                    className={`rh-career-card__fav-btn ${favorites.includes(c.id) ? 'rh-career-card__fav-btn--active' : ''}`}
                    onClick={(e) => toggleFavorite(e, c.id)}
                    aria-label="Bookmark Career"
                  >
                    <Bookmark size={14} />
                  </button>
                  {c.demand === 'Very High' && (
                    <span className="rh-career-card__badge rh-career-card__badge--hot">Hot Demand</span>
                  )}
                </div>
              </div>
              <h3 className="rh-career-card__title">{c.title}</h3>
              <p className="rh-career-card__desc">{c.desc}</p>
              <div className="rh-career-card__meta">
                <span><Clock size={12} /> {c.time}</span>
                <span className="rh-career-card__diff">{c.difficulty}</span>
              </div>
              <div className="rh-career-card__action">
                Generate Roadmap <ArrowRight size={14} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCareers.length === 0 && (
        <div className="rh-career-sel__empty">
          <BrainCircuit size={48} className="rh-career-sel__empty-icon" />
          <h3>No predefined careers found</h3>
          <p>We couldn't find a career matching "{searchQuery}".</p>
        </div>
      )}

      {/* Custom Roadmap Section */}
      <div className="rh-career-sel__custom">
        {!showCustom ? (
          <div className="rh-career-sel__custom-prompt">
            <p>Can't find your career? The AI can generate a custom roadmap for any role.</p>
            <button className="rh-career-sel__custom-btn" onClick={() => setShowCustom(true)}>
              <PenTool size={14} /> Create Custom Career
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className="rh-career-sel__custom-form-wrap"
          >
            <div className="rh-career-sel__custom-header">
              <h3>Custom Career Generation</h3>
              <button className="rh-career-sel__custom-close" onClick={() => setShowCustom(false)}>Cancel</button>
            </div>
            <div className="rh-career-sel__custom-form">
              <Input 
                label="Your Current Role" 
                placeholder="e.g. Student, Data Analyst" 
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
              />
              <Input 
                label="Target Custom Career" 
                placeholder="e.g. Quant Developer, Robotics Engineer" 
                value={customCareer}
                onChange={e => setCustomCareer(e.target.value)}
              />
              <Input 
                label="Timeline (weeks)" 
                type="number" 
                min="1" max="52"
                value={customTimeline}
                onChange={e => setCustomTimeline(e.target.value)}
              />
            </div>
            <div className="rh-career-sel__custom-action">
              <Button 
                variant="primary" 
                onClick={handleCustomSubmit}
                loading={loading}
                disabled={!customRole.trim() || !customCareer.trim()}
              >
                Generate Custom Roadmap
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
