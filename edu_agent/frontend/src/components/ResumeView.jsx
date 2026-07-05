import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Lightbulb, FileText } from 'lucide-react'
import ScoreRing from './ScoreRing'
import Button from './Button'
import ProgressBar from './ui/ProgressBar'
import { analyzeResume } from '../services/api'

const SCORE_COLORS = {
  emerald: { bar: 'bg-emerald-400', text: 'text-emerald-400' },
  accent: { bar: 'bg-accent-400', text: 'text-accent-400' },
  amber: { bar: 'bg-amber-400', text: 'text-amber-400' },
  rose: { bar: 'bg-rose-400', text: 'text-rose-400' },
}

function getSectionColor(score) {
  if (score >= 80) return SCORE_COLORS.emerald
  if (score >= 60) return SCORE_COLORS.accent
  if (score >= 40) return SCORE_COLORS.amber
  return SCORE_COLORS.rose
}

function ResumeView({ data: initialData }) {
  const [data, setData] = useState(initialData)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState(null)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await analyzeResume(formData)
      setData(result)
    } catch (err) {
      console.error('Resume analysis failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-accent-400" aria-hidden="true" />
              <h3 className="text-lg font-bold text-white font-display">Resume Analysis</h3>
            </div>
            <p className="text-sm text-slate-500">
              Upload your resume for AI-powered feedback and improvement suggestions.
            </p>
          </div>
          <label htmlFor="resume-upload" className="relative cursor-pointer block">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="sr-only"
              id="resume-upload"
              aria-label="Upload resume file"
            />
            <Button variant="secondary" loading={uploading} as="span">
              <Upload className="w-4 h-4" aria-hidden="true" />
              {fileName || 'Upload Resume'}
            </Button>
          </label>
        </div>
      </motion.div>

      {data && (
        <>
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ScoreRing score={data.overall_score} size={180} label="Resume Score" />
          </motion.div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-display">Section Breakdown</h3>
            {data.sections?.map((section, index) => {
              const color = getSectionColor(section.score)
              return (
                <motion.div
                  key={index}
                  className="glass-card p-5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">{section.name}</h4>
                    <span className={`text-sm font-bold ${color.text}`}>{section.score}/100</span>
                  </div>
                  <ProgressBar value={section.score} showLabel={false} size="sm" className="mb-3" />
                  <p className="text-sm text-slate-400 mb-3 leading-relaxed">{section.feedback}</p>

                  {section.suggestions?.length > 0 && (
                    <ul className="space-y-2">
                      {section.suggestions.map((suggestion, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2 text-sm text-slate-500">
                          <Lightbulb className="w-4 h-4 mt-0.5 text-amber-500/70 shrink-0" aria-hidden="true" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )
            })}
          </div>

          {data.top_improvements?.length > 0 && (
            <motion.div
              className="glass-card p-6 gradient-border"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-bold text-white font-display mb-4">Top Priority Improvements</h3>
              <ol className="space-y-3">
                {data.top_improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-300 leading-relaxed pt-1">{improvement}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

export default ResumeView
