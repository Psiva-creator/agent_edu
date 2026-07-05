import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  DollarSign,
  Building2,
  Target,
  Download,
  RefreshCw,
  Flame,
  Zap,
  Rocket,
  Award,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Card from '../components/Card'
import Button from '../components/Button'
import ScoreRing from '../components/ScoreRing'
import SkillBadge from '../components/SkillBadge'
import InsightCard from '../components/InsightCard'
import RoadmapTimeline from '../components/RoadmapTimeline'
import ResumeView from '../components/ResumeView'
import MentorCard from '../components/MentorCard'
import DashboardSidebar from '../components/DashboardSidebar'
import Loading from '../components/Loading'
import AnimatedBackground from '../components/ui/AnimatedBackground'
import PageTransition from '../components/ui/PageTransition'
import Container from '../components/ui/Container'
import { getReportPdf } from '../services/api'
import { mockCareerAnalysis, mockRoadmap, mockMentor, mockResume } from '../services/mockData'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'resume', label: 'Resume' },
  { id: 'mentor', label: 'Mentor' },
]

function normalizeCareerData(raw) {
  if (!raw) return mockCareerAnalysis

  if (raw.readiness_score !== undefined) {
    const salary = raw.expected_salary || {}
    const salaryMin = salary.min ? `₹${(salary.min / 100000).toFixed(0)}L` : ''
    const salaryMax = salary.max ? `₹${(salary.max / 100000).toFixed(0)}L` : ''
    const avgSalary = salaryMin && salaryMax ? `${salaryMin} - ${salaryMax}` : '₹12-25 LPA'

    return {
      score: raw.readiness_score || 0,
      skill_gaps: raw.skill_gaps || [],
      recommendations: raw.next_steps || [],
      market_insights: {
        demand_level: raw.readiness_label || 'Developing',
        avg_salary: avgSalary,
        growth_rate: `${Math.round(raw.readiness_score)}% readiness`,
        top_companies: raw.hiring_companies || [],
        industry_trends: raw.strengths || [],
        job_openings: (raw.target_roles || []).length * 5000 || 15000,
        competition_level: raw.weaknesses?.length > 3 ? 'High' : 'Moderate',
      },
      _report: raw,
    }
  }

  return raw
}

function normalizeRoadmapData(raw) {
  if (!raw) return mockRoadmap

  if (raw.weeks && Array.isArray(raw.weeks)) {
    const milestones = raw.weeks.map((week) => ({
      month: week.week_number,
      title: week.theme || `Week ${week.week_number}`,
      description: week.learning_objectives?.join('. ') || week.phase || '',
      tasks: (week.tasks || []).map((t) => t.title || t),
      status: week.week_number === 1 ? 'current' : 'upcoming',
    }))

    const resources = (raw.weeks || [])
      .flatMap((w) => w.resources || [])
      .slice(0, 6)
      .map((r) => ({
        title: r.title || '',
        type: r.type === 'docs' ? 'Course' : r.type === 'youtube' ? 'Course' : 'Practice',
        url: r.url || '#',
        priority: 'High',
      }))

    return { milestones, resources, estimated_timeline: `${raw.total_weeks || 10} weeks` }
  }

  return raw
}

function buildMentorData(careerRaw) {
  if (!careerRaw || !careerRaw.readiness_score) return mockMentor

  return {
    name: 'AI Career Mentor',
    specialty: `${careerRaw.target_role || 'Software Engineering'} & Career Growth`,
    avatar_emoji: '🧠',
    greeting: careerRaw.candidate_summary || mockMentor.greeting,
    advice: [
      { topic: 'Career Strategy', message: careerRaw.overall_recommendation || mockMentor.advice[0].message },
      { topic: 'Learning Roadmap', message: careerRaw.roadmap_summary || mockMentor.advice[1].message },
      { topic: 'Personalized Advice', message: careerRaw.mentor_advice || mockMentor.advice[2].message },
      { topic: 'Next Steps', message: (careerRaw.next_steps || []).join('. ') || mockMentor.advice[3].message },
    ],
  }
}

const tabVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('dashboardData')
    if (stored) {
      try {
        setData(JSON.parse(stored))
      } catch {
        setData(null)
      }
    }
    setLoading(false)
  }, [])

  const careerRaw = data?.career || null
  const career = normalizeCareerData(careerRaw)
  const roadmap = normalizeRoadmapData(data?.roadmap || null)
  const mentor = buildMentorData(careerRaw)
  const formData = data?.formData || {
    name: 'User',
    current_role: 'Computer Science Student',
    target_role: 'Senior Software Engineer',
    skills: ['JavaScript', 'React', 'Python', 'Node.js', 'HTML/CSS'],
  }

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      const blob = await getReportPdf()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formData.name.replace(/\s+/g, '_')}_career_report.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      alert('Failed to download PDF report. Make sure a report was generated.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-x-hidden flex flex-col">
      <AnimatedBackground />
      <Navbar />

      <PageTransition>
        <main className="relative pt-24 pb-20 flex-1 w-full">
          <Container>
            {/* Header */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
                    Your Career <span className="gradient-text">Dashboard</span>
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5">
                    {formData.name} · {formData.current_role} → {formData.target_role}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={handleDownloadPdf} disabled={downloading}>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    {downloading ? 'Exporting...' : 'Export PDF'}
                  </Button>
                  <Link to="/analyze">
                    <Button variant="primary" size="sm">
                      <RefreshCw className="w-4 h-4" aria-hidden="true" />
                      New Analysis
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Mobile tabs */}
            <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2" role="tablist" aria-label="Dashboard tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`tab-btn shrink-0 ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Layout: sidebar + content */}
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[256px_1fr] gap-8 items-start w-full">
              <DashboardSidebar
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                formData={formData}
              />

              <div className="min-w-0 w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    variants={tabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    role="tabpanel"
                    aria-label={`${activeTab} tab`}
                  >
                    {activeTab === 'overview' && <OverviewTab career={career} formData={formData} />}
                    {activeTab === 'roadmap' && (
                      <RoadmapTimeline
                        milestones={roadmap.milestones}
                        resources={roadmap.resources}
                        estimatedTimeline={roadmap.estimated_timeline}
                      />
                    )}
                    {activeTab === 'resume' && <ResumeView data={mockResume} />}
                    {activeTab === 'mentor' && <MentorCard mentor={mentor} careerContext={formData} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Container>
        </main>
      </PageTransition>

      <Footer />
    </div>
  )
}

function OverviewTab({ career, formData }) {
  return (
    <div className="space-y-6 w-full">
      {/* Row 1: Score Ring + 4 Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-4">
          <Card className="flex flex-col items-center justify-center py-10 w-full" static>
            <ScoreRing score={career.score} size={180} label="Career Readiness Score" />
          </Card>
        </div>
        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InsightCard icon={TrendingUp} title="Demand Level" value={career.market_insights?.demand_level || 'High'} subtitle={career.market_insights?.growth_rate || '22% YoY'} trend="up" index={0} />
          <InsightCard icon={DollarSign} title="Salary Range" value={career.market_insights?.avg_salary || '₹12-25 LPA'} subtitle="Market avg" trend="neutral" index={1} />
          <InsightCard icon={Building2} title="Job Openings" value={career.market_insights?.job_openings?.toLocaleString() || '15,400'} subtitle={career.market_insights?.competition_level || 'Moderate'} trend="up" index={2} />
          <InsightCard icon={Target} title="Skill Gaps" value={career.skill_gaps?.length || 0} subtitle="To bridge" trend="down" index={3} />
        </div>
      </div>

      {/* Row 2: Recommendations + Skill Gaps */}
      {(career.recommendations?.length > 0 || career.skill_gaps?.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {career.recommendations?.length > 0 && (
            <Card className="gradient-border w-full" static glow>
              <h3 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-accent-400" aria-hidden="true" />
                AI Recommendations
              </h3>
              <ol className="space-y-4">
                {career.recommendations.map((rec, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <span className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-300 leading-relaxed pt-1">{rec}</span>
                  </motion.li>
                ))}
              </ol>
            </Card>
          )}

          {career.skill_gaps?.length > 0 && (
            <Card className="w-full" static>
              <h3 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-rose-400" aria-hidden="true" />
                Skill Gaps to Bridge
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {career.skill_gaps.map((skill, i) => (
                  <SkillBadge key={skill} skill={skill} type="gap" index={i} />
                ))}
              </div>
              {formData.skills?.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    Your Current Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, i) => (
                      <SkillBadge key={skill} skill={skill} type="mastered" index={i} />
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Row 3: Industry Trends + Top Companies */}
      {(career.market_insights?.industry_trends?.length > 0 || career.market_insights?.top_companies?.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {career.market_insights?.industry_trends?.length > 0 && (
            <Card className="w-full" static>
              <h3 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" aria-hidden="true" />
                Industry Trends
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {career.market_insights.industry_trends.map((trend, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl bg-dark-800/40 border border-white/5"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <span className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-300 leading-relaxed">{trend}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {career.market_insights?.top_companies?.length > 0 && (
            <Card className="w-full" static>
              <h3 className="text-lg font-bold text-white font-display mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent-400" aria-hidden="true" />
                Top Hiring Companies
              </h3>
              <div className="flex flex-wrap gap-3">
                {career.market_insights.top_companies.map((company, i) => (
                  <motion.div
                    key={company}
                    className="px-4 py-2.5 rounded-xl bg-dark-800/40 border border-white/5 text-sm font-medium text-slate-300 hover:border-accent-500/30 hover:text-white transition-all duration-300"
                    whileHover={{ y: -2 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    {company}
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard
