import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, Map, Briefcase, TrendingUp, MessageCircle, CheckCircle2, ShieldCheck, Clock, Brain
} from 'lucide-react'
import Tabs from '../components/ui/Tabs'
import EmptyState from '../components/ui/EmptyState'
import OverviewPanel from '../components/features/OverviewPanel'
import ResumePanel from '../components/features/ResumePanel'
import RoadmapPanel from '../components/features/RoadmapPanel'
import JobsPanel from '../components/features/JobsPanel'
import MarketPanel from '../components/features/MarketPanel'
import MentorPanel from '../components/features/MentorPanel'
import InterviewPanel from '../components/features/InterviewPanel'
import { useCareerMemory } from '../hooks/useCareerMemory'
import './DashboardPage.css'

const TAB_LIST = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'resume',    label: 'Resume',    icon: FileText },
  { id: 'roadmap',   label: 'Roadmap',   icon: Map },
  { id: 'jobs',      label: 'Jobs',      icon: Briefcase },
  { id: 'market',    label: 'Market',    icon: TrendingUp },
  { id: 'mentor',    label: 'Mentor',    icon: MessageCircle },
  { id: 'interview', label: 'Interview', icon: Brain },
]

export default function DashboardPage() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(tab || 'overview')
  const { memory } = useCareerMemory()

  // We no longer rely on sessionStorage directly in the page.
  // The context handles all state.
  const data = memory.raw_report
  const formData = memory.personal_info

  useEffect(() => {
    if (tab && tab !== activeTab) setActiveTab(tab)
  }, [tab])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    navigate(`/dashboard/${tabId}`, { replace: true })
  }

  const renderPanel = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel data={data} formData={formData} />
      case 'resume':
        return <ResumePanel data={data} formData={formData} />
      case 'roadmap':
        return <RoadmapPanel data={data} formData={formData} />
      case 'jobs':
        return <JobsPanel data={data} formData={formData} />
      case 'market':
        return <MarketPanel data={data} formData={formData} />
      case 'mentor':
        return <MentorPanel data={data} formData={formData} />
      case 'interview':
        return <InterviewPanel data={data} formData={formData} />
      default:
        return <EmptyState title="Tab not found" description="Select a tab from the navigation." />
    }
  }

  const calculateCompletion = () => {
    if (!memory.isActive) return 0;
    let score = 50; // Base score for having active memory
    if (memory.resume_intelligence?.skills?.length > 0) score += 20;
    if (memory.personal_info?.experience_years > 0) score += 10;
    if (memory.personal_info?.target_role) score += 10;
    if (memory.resume_intelligence?.resume_score > 0) score += 10;
    return score;
  }

  return (
    <div className="dashboard-page">
      {memory.isActive && (
        <motion.div 
          className="dashboard-page__memory-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="memory-banner__header">
            <ShieldCheck className="memory-banner__icon" size={20} />
            <span className="memory-banner__title">Global Career Memory Active</span>
            <div className="memory-banner__badge">Profile Completion: {calculateCompletion()}%</div>
          </div>
          <div className="memory-banner__details">
            <div className="memory-banner__stat">
              <Clock size={14} />
              <span>Synced {new Date(memory.lastUpdated || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="memory-banner__agents">
              <span className="agents-label">Shared Intelligence Across:</span>
              <span className="agent-tag"><CheckCircle2 size={12}/> Career</span>
              <span className="agent-tag"><CheckCircle2 size={12}/> Resume</span>
              <span className="agent-tag"><CheckCircle2 size={12}/> Roadmap</span>
              <span className="agent-tag"><CheckCircle2 size={12}/> Jobs</span>
              <span className="agent-tag"><CheckCircle2 size={12}/> Market</span>
              <span className="agent-tag"><CheckCircle2 size={12}/> Mentor</span>
              <span className="agent-tag"><CheckCircle2 size={12}/> Interview</span>
            </div>
          </div>
        </motion.div>
      )}

      <Tabs
        tabs={TAB_LIST}
        activeTab={activeTab}
        onChange={handleTabChange}
      />
      <motion.div
        key={activeTab}
        className="dashboard-page__content"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {renderPanel()}
      </motion.div>
    </div>
  )
}
