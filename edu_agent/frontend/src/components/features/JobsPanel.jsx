import { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Search, MapPin, Sparkles } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { searchJobs } from '../../services/api'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import { SkeletonCard } from '../ui/Skeleton'
import './JobsPanel.css'

export default function JobsPanel({ data: existingData, formData }) {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const { data, loading, error, execute } = useApi(searchJobs)
  const result = data || existingData

  const handleSearch = async () => {
    if (!query.trim()) return
    await execute(query, location)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="jobs-panel">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="md">
          <div className="jobs-panel__header">
            <Briefcase size={20} style={{ color: 'var(--accent-secondary)' }} />
            <h3>Search Jobs</h3>
          </div>
          <div className="jobs-panel__form">
            <Input icon={Search} label="Job Title or Keyword" placeholder="e.g. Python Developer" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
            <Input icon={MapPin} label="Location (optional)" placeholder="e.g. Hyderabad" value={location} onChange={(e) => setLocation(e.target.value)} onKeyDown={handleKeyDown} />
            <Button variant="primary" icon={Sparkles} loading={loading} disabled={!query.trim()} onClick={handleSearch}>Search Jobs</Button>
          </div>
        </Card>
      </motion.div>

      {loading && <div className="jobs-panel__grid">{Array.from({length:4}).map((_,i)=><SkeletonCard key={i} lines={3}/>)}</div>}
      {error && <ErrorState message={error} onRetry={handleSearch} />}

      {result && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {result.total_found > 0 && <p className="jobs-panel__count">{result.total_found} jobs found for "{result.query}"</p>}
          {result.matches?.length > 0 ? (
            <div className="jobs-panel__grid">
              {result.matches.map((job, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card hover padding="md" className="jobs-panel__card">
                    <h4>{job.title || job.role || 'Job Opportunity'}</h4>
                    <p className="jobs-panel__company">{job.company || 'Company'}</p>
                    {job.location && <div className="jobs-panel__loc"><MapPin size={12}/>{job.location}</div>}
                    {job.salary && <Badge variant="success" size="sm">{job.salary}</Badge>}
                    {job.description && <p className="jobs-panel__desc">{job.description}</p>}
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Briefcase} title="No matches found" description="Try a different search query or location." />
          )}
        </motion.div>
      )}

      {!result && !loading && !error && <EmptyState icon={Briefcase} title="Search for jobs" description="Enter a job title or keyword above to find matching opportunities." />}
    </div>
  )
}
