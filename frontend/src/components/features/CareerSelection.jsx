import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Map, Clock, ArrowRight, PenTool, BrainCircuit } from 'lucide-react'
import { CAREER_CATEGORIES } from '../../data/career-data'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import './CareerSelection.css'

export default function CareerSelection({ onSelect, onGenerateCustom, loading }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showCustom, setShowCustom] = useState(false)
  const [customCareer, setCustomCareer] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [customTimeline, setCustomTimeline] = useState('12')

  const flatCareers = useMemo(() => {
    return CAREER_CATEGORIES.flatMap(cat => 
      cat.careers.map(c => ({ ...c, categoryId: cat.id, categoryLabel: cat.label, categoryIcon: cat.icon }))
    )
  }, [])

  const filteredCareers = useMemo(() => {
    let result = flatCareers
    if (activeCategory !== 'all') {
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
  }, [searchQuery, activeCategory, flatCareers])

  const handleSelect = (career) => {
    // Current role will default to 'Student' or user memory later in RoadmapPanel
    onSelect(career.title)
  }

  const handleCustomSubmit = () => {
    if (!customCareer.trim() || !customRole.trim()) return
    onGenerateCustom(customRole, customCareer, parseInt(customTimeline) || 12)
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

      <div className="rh-career-sel__search">
        <Search size={18} className="rh-career-sel__search-icon" />
        <input 
          type="text" 
          placeholder="Search careers (e.g., Python, Cloud, Security)..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rh-career-sel__search-input"
        />
      </div>

      <div className="rh-career-sel__cats">
        <button 
          className={`rh-career-sel__cat ${activeCategory === 'all' ? 'rh-career-sel__cat--active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All Careers
        </button>
        {CAREER_CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            className={`rh-career-sel__cat ${activeCategory === cat.id ? 'rh-career-sel__cat--active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <cat.icon size={14} />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="rh-career-sel__grid">
        <AnimatePresence>
          {filteredCareers.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
              className="rh-career-card"
              onClick={() => handleSelect(c)}
            >
              <div className="rh-career-card__top">
                <div className="rh-career-card__cat">
                  <c.categoryIcon size={12} />
                  <span>{c.categoryLabel}</span>
                </div>
                {c.demand === 'Very High' && (
                  <span className="rh-career-card__badge rh-career-card__badge--hot">Hot Demand</span>
                )}
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
