import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Map, Clock, BookOpen, Sparkles, ChevronDown, CheckCircle2, 
  Circle, Target, FileCode, PlaySquare, FileText, LayoutList 
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { generateRoadmap } from '../../services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import { SkeletonCard } from '../ui/Skeleton'
import './RoadmapPanel.css'

export default function RoadmapPanel({ data: existingData, formData }) {
  // Pre-fill form data if available
  const [currentRole, setCurrentRole] = useState(formData?.current_role || '')
  const [targetRole, setTargetRole] = useState(formData?.target_role || '')
  const [timeline, setTimeline] = useState('12')
  
  const { data, loading, error, execute } = useApi(generateRoadmap)
  const result = data || (existingData?.weeks ? existingData : null)

  // Interactive States
  const [completedTasks, setCompletedTasks] = useState({})
  const [expandedWeeks, setExpandedWeeks] = useState([])

  // Load saved progress from localStorage on mount
  useEffect(() => {
    if (result?.target_role) {
      const storageKey = `roadmap_progress_${result.target_role.replace(/\s+/g, '_')}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          setCompletedTasks(JSON.parse(saved))
        } catch (e) {
          console.error("Failed to parse saved roadmap progress", e)
        }
      }
    }
  }, [result])

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (result?.target_role && Object.keys(completedTasks).length > 0) {
      const storageKey = `roadmap_progress_${result.target_role.replace(/\s+/g, '_')}`
      localStorage.setItem(storageKey, JSON.stringify(completedTasks))
    }
  }, [completedTasks, result])

  // Auto-expand first week when roadmap loads
  useEffect(() => {
    if (result?.weeks?.length > 0 && expandedWeeks.length === 0) {
      setExpandedWeeks([result.weeks[0].week_number])
    }
  }, [result])

  const handleGenerate = async () => {
    if (!currentRole.trim() || !targetRole.trim()) return
    await execute({
      current_role: currentRole,
      target_role: targetRole,
      deadline_weeks: parseInt(timeline) || 12,
      skill_gaps: formData?.skill_gaps || [],
      skills: formData?.skills || []
    })
    setCompletedTasks({})
    setExpandedWeeks([])
  }

  const toggleTask = (weekNum, taskIndex) => {
    const taskId = `${weekNum}-${taskIndex}`
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }))
  }

  const toggleWeek = (weekNum) => {
    setExpandedWeeks(prev => 
      prev.includes(weekNum) 
        ? prev.filter(w => w !== weekNum) 
        : [...prev, weekNum]
    )
  }

  // Calculate Progress
  const { totalTasks, completedCount, progressPercent } = useMemo(() => {
    if (!result?.weeks) return { totalTasks: 0, completedCount: 0, progressPercent: 0 }
    
    let total = 0
    let completed = 0
    
    result.weeks.forEach(week => {
      if (week.tasks) {
        total += week.tasks.length
        week.tasks.forEach((_, idx) => {
          if (completedTasks[`${week.week_number}-${idx}`]) {
            completed++
          }
        })
      }
    })
    
    return {
      totalTasks: total,
      completedCount: completed,
      progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100)
    }
  }, [result, completedTasks])

  const getResourceIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'video': return <PlaySquare size={16} />
      case 'course': return <BookOpen size={16} />
      default: return <FileText size={16} />
    }
  }

  return (
    <div className="roadmap-panel">
      {/* Form Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="md">
          <div className="roadmap-panel__header">
            <Map size={20} style={{ color: 'var(--accent-secondary)' }} />
            <h3>Generate Career Roadmap</h3>
          </div>
          <div className="roadmap-panel__form">
            <div className="roadmap-panel__row">
              <Input
                label="Current Role"
                placeholder="e.g. Junior Developer"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
              />
              <Input
                label="Target Role"
                placeholder="e.g. ML Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
              <Input
                label="Timeline (weeks)"
                type="number"
                min="1"
                max="52"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              icon={Sparkles}
              loading={loading}
              disabled={!currentRole.trim() || !targetRole.trim()}
              onClick={handleGenerate}
            >
              Generate Roadmap
            </Button>
          </div>
        </Card>
      </motion.div>

      {loading && (
        <div className="roadmap-loading">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      )}
      
      {error && <ErrorState message={error} onRetry={handleGenerate} />}

      {/* Results Section */}
      {result && !loading && (
        <motion.div
          className="roadmap-panel__results"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Progress Dashboard */}
          <div className="roadmap-progress">
            <div className="roadmap-progress__header">
              <div className="roadmap-progress__stats">
                <span className="roadmap-progress__stats-title">Overall Progress</span>
                <div className="roadmap-progress__stats-value">
                  {progressPercent}% <span>({completedCount}/{totalTasks} Tasks)</span>
                </div>
              </div>
              <div className="roadmap-progress__badges">
                <Badge variant="info" icon={Clock}>
                  {result.total_weeks || result.weeks?.length} Weeks
                </Badge>
                {result.hours_per_week && (
                  <Badge variant="default" icon={Target}>
                    {result.hours_per_week} hrs/week
                  </Badge>
                )}
              </div>
            </div>
            <div className="roadmap-progress__track">
              <motion.div 
                className="roadmap-progress__fill" 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {result.summary && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', padding: '0 var(--space-2)' }}>
              {result.summary}
            </p>
          )}

          {/* Timeline / Week Cards */}
          {result.weeks?.length > 0 && (
            <div className="roadmap-timeline">
              {result.weeks.map((week, i) => {
                const isExpanded = expandedWeeks.includes(week.week_number)
                
                // Calculate week specific progress
                const weekTotal = week.tasks?.length || 0
                const weekCompleted = week.tasks?.filter((_, idx) => completedTasks[`${week.week_number}-${idx}`]).length || 0
                const isWeekDone = weekTotal > 0 && weekCompleted === weekTotal

                return (
                  <motion.div
                    key={week.week_number}
                    className={`roadmap-week ${isWeekDone ? 'roadmap-week--completed' : ''} ${isExpanded ? 'roadmap-week--expanded' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    {/* Week Header (Clickable) */}
                    <div className="roadmap-week__header" onClick={() => toggleWeek(week.week_number)}>
                      <div className="roadmap-week__header-main">
                        <div className="roadmap-week__number">
                          <span className="roadmap-week__number-label">Week</span>
                          <span className="roadmap-week__number-val">{week.week_number}</span>
                        </div>
                        <div className="roadmap-week__title-group">
                          <div className="roadmap-week__title">{week.theme}</div>
                          <div className="roadmap-week__meta">
                            {week.phase && <Badge variant="primary" size="sm">{week.phase}</Badge>}
                            {week.estimated_hours > 0 && (
                              <span><Clock size={12} style={{display:'inline', marginRight: '4px', position: 'relative', top: '1px'}}/>{week.estimated_hours}h</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="roadmap-week__header-actions">
                        {weekTotal > 0 && (
                          <span className="roadmap-week__progress-text">
                            {weekCompleted}/{weekTotal}
                          </span>
                        )}
                        <ChevronDown size={20} className="roadmap-week__expand-icon" />
                      </div>
                    </div>

                    {/* Week Body (Expandable) */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          className="roadmap-week__body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="roadmap-week__body-content">
                            
                            {/* Objectives */}
                            {week.learning_objectives?.length > 0 && (
                              <div className="roadmap-section">
                                <div className="roadmap-section__title">
                                  <Target size={16} className="roadmap-section__title-icon" />
                                  Objectives
                                </div>
                                <ul className="roadmap-objectives">
                                  {week.learning_objectives.map((obj, idx) => (
                                    <li key={idx} className="roadmap-objective">
                                      <span className="roadmap-objective__bullet">•</span>
                                      {obj}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Tasks */}
                            {week.tasks?.length > 0 && (
                              <div className="roadmap-section">
                                <div className="roadmap-section__title">
                                  <LayoutList size={16} className="roadmap-section__title-icon" />
                                  Action Items
                                </div>
                                <div className="roadmap-tasks">
                                  {week.tasks.map((task, idx) => {
                                    const taskId = `${week.week_number}-${idx}`
                                    const isDone = completedTasks[taskId]
                                    return (
                                      <div 
                                        key={idx} 
                                        className={`roadmap-task ${isDone ? 'roadmap-task--completed' : ''}`}
                                        onClick={() => toggleTask(week.week_number, idx)}
                                      >
                                        <div className="roadmap-task__checkbox">
                                          {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                        </div>
                                        <div className="roadmap-task__content">
                                          <div className="roadmap-task__title">{task.title}</div>
                                          <div className="roadmap-task__desc">{task.description}</div>
                                          {(task.estimated_hours > 0 || task.type) && (
                                            <div className="roadmap-task__meta">
                                              {task.estimated_hours > 0 && (
                                                <span className="roadmap-task__meta-item">
                                                  <Clock size={12} /> {task.estimated_hours}h
                                                </span>
                                              )}
                                              {task.type && (
                                                <span className="roadmap-task__meta-item" style={{textTransform: 'capitalize'}}>
                                                  • {task.type}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Resources */}
                            {week.resources?.length > 0 && (
                              <div className="roadmap-section">
                                <div className="roadmap-section__title">
                                  <BookOpen size={16} className="roadmap-section__title-icon" />
                                  Learning Resources
                                </div>
                                <div className="roadmap-resources">
                                  {week.resources.map((res, idx) => (
                                    <a key={idx} href={res.url} target="_blank" rel="noreferrer" className="roadmap-resource">
                                      <div className="roadmap-resource__icon">
                                        {getResourceIcon(res.type)}
                                      </div>
                                      <div className="roadmap-resource__content">
                                        <span className="roadmap-resource__title">{res.title}</span>
                                        <span className="roadmap-resource__type">{res.type} {res.skill ? `• ${res.skill}` : ''}</span>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Mini Project / Milestone */}
                            {week.mini_project && (
                              <div className="roadmap-project">
                                <div className="roadmap-project__header">
                                  <div className="roadmap-section__title">
                                    <FileCode size={16} className="roadmap-section__title-icon" />
                                    Mini Project
                                  </div>
                                  {week.mini_project.difficulty && (
                                    <Badge variant="warning" size="sm" style={{textTransform: 'capitalize'}}>
                                      {week.mini_project.difficulty}
                                    </Badge>
                                  )}
                                </div>
                                <div className="roadmap-project__title">{week.mini_project.title}</div>
                                <div className="roadmap-project__desc">{week.mini_project.description}</div>
                                {week.mini_project.skills_used?.length > 0 && (
                                  <div className="roadmap-project__skills">
                                    {week.mini_project.skills_used.map((s, idx) => (
                                      <Badge key={idx} variant="default" size="sm">{s}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {!result && !loading && !error && (
        <EmptyState
          icon={Map}
          title="No roadmap generated yet"
          description="Enter your current and target roles above to generate a personalized career roadmap."
        />
      )}
    </div>
  )
}
