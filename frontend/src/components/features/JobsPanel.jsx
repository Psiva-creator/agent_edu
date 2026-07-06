import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Search, MapPin, Sparkles, ExternalLink, Info } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { searchJobs } from '../../services/api'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import ErrorState from '../ui/ErrorState'
import { SkeletonCard } from '../ui/Skeleton'
import Dialog from '../ui/Dialog'
import './JobsPanel.css'

export default function JobsPanel({ data: existingData, formData }) {
  const { memory } = useCareerMemory()
  
  const [query, setQuery] = useState(memory?.personal_info?.target_role || formData?.target_role || '')
  const [location, setLocation] = useState(memory?.personal_info?.location || formData?.location || '')
  const [selectedJob, setSelectedJob] = useState(null)
  
  const { data, loading, error, execute } = useApi(searchJobs)
  const result = data || existingData

  useEffect(() => {
    // Auto-search if we have a query from memory and haven't searched yet
    if (query && !data && !existingData?.matches) {
      execute(query, location)
    }
  }, [memory.isActive])

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
                  <Card hover padding="md" className="jobs-panel__card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <h4>{job.title || job.role || 'Job Opportunity'}</h4>
                      <p className="jobs-panel__company">{job.company || 'Company'}</p>
                      {job.location && <div className="jobs-panel__loc"><MapPin size={12}/>{job.location}</div>}
                      {job.salary && <Badge variant="success" size="sm">{job.salary}</Badge>}
                      {job.description && <p className="jobs-panel__desc">{job.description}</p>}
                    </div>
                    {job.url && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          icon={Info} 
                          onClick={() => setSelectedJob(job)}
                        >
                          View More
                        </Button>
                        <Button 
                          variant="primary" 
                          size="sm" 
                          icon={ExternalLink} 
                          onClick={() => window.open(job.url, '_blank')}
                        >
                          {job.url?.includes('linkedin.com') ? 'Apply on LinkedIn' : 'Apply Now'}
                        </Button>
                      </div>
                    )}
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
      
      {/* Job Details Dialog */}
      <Dialog 
        open={!!selectedJob} 
        onClose={() => setSelectedJob(null)}
        title={selectedJob?.title || 'Job Details'}
      >
        {selectedJob && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '18px' }}>{selectedJob.company}</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <MapPin size={14}/> {selectedJob.location || 'Remote'}
              </p>
            </div>
            
            {selectedJob.salary && (
              <div>
                <Badge variant="success">{selectedJob.salary}</Badge>
              </div>
            )}
            
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <h5 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Job Description</h5>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {selectedJob.description || 'No detailed description provided.'}
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button 
                variant="primary" 
                icon={ExternalLink} 
                onClick={() => window.open(selectedJob.url, '_blank')}
              >
                {selectedJob.url?.includes('linkedin.com') ? 'Apply on LinkedIn' : 'Apply Now'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
