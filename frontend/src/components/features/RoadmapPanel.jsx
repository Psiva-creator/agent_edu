import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Map, Clock, BookOpen, Sparkles, ChevronDown, CheckCircle2,
  Circle, Target, FileCode, PlaySquare, FileText, LayoutList,
  ExternalLink, Code2, GitBranch, Award, Zap, Search, Download,
  Share2, StickyNote, TrendingUp, Flame, Star, Globe, ChevronRight,
  X, Brain, RotateCcw, CheckSquare, AlertCircle, Upload, Link2,
  Layers, Timer, BarChart2, GraduationCap, Rocket, Play, Heart,
  Bookmark, BookMarked, Filter, FolderOpen, Package, MonitorPlay,
  Terminal, PenLine, Eye, ThumbsUp, Send, Trophy
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { generateRoadmap } from '../../services/api'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import { SkeletonCard } from '../ui/Skeleton'
import './RoadmapPanel.css'
import CareerSelection from './CareerSelection'
import { getResourcesForTopic, getPracticePlatforms, getProjectTemplate, getCertificates } from '../../data/career-data'

// ─── Static Data ────────────────────────────────────────────



const REVIEW_ACTIVITIES = [
  { id: 'quiz', label: 'Weekly Quiz', icon: Brain, url: 'https://quizizz.com/', desc: 'Test knowledge with gamified quizzes', color: '#8854c0' },
  { id: 'flashcards', label: 'Flashcards', icon: PenLine, url: 'https://quizlet.com/', desc: 'Active recall with spaced repetition', color: '#4255ff' },
  { id: 'notes', label: 'Revision Notes', icon: StickyNote, url: 'https://www.notion.so/', desc: 'Organize your learning notes', color: '#ffffff' },
  { id: 'mcq', label: 'MCQ Test', icon: CheckSquare, url: 'https://www.w3schools.com/quiztest/', desc: 'Multiple choice concept check', color: '#04aa6d' },
  { id: 'coding', label: 'Coding Assessment', icon: Terminal, url: 'https://www.hackerrank.com/skills-verification', desc: 'Verify coding skills officially', color: '#00ea64' },
  { id: 'kahoot', label: 'Live Quiz', icon: PlaySquare, url: 'https://kahoot.com/', desc: 'Fun live quiz sessions', color: '#ff004c' },
  { id: 'self', label: 'Self Evaluation', icon: ThumbsUp, url: 'https://www.freecodecamp.org/learn/', desc: 'Check your own understanding', color: '#0a0a23' },
  { id: 'progress', label: 'Progress Review', icon: TrendingUp, url: 'https://roadmap.sh/', desc: 'Review your overall roadmap progress', color: '#ef4444' },
]



const HACKATHONS = [
  { title: 'Devfolio', url: 'https://devfolio.co/', desc: "India's largest hackathon discovery platform.", difficulty: 'All Levels', color: '#3770ff', icon: '🚀', domain: 'devfolio.co' },
  { title: 'Unstop', url: 'https://unstop.com/', desc: 'Competitions, hackathons, internships and jobs.', difficulty: 'All Levels', color: '#7c3aed', icon: '⚡', domain: 'unstop.com' },
  { title: 'Devpost', url: 'https://devpost.com/', desc: 'Global hackathons with cash prizes and recognition.', difficulty: 'All Levels', color: '#003e54', icon: '💡', domain: 'devpost.com' },
  { title: 'Hack2Skill', url: 'https://hack2skill.com/', desc: 'India-focused hackathon and upskilling community.', difficulty: 'Beginner+', color: '#f97316', icon: '🎯', domain: 'hack2skill.com' },
  { title: 'MLH', url: 'https://mlh.io/', desc: 'The official student hackathon league — 500+ events/year.', difficulty: 'Beginner+', color: '#e74c3c', icon: '🏆', domain: 'mlh.io' },
  { title: 'AngelHack', url: 'https://angelhack.com/', desc: "World's largest global hacking community since 2011.", difficulty: 'Intermediate', color: '#ff5a5f', icon: '😇', domain: 'angelhack.com' },
  { title: 'OpenHack', url: 'https://openhack.microsoft.com/', desc: 'Microsoft-hosted collaborative tech challenges.', difficulty: 'Intermediate', color: '#0078d4', icon: '🔓', domain: 'openhack.microsoft.com' },
]

const OPEN_SOURCE = [
  { title: 'Good First Issue', url: 'https://goodfirstissue.dev/', desc: 'Curated beginner-friendly issues from top repositories.', icon: '🟢', domain: 'goodfirstissue.dev' },
  { title: 'First Contributions', url: 'https://firstcontributions.github.io/', desc: 'Step-by-step guide to making your very first PR.', icon: '🤝', domain: 'firstcontributions.github.io' },
  { title: 'Up For Grabs', url: 'https://up-for-grabs.net/', desc: 'Projects that are actively welcoming new contributors.', icon: '🙋', domain: 'up-for-grabs.net' },
  { title: 'CodeTriage', url: 'https://www.codetriage.com/', desc: 'Get open source issues delivered to your inbox daily.', icon: '🆘', domain: 'codetriage.com' },
  { title: 'GitHub Explore', url: 'https://github.com/explore', desc: 'Discover trending repos, topics and collections.', icon: '🌐', domain: 'github.com' },
  { title: 'Awesome Lists', url: 'https://github.com/sindresorhus/awesome', desc: 'The ultimate curated list of lists for every topic.', icon: '⭐', domain: 'github.com' },
]

const FILTER_TABS = [
  { id: 'all',          label: 'All',         icon: Layers },
  { id: 'study',        label: 'Study',       icon: BookOpen },
  { id: 'practice',     label: 'Practice',    icon: Code2 },
  { id: 'project',      label: 'Projects',    icon: FileCode },
  { id: 'quiz',         label: 'Review',      icon: Brain },
  { id: 'certificates', label: 'Certs',       icon: Award },
  { id: 'hackathons',   label: 'Hackathons',  icon: Rocket },
  { id: 'opensource',   label: 'Open Source', icon: GitBranch },
]

// ─── Utility Helpers ─────────────────────────────────────────

function favicon(domain) {
  return `https://www.google.com/s2/favicons?sz=32&domain=${domain}`
}

const TYPE_META = {
  Documentation: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  Course:        { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  Tutorial:      { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  Book:          { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  Video:         { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}
const DIFFICULTY_META = {
  Beginner:     { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  Intermediate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  Advanced:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  'All Levels': { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  'Beginner+':  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'Intermediate+': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
}
const BADGE_META = {
  Free:     { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  Freemium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  Paid:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

// ─── Shared Pill ─────────────────────────────────────────────

function Pill({ label, meta }) {
  const m = meta?.[label] || { color: '#6366f1', bg: 'rgba(99,102,241,0.12)' }
  return (
    <span className="rh-pill" style={{ color: m.color, background: m.bg }}>
      {label}
    </span>
  )
}

// ─── Study Resource Card ─────────────────────────────────────

function ResourceCard({ resource, isFav, onFav }) {
  return (
    <div className="rh-res-card">
      <div className="rh-res-card__head">
        <div className="rh-res-card__logo">
          <img
            src={favicon(resource.domain)}
            alt=""
            width={18}
            height={18}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
        <Pill label={resource.type} meta={TYPE_META} />
        <button
          className={`rh-res-card__fav ${isFav ? 'rh-res-card__fav--active' : ''}`}
          onClick={e => { e.preventDefault(); onFav(resource.url) }}
          title={isFav ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Heart size={13} />
        </button>
      </div>

      <div className="rh-res-card__title">{resource.title}</div>
      <div className="rh-res-card__desc">{resource.desc}</div>

      <div className="rh-res-card__meta">
        <span className="rh-res-card__meta-item">
          <Clock size={11} /> {resource.time}
        </span>
        <Pill label={resource.difficulty} meta={DIFFICULTY_META} />
      </div>

      <a
        href={resource.url}
        target="_blank"
        rel="noreferrer"
        className="rh-res-card__btn"
      >
        Open Resource <ExternalLink size={12} />
      </a>
    </div>
  )
}

// ─── Practice Platform Card ───────────────────────────────────

function PracticeCard({ platform }) {
  return (
    <a href={platform.url} target="_blank" rel="noreferrer" className="rh-prac-card">
      <div className="rh-prac-card__top">
        <div className="rh-prac-card__logo" style={{ background: platform.color + '18' }}>
          <img
            src={favicon(platform.domain)}
            alt=""
            width={20}
            height={20}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
        <Pill label={platform.difficulty} meta={DIFFICULTY_META} />
      </div>

      <div className="rh-prac-card__name">{platform.title}</div>
      <div className="rh-prac-card__desc">{platform.desc}</div>

      <div className="rh-prac-card__footer">
        <span className="rh-prac-card__problems">
          <Code2 size={11} /> {platform.problems} problems
        </span>
        <span className="rh-prac-card__cta" style={{ background: platform.color }}>
          Start Practicing <ExternalLink size={11} />
        </span>
      </div>
    </a>
  )
}

// ─── Weekly Review Center ─────────────────────────────────────

function ReviewCenter({ weekKey }) {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`review_${weekKey}`) || '{}') } catch { return {} }
  })

  const toggle = (id) => {
    setDone(p => {
      const next = { ...p, [id]: !p[id] }
      localStorage.setItem(`review_${weekKey}`, JSON.stringify(next))
      return next
    })
  }

  const completedCount = Object.values(done).filter(Boolean).length

  return (
    <div className="rh-review">
      <div className="rh-review__progress-bar-wrap">
        <div className="rh-review__progress-bar">
          <div
            className="rh-review__progress-fill"
            style={{ width: `${(completedCount / REVIEW_ACTIVITIES.length) * 100}%` }}
          />
        </div>
        <span className="rh-review__progress-label">
          {completedCount}/{REVIEW_ACTIVITIES.length} activities
        </span>
      </div>

      <div className="rh-review__grid">
        {REVIEW_ACTIVITIES.map(act => (
          <div key={act.id} className={`rh-review__item ${done[act.id] ? 'rh-review__item--done' : ''}`}>
            <div className="rh-review__item-left">
              <button
                className="rh-review__check"
                onClick={() => toggle(act.id)}
                style={{ color: done[act.id] ? '#22c55e' : 'var(--text-tertiary)' }}
              >
                {done[act.id] ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
              <div className="rh-review__item-icon" style={{ background: act.color + '20', color: act.color }}>
                <act.icon size={14} />
              </div>
              <div className="rh-review__item-text">
                <span className="rh-review__item-label">{act.label}</span>
                <span className="rh-review__item-desc">{act.desc}</span>
              </div>
            </div>
            <a
              href={act.url}
              target="_blank"
              rel="noreferrer"
              className="rh-review__item-btn"
            >
              Open <ExternalLink size={10} />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mini Project Card ────────────────────────────────────────

function ProjectCard({ project, weekNum, completedTasks, onMarkComplete }) {
  const [tab, setTab] = useState('overview')
  const [githubLink, setGithubLink] = useState('')
  const [liveLink, setLiveLink] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const taskId = `project-${weekNum}`
  const isDone = completedTasks[taskId]

  const projectTabs = [
    { id: 'overview',  label: 'Overview',  icon: Eye },
    { id: 'structure', label: 'Structure', icon: FolderOpen },
    { id: 'resources', label: 'Resources', icon: Package },
    { id: 'submit',    label: 'Submit',    icon: Send },
  ]

  const techStack  = project.skills_used?.length ? project.skills_used : ['Python', 'Git']
  const folderTree = [
    `${project.title?.replace(/\s+/g, '_').toLowerCase() || 'mini_project'}/`,
    '  ├── README.md',
    '  ├── requirements.txt',
    '  ├── main.py',
    '  ├── src/',
    '  │   ├── __init__.py',
    '  │   └── core.py',
    '  └── tests/',
    '      └── test_main.py',
  ]
  const libraries = techStack.map(s => ({ name: s, url: `https://pypi.org/search/?q=${encodeURIComponent(s)}` }))

  const handleSubmit = () => {
    setSubmitted(true)
    onMarkComplete(weekNum, taskId)
  }

  return (
    <div className={`rh-proj ${isDone ? 'rh-proj--done' : ''}`}>
      <div className="rh-proj__stripe" />

      {/* Header */}
      <div className="rh-proj__header">
        <div className="rh-proj__header-left">
          <FileCode size={15} style={{ color: 'var(--accent-primary)' }} />
          <span className="rh-proj__eyebrow">Mini Project</span>
        </div>
        <div className="rh-proj__badges">
          {project.difficulty && (
            <Pill label={project.difficulty} meta={DIFFICULTY_META} />
          )}
          {isDone && (
            <span className="rh-proj__done-pill">
              <CheckCircle2 size={11} /> Completed
            </span>
          )}
        </div>
      </div>

      <div className="rh-proj__title">{project.title}</div>

      {/* Tab bar */}
      <div className="rh-proj__tabs">
        {projectTabs.map(t => (
          <button
            key={t.id}
            className={`rh-proj__tab ${tab === t.id ? 'rh-proj__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'overview' && (
            <div className="rh-proj__section">
              <p className="rh-proj__desc">{project.description}</p>

              <div className="rh-proj__meta-grid">
                <div className="rh-proj__meta-cell">
                  <Timer size={12} />
                  <span>Est. {project.estimated_hours || '6–10'} hrs</span>
                </div>
                <div className="rh-proj__meta-cell">
                  <Target size={12} />
                  <span>{project.difficulty || 'Beginner'}</span>
                </div>
                <div className="rh-proj__meta-cell">
                  <GraduationCap size={12} />
                  <span>Portfolio Ready</span>
                </div>
                <div className="rh-proj__meta-cell">
                  <Trophy size={12} />
                  <span>Showcase Project</span>
                </div>
              </div>

              <div className="rh-proj__subsection">
                <div className="rh-proj__sub-label"><Zap size={11} /> Tech Stack</div>
                <div className="rh-proj__tags">
                  {techStack.map((s, i) => <span key={i} className="rh-proj__tag">{s}</span>)}
                </div>
              </div>

              <div className="rh-proj__subsection">
                <div className="rh-proj__sub-label"><Target size={11} /> Learning Outcomes</div>
                <ul className="rh-proj__outcomes">
                  <li>Build and ship a real working application</li>
                  <li>Apply {techStack.slice(0, 2).join(' and ')} in practice</li>
                  <li>Write tests and document your code</li>
                  <li>Deploy and share publicly</li>
                </ul>
              </div>
            </div>
          )}

          {tab === 'structure' && (
            <div className="rh-proj__section">
              <div className="rh-proj__sub-label"><FolderOpen size={11} /> Recommended Folder Structure</div>
              <pre className="rh-proj__tree">{folderTree.join('\n')}</pre>

              <div className="rh-proj__sub-label" style={{ marginTop: 'var(--space-4)' }}>
                <AlertCircle size={11} /> Requirements
              </div>
              <ul className="rh-proj__outcomes">
                <li>Git installed and configured</li>
                <li>{techStack[0] || 'Python'} 3.8+ / Node 18+</li>
                <li>GitHub account for version control</li>
                <li>Code editor (VS Code recommended)</li>
              </ul>

              <div className="rh-proj__sub-label" style={{ marginTop: 'var(--space-4)' }}>
                <MonitorPlay size={11} /> Expected Output
              </div>
              <div className="rh-proj__output-box">
                A working application that demonstrates mastery of{' '}
                {techStack.slice(0, 3).join(', ')}. Should include a README with
                setup instructions and a live demo link.
              </div>
            </div>
          )}

          {tab === 'resources' && (
            <div className="rh-proj__section">
              <div className="rh-proj__resource-links">
                <a href="https://github.com/new" target="_blank" rel="noreferrer" className="rh-proj__res-link rh-proj__res-link--github">
                  <GitBranch size={13} /> GitHub Starter
                </a>
                <a href="https://developer.mozilla.org/en-US/" target="_blank" rel="noreferrer" className="rh-proj__res-link rh-proj__res-link--docs">
                  <FileText size={13} /> Documentation
                </a>
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent((project.title || 'python project') + ' tutorial')}`} target="_blank" rel="noreferrer" className="rh-proj__res-link rh-proj__res-link--video">
                  <Play size={13} /> Video Tutorial
                </a>
                <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="rh-proj__res-link rh-proj__res-link--deploy">
                  <Rocket size={13} /> Deploy Guide
                </a>
              </div>

              <div className="rh-proj__sub-label" style={{ marginTop: 'var(--space-4)' }}>
                <Package size={11} /> Useful Libraries
              </div>
              <div className="rh-proj__lib-grid">
                {libraries.map((lib, i) => (
                  <a key={i} href={lib.url} target="_blank" rel="noreferrer" className="rh-proj__lib-chip">
                    {lib.name} <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {tab === 'submit' && (
            <div className="rh-proj__section">
              {isDone ? (
                <div className="rh-proj__done-msg">
                  <CheckCircle2 size={18} />
                  <div>
                    <div className="rh-proj__done-title">Project Completed! 🎉</div>
                    {githubLink && (
                      <a href={githubLink} target="_blank" rel="noreferrer" className="rh-proj__done-link">
                        <GitBranch size={12} /> View Repository
                      </a>
                    )}
                    {liveLink && (
                      <a href={liveLink} target="_blank" rel="noreferrer" className="rh-proj__done-link">
                        <Globe size={12} /> View Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="rh-proj__sub-label"><Upload size={11} /> Submit Your Work</div>
                  <div className="rh-proj__submit-fields">
                    <div className="rh-proj__field">
                      <label className="rh-proj__field-label">
                        <GitBranch size={12} /> GitHub Repository URL
                      </label>
                      <input
                        className="rh-proj__input"
                        placeholder="https://github.com/username/repo"
                        value={githubLink}
                        onChange={e => setGithubLink(e.target.value)}
                      />
                    </div>
                    <div className="rh-proj__field">
                      <label className="rh-proj__field-label">
                        <Globe size={12} /> Live Demo URL (optional)
                      </label>
                      <input
                        className="rh-proj__input"
                        placeholder="https://my-project.vercel.app"
                        value={liveLink}
                        onChange={e => setLiveLink(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="rh-proj__submit-actions">
                    {githubLink && (
                      <a href={githubLink} target="_blank" rel="noreferrer" className="rh-proj__action-link">
                        <Eye size={13} /> Preview Repo
                      </a>
                    )}
                    {liveLink && (
                      <a href={liveLink} target="_blank" rel="noreferrer" className="rh-proj__action-link">
                        <MonitorPlay size={13} /> Open Demo
                      </a>
                    )}
                    <button
                      className="rh-proj__complete-btn"
                      onClick={handleSubmit}
                      disabled={!githubLink}
                    >
                      <CheckCircle2 size={14} /> Mark Project Complete
                    </button>
                  </div>
                  {!githubLink && (
                    <p className="rh-proj__hint">Enter a GitHub URL to unlock the complete button.</p>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Certificate Card ─────────────────────────────────────────

function CertCard({ cert }) {
  return (
    <a href={cert.url} target="_blank" rel="noreferrer" className="rh-cert-card">
      <div className="rh-cert-card__top">
        <div className="rh-cert-card__logo">
          <img
            src={favicon(cert.domain)}
            alt=""
            width={20}
            height={20}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
        <Pill label={cert.badge} meta={BADGE_META} />
      </div>
      <div className="rh-cert-card__name">{cert.title}</div>
      <div className="rh-cert-card__desc">{cert.desc}</div>
      <div className="rh-cert-card__footer">
        <span className="rh-cert-card__duration"><Clock size={11} /> {cert.duration}</span>
        {cert.cert && <span className="rh-cert-card__cert-badge"><Award size={11} /> Certificate</span>}
      </div>
      <div className="rh-cert-card__btn">
        Visit Official Site <ExternalLink size={11} />
      </div>
    </a>
  )
}

// ─── Hackathon Card ───────────────────────────────────────────

function HackathonCard({ h }) {
  return (
    <a href={h.url} target="_blank" rel="noreferrer" className="rh-hack-card">
      <div className="rh-hack-card__icon-wrap" style={{ background: h.color + '18' }}>
        <img
          src={favicon(h.domain)}
          alt=""
          width={22}
          height={22}
          onError={e => { e.target.style.display = 'none' }}
        />
        <span className="rh-hack-card__emoji">{h.icon}</span>
      </div>
      <div className="rh-hack-card__body">
        <div className="rh-hack-card__name">{h.title}</div>
        <div className="rh-hack-card__desc">{h.desc}</div>
        <div className="rh-hack-card__meta">
          <Pill label={h.difficulty} meta={DIFFICULTY_META} />
          <span className="rh-hack-card__participate">
            Participate <ChevronRight size={11} />
          </span>
        </div>
      </div>
    </a>
  )
}

// ─── Open Source Card ─────────────────────────────────────────

function OSSCard({ item }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="rh-oss-card">
      <span className="rh-oss-card__icon">{item.icon}</span>
      <div className="rh-oss-card__body">
        <div className="rh-oss-card__name">{item.title}</div>
        <div className="rh-oss-card__desc">{item.desc}</div>
      </div>
      <ExternalLink size={13} className="rh-oss-card__ext" />
    </a>
  )
}

// ─── Right Sidebar ────────────────────────────────────────────

function RoadmapSidebar({ progressPercent, completedCount, totalTasks, result, favorites, bookmarks }) {
  const [notes, setNotes]         = useState(() => localStorage.getItem('roadmap_notes') || '')
  const [weeklyGoal, setWeeklyGoal] = useState(10)
  const [hoursStudied, setHoursStudied] = useState(0)
  const streak = 3

  // Persist notes
  useEffect(() => { localStorage.setItem('roadmap_notes', notes) }, [notes])

  const r  = 38
  const circ = 2 * Math.PI * r
  const dash = circ - (progressPercent / 100) * circ

  return (
    <aside className="rh-sidebar">

      {/* Progress Ring */}
      <div className="rh-scard">
        <div className="rh-scard__title"><BarChart2 size={13} /> Your Progress</div>
        <div className="rh-scard__ring-wrap">
          <svg width={96} height={96} viewBox="0 0 96 96">
            <circle cx={48} cy={48} r={r} fill="none" stroke="var(--bg-active)" strokeWidth={9} />
            <circle
              cx={48} cy={48} r={r} fill="none"
              stroke="url(#rg)" strokeWidth={9} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={dash}
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="rh-scard__ring-inner">
            <span className="rh-scard__ring-pct">{progressPercent}%</span>
            <span className="rh-scard__ring-sub">{completedCount}/{totalTasks}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="rh-scard">
        <div className="rh-scard__title"><TrendingUp size={13} /> Stats</div>
        <div className="rh-scard__stats-row">
          <div className="rh-scard__stat">
            <Flame size={16} style={{ color: '#f97316' }} />
            <span className="rh-scard__stat-val">{streak}d</span>
            <span className="rh-scard__stat-lbl">Streak</span>
          </div>
          <div className="rh-scard__stat">
            <Clock size={16} style={{ color: '#06b6d4' }} />
            <span className="rh-scard__stat-val">{hoursStudied}h</span>
            <span className="rh-scard__stat-lbl">Today</span>
          </div>
          <div className="rh-scard__stat">
            <Trophy size={16} style={{ color: '#f59e0b' }} />
            <span className="rh-scard__stat-val">{completedCount}</span>
            <span className="rh-scard__stat-lbl">Done</span>
          </div>
        </div>

        <div className="rh-scard__goal-row">
          <span className="rh-scard__goal-label"><Target size={11} /> Weekly Goal: {weeklyGoal}h</span>
          <input
            type="range" min={1} max={40} value={weeklyGoal}
            onChange={e => setWeeklyGoal(+e.target.value)}
            className="rh-scard__slider"
          />
        </div>

        <div className="rh-scard__hours-row">
          <span className="rh-scard__goal-label"><Clock size={11} /> Hours today</span>
          <input
            type="number" min={0} max={24} value={hoursStudied}
            onChange={e => setHoursStudied(+e.target.value)}
            className="rh-scard__num"
          />
        </div>
      </div>

      {/* Favourites */}
      {favorites.length > 0 && (
        <div className="rh-scard">
          <div className="rh-scard__title"><Heart size={13} /> Favourites</div>
          <div className="rh-scard__favs">
            {favorites.slice(0, 5).map((fav, i) => (
              <a key={i} href={fav.url} target="_blank" rel="noreferrer" className="rh-scard__fav-item">
                <img src={favicon(fav.domain)} alt="" width={14} height={14} />
                <span>{fav.title}</span>
                <ExternalLink size={10} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rh-scard">
        <div className="rh-scard__title"><Zap size={13} /> Quick Actions</div>
        <div className="rh-scard__actions">
          <button className="rh-scard__action" onClick={() => window.print()}>
            <Download size={13} /> Download PDF
          </button>
          <button
            className="rh-scard__action"
            onClick={() => {
              if (navigator.share) navigator.share({ title: 'My Career Roadmap', url: window.location.href })
              else navigator.clipboard.writeText(window.location.href)
            }}
          >
            <Share2 size={13} /> Share Progress
          </button>
          <a
            href={`https://roadmap.sh/`}
            target="_blank"
            rel="noreferrer"
            className="rh-scard__action rh-scard__action--link"
          >
            <Map size={13} /> Explore roadmap.sh
          </a>
        </div>
      </div>

      {/* Notes */}
      <div className="rh-scard">
        <div className="rh-scard__title"><StickyNote size={13} /> Notes</div>
        <textarea
          className="rh-scard__notes"
          placeholder="Jot down thoughts, links, ideas…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
        />
      </div>

      {/* Next Milestone */}
      {result?.weeks?.length > 0 && (
        <div className="rh-scard rh-scard--accent">
          <div className="rh-scard__title"><Star size={13} /> Next Milestone</div>
          <div className="rh-scard__milestone">
            {result.weeks[
              Math.min(
                Math.floor((progressPercent / 100) * result.weeks.length),
                result.weeks.length - 1
              )
            ]?.theme || 'Keep going!'}
          </div>
        </div>
      )}
    </aside>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function RoadmapPanel({ data: existingData, formData }) {
  const { memory, updateMemory } = useCareerMemory()

  // ── Form state ──────────────────────────────────────────
  const [mode, setMode] = useState('selection')
  const [currentRole, setCurrentRole] = useState(
    memory?.personal_info?.current_role || formData?.current_role || 'Student'
  )
  const [targetRole, setTargetRole] = useState(
    memory?.personal_info?.target_role || formData?.target_role || ''
  )
  const [timeline, setTimeline] = useState('12')

  const { data, loading, error, execute } = useApi(generateRoadmap)
  const result = data || memory?.career_analysis?.roadmap || (existingData?.weeks ? existingData : null)

  useEffect(() => {
    if (result?.weeks) {
      setMode('roadmap')
    }
  }, [result])


  // Auto-generate (preserved exactly)
  useEffect(() => {
    if (memory?.isActive && currentRole && targetRole && !result?.weeks && !loading && !error) {
      handleGenerate()
    }
  }, [memory?.isActive])

  // ── Progress tracking (preserved exactly) ──────────────────
  const [completedTasks, setCompletedTasks] = useState({})
  const [expandedWeeks, setExpandedWeeks]   = useState([])

  useEffect(() => {
    if (result?.target_role) {
      const key   = `roadmap_progress_${result.target_role.replace(/\s+/g, '_')}`
      const saved = localStorage.getItem(key)
      if (saved) try { setCompletedTasks(JSON.parse(saved)) } catch {}
    }
  }, [result])

  useEffect(() => {
    if (result?.target_role && Object.keys(completedTasks).length > 0) {
      const key = `roadmap_progress_${result.target_role.replace(/\s+/g, '_')}`
      localStorage.setItem(key, JSON.stringify(completedTasks))
    }
  }, [completedTasks, result])

  useEffect(() => {
    if (result?.weeks?.length > 0 && expandedWeeks.length === 0) {
      setExpandedWeeks([result.weeks[0].week_number])
    }
  }, [result])

  // ── New UI state ────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [favorites,    setFavorites]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('roadmap_favorites') || '[]') } catch { return [] }
  })

  const toggleFav = useCallback((resource) => {
    setFavorites(prev => {
      const exists = prev.find(p => p.url === resource.url)
      const next = exists ? prev.filter(p => p.url !== resource.url) : [...prev, resource]
      localStorage.setItem('roadmap_favorites', JSON.stringify(next))
      return next
    })
  }, [])

  // ── Handlers (preserved exactly) ───────────────────────────
  const handleGenerate = async (target, customCurrentRole, customTimeline) => {
    const roleToUse = target || targetRole
    const currentToUse = customCurrentRole || currentRole
    const timeToUse = customTimeline || timeline
    if (!roleToUse.trim()) return
    setTargetRole(roleToUse)
    
    try {
      const res = await execute({
        current_role:   currentToUse,
        target_role:    roleToUse,
        deadline_weeks: parseInt(timeToUse) || 12,
        skill_gaps:     formData?.skill_gaps || [],
        skills:         formData?.skills     || [],
      })
      
      if (res && res.weeks) {
        updateMemory({
          career_analysis: {
            ...memory?.career_analysis,
            roadmap: res
          }
        })
      }
      
      setCompletedTasks({})
      setExpandedWeeks([])
      setMode('roadmap')
    } catch (err) {
      console.error("Failed to generate roadmap", err)
    }
  }

  const toggleTask = (weekNum, taskIndex) => {
    const id = `${weekNum}-${taskIndex}`
    setCompletedTasks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const markProjectComplete = (weekNum, taskId) => {
    setCompletedTasks(prev => ({ ...prev, [taskId]: true }))
  }

  const toggleWeek = (weekNum) => {
    setExpandedWeeks(prev =>
      prev.includes(weekNum)
        ? prev.filter(w => w !== weekNum)
        : [...prev, weekNum]
    )
  }

  // ── Computed progress (preserved exactly) ──────────────────
  const { totalTasks, completedCount, progressPercent } = useMemo(() => {
    if (!result?.weeks) return { totalTasks: 0, completedCount: 0, progressPercent: 0 }
    let total = 0, completed = 0
    result.weeks.forEach(week => {
      if (week.tasks) {
        total += week.tasks.length
        week.tasks.forEach((_, idx) => {
          if (completedTasks[`${week.week_number}-${idx}`]) completed++
        })
      }
    })
    return {
      totalTasks:      total,
      completedCount:  completed,
      progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    }
  }, [result, completedTasks])

  // ── Filtered resources ──────────────────────────────────────

  const show = (section) => activeFilter === 'all' || activeFilter === section

  // ═══════════════════════════════════════════════════════════
  return (
    <div className="rh-panel">

      {/* ── Main content ── */}
      <div className="rh-panel__main">

        {/* Career Selection Step */}
        {mode === 'selection' && (
          <CareerSelection 
            onSelect={(careerTitle) => handleGenerate(careerTitle, currentRole, timeline)} 
            onGenerateCustom={(role, target, time) => handleGenerate(target, role, time)}
            loading={loading}
          />
        )}
        
        {/* Error State */}
        {error && <ErrorState message={error} onRetry={() => handleGenerate()} />}

        {mode === 'roadmap' && (
          <div className="roadmap-panel__actions-top">
            <Button variant="outline" onClick={() => setMode('selection')}>
              <RotateCcw size={14} style={{ marginRight: 6 }} /> Change Career
            </Button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="roadmap-loading">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        )}

        

        {result && !loading && (
          <motion.div
            className="roadmap-panel__results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* ── Progress bar (preserved exactly) ── */}
            <div className="roadmap-progress">
              <div className="roadmap-progress__header">
                <div className="roadmap-progress__stats">
                  <span className="roadmap-progress__stats-title">Overall Progress</span>
                  <div className="roadmap-progress__stats-value">
                    {progressPercent}%{' '}
                    <span>({completedCount}/{totalTasks} Tasks)</span>
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
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            {result.summary && (
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', padding: '0 var(--space-2)' }}>
                {result.summary}
              </p>
            )}

            {/* ── Filter bar ── */}
            <div className="rh-filterbar">
              <div className="rh-filterbar__tabs">
                {FILTER_TABS.map(t => (
                  <button
                    key={t.id}
                    className={`rh-filtertab ${activeFilter === t.id ? 'rh-filtertab--on' : ''}`}
                    onClick={() => setActiveFilter(t.id)}
                  >
                    <t.icon size={12} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="rh-searchbox">
                <Search size={13} className="rh-searchbox__icon" />
                <input
                  className="rh-searchbox__input"
                  placeholder="Search resources…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="rh-searchbox__clear" onClick={() => setSearchQuery('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* ── Week cards ── */}
            {result.weeks?.length > 0 && (
              <div className="roadmap-timeline">
                {result.weeks.map((week, i) => {
                  const isExpanded = expandedWeeks.includes(week.week_number)
                  const weekTotal  = week.tasks?.length || 0
                  const weekDone   = week.tasks?.filter(
                    (_, idx) => completedTasks[`${week.week_number}-${idx}`]
                  ).length || 0
                  const weekPct    = weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100)
                  const isWeekDone = weekTotal > 0 && weekDone === weekTotal
                  
                  // Dynamic Data for this week
                  let weekStudy = getResourcesForTopic(week.theme, result.target_role)
                  if (searchQuery) {
                    const q = searchQuery.toLowerCase()
                    weekStudy = weekStudy.filter(r => r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q))
                  }
                  const weekPractice = getPracticePlatforms(week.theme, result.target_role)
                  const weekProject = week.mini_project || getProjectTemplate(result.target_role, week.week_number)
                  const weekCerts = getCertificates(result.target_role)

                  return (
                    <motion.div
                      key={week.week_number}
                      className={`roadmap-week
                        ${isWeekDone  ? 'roadmap-week--completed' : ''}
                        ${isExpanded  ? 'roadmap-week--expanded'  : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1,  y: 0  }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      {/* Header (preserved exactly + mini-bar) */}
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
                                <span>
                                  <Clock size={12} style={{ display: 'inline', marginRight: 4, position: 'relative', top: 1 }} />
                                  {week.estimated_hours}h
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="roadmap-week__header-actions">
                          <div className="rh-minibar">
                            <div className="rh-minibar__track">
                              <div className="rh-minibar__fill" style={{ width: `${weekPct}%` }} />
                            </div>
                            <span className="rh-minibar__label">{weekDone}/{weekTotal}</span>
                          </div>
                          <ChevronDown size={20} className="roadmap-week__expand-icon" />
                        </div>
                      </div>

                      {/* Body */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            className="roadmap-week__body"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                          >
                            <div className="roadmap-week__body-content">

                              {/* ── Objectives ── */}
                              {week.learning_objectives?.length > 0 && show('study') && (
                                <div className="roadmap-section">
                                  <div className="roadmap-section__title">
                                    <Target size={15} className="roadmap-section__title-icon" />
                                    Learning Objectives
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

                              {/* ── Action Items ── */}
                              {week.tasks?.length > 0 && (show('study') || show('practice')) && (
                                <div className="roadmap-section">
                                  <div className="roadmap-section__title">
                                    <LayoutList size={15} className="roadmap-section__title-icon" />
                                    Action Items
                                  </div>
                                  <div className="roadmap-tasks">
                                    {week.tasks.map((task, idx) => {
                                      const id   = `${week.week_number}-${idx}`
                                      const done = completedTasks[id]
                                      return (
                                        <div
                                          key={idx}
                                          className={`roadmap-task ${done ? 'roadmap-task--completed' : ''}`}
                                          onClick={() => toggleTask(week.week_number, idx)}
                                        >
                                          <div className="roadmap-task__checkbox">
                                            {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
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
                                                  <span className="roadmap-task__meta-item" style={{ textTransform: 'capitalize' }}>
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

                              {/* ── Study Resources ── */}
                              {show('study') && (
                                <div className="roadmap-section">
                                  <div className="roadmap-section__title">
                                    <BookOpen size={15} className="roadmap-section__title-icon" />
                                    Recommended Resources
                                    <span className="rh-count">{weekStudy.length + (week.resources?.length || 0)}</span>
                                  </div>
                                  <div className="rh-res-grid">
                                    {weekStudy.map((res, idx) => (
                                      <ResourceCard
                                        key={idx}
                                        resource={res}
                                        isFav={favorites.some(f => f.url === res.url)}
                                        onFav={() => toggleFav(res)}
                                      />
                                    ))}
                                    {/* API resources (if backend provided any) */}
                                    {week.resources?.map((res, idx) => (
                                      <ResourceCard
                                        key={`api-${idx}`}
                                        resource={{
                                          title:      res.title,
                                          url:        res.url || '#',
                                          type:       res.type || 'Tutorial',
                                          desc:       res.skill || 'Learning resource',
                                          time:       'Variable',
                                          difficulty: 'All Levels',
                                          domain:     (() => { try { return new URL(res.url).hostname } catch { return 'example.com' } })(),
                                        }}
                                        isFav={favorites.some(f => f.url === (res.url || '#'))}
                                        onFav={() => toggleFav({
                                          title: res.title, url: res.url || '#', type: res.type || 'Tutorial', 
                                          desc: res.skill || 'Learning resource', time: 'Variable', 
                                          difficulty: 'All Levels', 
                                          domain: (() => { try { return new URL(res.url).hostname } catch { return 'example.com' } })()
                                        })}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ── Practice Platforms ── */}
                              {show('practice') && (
                                <div className="roadmap-section">
                                  <div className="roadmap-section__title">
                                    <Code2 size={15} className="roadmap-section__title-icon" />
                                    Practice Platforms
                                  </div>
                                  <div className="rh-prac-grid">
                                    {weekPractice.map((p, idx) => (
                                      <PracticeCard key={idx} platform={p} />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ── Weekly Review Center ── */}
                              {show('quiz') && (
                                <div className="roadmap-section">
                                  <div className="roadmap-section__title">
                                    <Brain size={15} className="roadmap-section__title-icon" />
                                    Weekly Review Center
                                  </div>
                                  <ReviewCenter weekKey={`${result.target_role}-${week.week_number}`} />
                                </div>
                              )}

                              {/* ── Mini Project ── */}
                              {show('project') && (
                                <div className="roadmap-section">
                                  <ProjectCard
                                    project={weekProject}
                                    weekNum={week.week_number}
                                    completedTasks={completedTasks}
                                    onMarkComplete={markProjectComplete}
                                  />
                                </div>
                              )}

                              {/* ── Certificates ── */}
                              {show('certificates') && (
                                <div className="roadmap-section">
                                  <div className="roadmap-section__title">
                                    <Award size={15} className="roadmap-section__title-icon" />
                                    Earn Certificates
                                  </div>
                                  <div className="rh-cert-grid">
                                    {weekCerts.map((c, idx) => (
                                      <CertCard key={idx} cert={c} />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ── Hackathons ── */}
                              {show('hackathons') && (
                                <div className="roadmap-section">
                                  <div className="roadmap-section__title">
                                    <Rocket size={15} className="roadmap-section__title-icon" />
                                    Hackathons
                                  </div>
                                  <div className="rh-hack-grid">
                                    {HACKATHONS.map((h, idx) => (
                                      <HackathonCard key={idx} h={h} />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ── Open Source ── */}
                              {show('opensource') && (
                                <div className="roadmap-section">
                                  <div className="roadmap-section__title">
                                    <GitBranch size={15} className="roadmap-section__title-icon" />
                                    Open Source Opportunities
                                  </div>
                                  <div className="rh-oss-grid">
                                    {OPEN_SOURCE.map((item, idx) => (
                                      <OSSCard key={idx} item={item} />
                                    ))}
                                  </div>
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


      </div>

      {/* ── Sidebar ── */}
      {result && !loading && (
        <RoadmapSidebar
          progressPercent={progressPercent}
          completedCount={completedCount}
          totalTasks={totalTasks}
          result={result}
          favorites={favorites}
          bookmarks={[]}
        />
      )}
    </div>
  )
}
