import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, Copy, CheckCircle2, AlertCircle, Sparkles, Wand2, Info } from 'lucide-react'
import { generateCoverLetter, exportCoverLetterPdf, exportCoverLetterDocx } from '../../services/api'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import './CoverLetterStudio.css'

const TONES = ['Formal', 'Startup', 'Corporate', 'Friendly', 'Executive']

export default function CoverLetterStudio() {
  const { memory } = useCareerMemory()
  const [tone, setTone] = useState('Formal')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Array of { text, explanation }
  const [paragraphs, setParagraphs] = useState([])
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(null)

  // Auto-resize textareas
  const textareaRefs = useRef([])

  const adjustTextareaHeight = (element) => {
    if (element) {
      element.style.height = 'auto'
      element.style.height = `${element.scrollHeight}px`
    }
  }

  useEffect(() => {
    textareaRefs.current.forEach(adjustTextareaHeight)
  }, [paragraphs])

  const handleGenerate = async () => {
    const resumeText = memory.personal_info?.resume_text || memory.raw_report?.resume_text
    const targetRole = memory.personal_info?.target_role || 'Software Engineer'
    const skills = memory.personal_info?.skills || []
    const experienceYears = memory.personal_info?.experience_years || 0
    const projects = memory.raw_report?.projects || []

    if (!resumeText) {
      setError("No resume text found in Career Memory. Please analyze your resume first.")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await generateCoverLetter({
        resume_text: resumeText,
        target_role: targetRole,
        skills,
        experience_years: experienceYears,
        projects,
        job_description: jobDescription,
        tone
      })
      
      if (data && data.paragraphs) {
        setParagraphs(data.paragraphs)
      }
    } catch (err) {
      setError("Failed to generate cover letter. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleParagraphChange = (index, newText) => {
    const newParagraphs = [...paragraphs]
    newParagraphs[index].text = newText
    setParagraphs(newParagraphs)
  }

  const handleCopy = () => {
    const textToCopy = paragraphs.map(p => p.text).join('\n\n')
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async (type) => {
    setDownloading(type)
    try {
      const texts = paragraphs.map(p => p.text)
      const name = memory.personal_info?.name || 'Candidate'
      const role = memory.personal_info?.target_role || 'Role'
      
      let blob;
      if (type === 'pdf') {
        blob = await exportCoverLetterPdf({ paragraphs: texts, name, target_role: role })
      } else {
        blob = await exportCoverLetterDocx({ paragraphs: texts, name, target_role: role })
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}_Cover_Letter.${type}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError(`Failed to download ${type.toUpperCase()}.`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="cover-letter-studio">
      <div className="cls-header">
        <div>
          <h3>Cover Letter Generator</h3>
          <p className="text-muted text-sm mt-1">Generate a highly personalized cover letter using your Career Memory.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="mt-0.5 flex-shrink-0" size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="cls-controls">
        <div className="cls-row">
          <label className="cls-label">Select Tone</label>
          <div className="cls-tones">
            {TONES.map(t => (
              <button
                key={t}
                className={`tone-btn ${tone === t ? 'active' : ''}`}
                onClick={() => setTone(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="cls-row">
          <label className="cls-label">Selected Job Description (Optional)</label>
          <textarea 
            className="cls-textarea"
            placeholder="Paste the job description here so the AI can match your skills perfectly..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <button 
          className="cls-generate-btn" 
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderTopColor: 'white' }}></div>
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={18} />
              {paragraphs.length > 0 ? 'Regenerate Cover Letter' : 'Generate Cover Letter'}
            </>
          )}
        </button>
      </div>

      {/* Preview Area */}
      {paragraphs.length > 0 && !loading && (
        <motion.div 
          className="cls-preview-area"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="cls-actions">
            <button className="cls-action-btn" onClick={handleCopy}>
              {copied ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
            <button 
              className="cls-action-btn" 
              onClick={() => handleDownload('pdf')}
              disabled={downloading !== null}
            >
              <FileText size={16} /> 
              {downloading === 'pdf' ? 'Generating...' : 'Download PDF'}
            </button>
            <button 
              className="cls-action-btn" 
              onClick={() => handleDownload('docx')}
              disabled={downloading !== null}
            >
              <Download size={16} /> 
              {downloading === 'docx' ? 'Generating...' : 'Download DOCX'}
            </button>
          </div>

          <div className="cls-document">
            {paragraphs.map((p, idx) => (
              <div key={idx} className="cls-paragraph-wrap">
                <textarea
                  ref={el => textareaRefs.current[idx] = el}
                  className="cls-paragraph-input"
                  value={p.text}
                  onChange={(e) => {
                    handleParagraphChange(idx, e.target.value)
                    adjustTextareaHeight(e.target)
                  }}
                />
                <div className="cls-explanation">
                  <Sparkles size={14} />
                  <span>{p.explanation}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
