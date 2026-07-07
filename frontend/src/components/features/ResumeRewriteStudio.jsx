import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Copy, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react'
import { rewriteResumeBullets } from '../../services/api'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import './ResumeRewriteStudio.css'

export default function ResumeRewriteStudio() {
  const { memory } = useCareerMemory()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rewrites, setRewrites] = useState([])
  const [acceptedIds, setAcceptedIds] = useState(new Set())
  const [rejectedIds, setRejectedIds] = useState(new Set())
  const [copiedId, setCopiedId] = useState(null)

  const handleScan = async () => {
    const resumeText = memory.personal_info?.resume_text || memory.raw_report?.resume_text
    const targetRole = memory.personal_info?.target_role || 'Software Engineer'

    if (!resumeText) {
      setError("No resume text found. Please upload a resume in the Resume tab first.")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await rewriteResumeBullets({ resume_text: resumeText, target_role: targetRole })
      if (data && data.rewrites) {
        setRewrites(data.rewrites.map((r, idx) => ({ ...r, id: `rewrite-${idx}` })))
        setAcceptedIds(new Set())
        setRejectedIds(new Set())
      }
    } catch (err) {
      setError("Failed to generate rewrites. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = (id) => {
    setAcceptedIds(prev => new Set(prev).add(id))
    setRejectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    
    // Dispatch event to CareerScoreEngine to update scores live
    window.dispatchEvent(new CustomEvent('resume-score-increment', { detail: { amount: 2 } }))
  }

  const handleReject = (id) => {
    setRejectedIds(prev => new Set(prev).add(id))
    setAcceptedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyAllAccepted = () => {
    const textToCopy = rewrites
      .filter(r => acceptedIds.has(r.id))
      .map(r => r.improved)
      .join('\n\n')
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
      // Visual feedback could be added here
    }
  }

  return (
    <div className="rewrite-studio">
      <div className="rewrite-studio-header">
        <div>
          <h3>AI Resume Rewrite Studio</h3>
          <p className="text-muted text-sm mt-1">Identify and upgrade weak bullet points with ATS-optimized, high-impact language.</p>
        </div>
        <button 
          className="scan-button" 
          onClick={handleScan} 
          disabled={loading}
        >
          <Sparkles size={18} />
          {loading ? 'Scanning...' : 'Scan for Improvements'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing resume and generating high-impact rewrites...</p>
        </div>
      )}

      {!loading && rewrites.length === 0 && !error && (
        <div className="empty-state">
          <Sparkles className="mx-auto mb-3 opacity-50" size={32} />
          <p>Click "Scan for Improvements" to let AI find weak bullet points and suggest better alternatives.</p>
        </div>
      )}

      {!loading && rewrites.length > 0 && (
        <div className="rewrite-cards">
          <AnimatePresence>
            {rewrites.map((rewrite) => {
              const isAccepted = acceptedIds.has(rewrite.id)
              const isRejected = rejectedIds.has(rewrite.id)
              
              return (
                <motion.div 
                  key={rewrite.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rewrite-card ${isAccepted ? 'accepted' : ''} ${isRejected ? 'rejected' : ''}`}
                >
                  <div className="comparison-grid">
                    {/* Original */}
                    <div className="bullet-section">
                      <span className="bullet-label">Original Bullet</span>
                      <div className="bullet-content original-bullet">
                        {rewrite.original}
                      </div>
                    </div>

                    {/* Improved */}
                    <div className="bullet-section">
                      <span className="bullet-label text-primary">AI Improved</span>
                      <div className="bullet-content improved-bullet">
                        {rewrite.improved}
                      </div>
                    </div>
                  </div>

                  {/* Explanations */}
                  {rewrite.explanation && (
                    <div className="explanation-section">
                      <h4 className="explanation-label">Why AI changed it:</h4>
                      <div className="badges-grid">
                        {Object.entries(rewrite.explanation).map(([key, value]) => {
                          if (!value) return null;
                          return (
                            <div key={key} className={`explanation-badge badge-${key}`}>
                              {key.replace('_', ' ').toUpperCase()}
                              <div className="tooltip">{value}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="card-actions">
                    <button 
                      className="action-btn btn-reject" 
                      onClick={() => handleReject(rewrite.id)}
                      disabled={isRejected}
                    >
                      <X size={16} /> Reject
                    </button>
                    
                    <button 
                      className="action-btn btn-copy" 
                      onClick={() => handleCopy(rewrite.id, rewrite.improved)}
                    >
                      {copiedId === rewrite.id ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={16} />}
                      {copiedId === rewrite.id ? 'Copied' : 'Copy'}
                    </button>

                    <button 
                      className="action-btn btn-accept" 
                      onClick={() => handleAccept(rewrite.id)}
                      disabled={isAccepted}
                    >
                      <Check size={16} /> {isAccepted ? 'Accepted' : 'Accept Rewrite'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {acceptedIds.size > 0 && (
            <div className="flex justify-end mt-4">
              <button 
                className="scan-button"
                onClick={handleCopyAllAccepted}
              >
                <Copy size={18} /> Copy All Accepted
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
