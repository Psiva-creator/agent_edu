import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, Map, Briefcase, TrendingUp, MessageCircle,
} from 'lucide-react'
import Tabs from '../components/ui/Tabs'
import EmptyState from '../components/ui/EmptyState'
import OverviewPanel from '../components/features/OverviewPanel'
import ResumePanel from '../components/features/ResumePanel'
import RoadmapPanel from '../components/features/RoadmapPanel'
import JobsPanel from '../components/features/JobsPanel'
import MarketPanel from '../components/features/MarketPanel'
import MentorPanel from '../components/features/MentorPanel'
import './DashboardPage.css'

const TAB_LIST = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'resume',    label: 'Resume',    icon: FileText },
  { id: 'roadmap',   label: 'Roadmap',   icon: Map },
  { id: 'jobs',      label: 'Jobs',      icon: Briefcase },
  { id: 'market',    label: 'Market',    icon: TrendingUp },
  { id: 'mentor',    label: 'Mentor',    icon: MessageCircle },
]

export default function DashboardPage() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(tab || 'overview')
  const [data, setData] = useState(null)
  const [formData, setFormData] = useState(null)

  useEffect(() => {
    // Load analysis results from session storage
    const storedResult = sessionStorage.getItem('analysisResult')
    const storedForm = sessionStorage.getItem('analysisFormData')
    if (storedResult) {
      try { setData(JSON.parse(storedResult)) } catch { setData(null) }
    }
    if (storedForm) {
      try { setFormData(JSON.parse(storedForm)) } catch { setFormData(null) }
    }
  }, [])

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
      default:
        return <EmptyState title="Tab not found" description="Select a tab from the navigation." />
    }
  }

  return (
    <div className="dashboard-page">
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
