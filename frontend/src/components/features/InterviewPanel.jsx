import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, ChevronRight, ChevronDown, ChevronUp, Clock, Lightbulb,
  CheckCircle, AlertCircle, Trophy, RotateCcw, Lock, Unlock, Target,
  Code2, Users, Cpu, Network, MessageSquare, X, Sparkles
} from 'lucide-react'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import { generateInterviewQuestion, evaluateInterviewAnswer, getInterviewFinalScore } from '../../services/api'
import './InterviewPanel.css'

// ─── Round Configuration ──────────────────────────────────────
const ROUNDS = [
  {
    id: 'hr',
    label: 'HR Round',
    icon: <Users size={22} />,
    desc: 'Culture fit, motivation, salary expectations & work style',
    time: '2 min/Q',
    difficulty: 'Easy–Medium',
    questions: 5,
  },
  {
    id: 'technical',
    label: 'Technical Round',
    icon: <Cpu size={22} />,
    desc: 'Algorithms, data structures, debugging & tech-stack knowledge',
    time: '3 min/Q',
    difficulty: 'Medium–Hard',
    questions: 5,
  },
  {
    id: 'behavioral',
    label: 'Behavioral Round',
    icon: <MessageSquare size={22} />,
    desc: 'STAR-format past experiences: teamwork, conflict, leadership',
    time: '2 min/Q',
    difficulty: 'Easy–Medium',
    questions: 5,
  },
  {
    id: 'system_design',
    label: 'System Design',
    icon: <Network size={22} />,
    desc: 'Design scalable systems, APIs, databases & architecture',
    time: '5 min/Q',
    difficulty: 'Hard',
    questions: 5,
  },
  {
    id: 'coding',
    label: 'Coding Round',
    icon: <Code2 size={22} />,
    desc: 'Algorithm problems relevant to your tech stack',
    time: '4 min/Q',
    difficulty: 'Medium–Hard',
    questions: 5,
  },
]

const TOTAL_QUESTIONS = 5

// ─── Score Ring SVG ───────────────────────────────────────────
function ScoreRing({ score, size = 100, color = '#6366f1' }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const ringColor = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="interview-eval__score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="score-bg" cx={size / 2} cy={size / 2} r={radius} strokeWidth={8} />
        <circle
          className="score-fill"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={8}
          stroke={ringColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="interview-eval__score-num">
        {score}<span>/100</span>
      </div>
    </div>
  )
}

// ─── Timer ────────────────────────────────────────────────────
function Timer({ seconds, totalSeconds }) {
  const pct = (seconds / totalSeconds) * 100
  const isWarning = pct < 40
  const isDanger  = pct < 15
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const label = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="interview-timer">
      <Clock size={14} color={isDanger ? '#ef4444' : isWarning ? '#f59e0b' : 'var(--text-tertiary)'} />
      <div className="interview-timer__bar">
        <div
          className={`interview-timer__fill ${isDanger ? 'interview-timer__fill--danger' : isWarning ? 'interview-timer__fill--warning' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`interview-timer__text ${isDanger ? 'interview-timer__text--danger' : isWarning ? 'interview-timer__text--warning' : ''}`}>
        {label}
      </span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function InterviewPanel({ data, formData }) {
  const { memory, addInterviewSession } = useCareerMemory()

  // Build career context from Career Memory
  const careerCtx = {
    name: memory.personal_info?.name || formData?.name || 'Candidate',
    current_role: memory.personal_info?.current_role || formData?.current_role || 'Student',
    target_role: memory.personal_info?.target_role || formData?.target_role || 'Software Engineer',
    experience_years: memory.personal_info?.experience_years || formData?.experience_years || 0,
    skills: memory.resume_intelligence?.skills || data?.extracted_skills || [],
    projects: memory.resume_intelligence?.projects || data?.projects || [],
    education: memory.personal_info?.education || formData?.education || '',
    location: memory.personal_info?.location || formData?.location || '',
    market_insights: memory.career_analysis?.market_insights || null,
  }

  // ── State Machine ──
  const [phase, setPhase]         = useState('select')   // select | loading | active | eval | final
  const [selectedRound, setRound] = useState(null)
  const [questionNum, setQNum]    = useState(1)
  const [question, setQuestion]   = useState(null)
  const [prevQuestions, setPrevQs]= useState([])
  const [answer, setAnswer]       = useState('')
  const [evaluation, setEval]     = useState(null)
  const [allEvals, setAllEvals]   = useState([])
  const [finalScore, setFinal]    = useState(null)
  const [hintsOpen, setHintsOpen] = useState(false)
  const [unlockedHints, setUnlocked] = useState(0)
  const [accOpen, setAccOpen]     = useState({ expected: false, improved: false })
  const [timer, setTimer]         = useState(0)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState(null)

  const timerRef = useRef(null)

  // ── Timer logic ──
  const startTimer = useCallback((secs) => {
    clearInterval(timerRef.current)
    setTimer(secs)
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0 }
        return t - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => clearInterval(timerRef.current), [])

  // ── Round Selection → Fetch First Question ──
  const handleSelectRound = async (round) => {
    setRound(round)
    setPhase('loading')
    setQNum(1)
    setPrevQs([])
    setAllEvals([])
    setFinal(null)
    setSaved(false)
    setError(null)

    try {
      const q = await generateInterviewQuestion({
        round_type: round.id,
        career_context: careerCtx,
        question_number: 1,
        previous_questions: [],
      })
      setQuestion(q)
      setAnswer('')
      setEval(null)
      setUnlocked(0)
      setHintsOpen(false)
      setAccOpen({ expected: false, improved: false })
      startTimer(q.time_limit_seconds || 120)
      setPhase('active')
    } catch (e) {
      setError('Failed to generate question. Please check your connection.')
      setPhase('select')
    }
  }

  // ── Submit Answer → Evaluate ──
  const handleSubmit = async () => {
    if (!answer.trim()) return
    clearInterval(timerRef.current)
    setPhase('loading')
    setError(null)

    try {
      const evalResult = await evaluateInterviewAnswer({
        question: question.question,
        candidate_answer: answer,
        expected_answer: question.expected_answer,
        round_type: selectedRound.id,
        career_context: careerCtx,
      })
      setEval(evalResult)
      setAllEvals(prev => [...prev, evalResult])
      setAccOpen({ expected: false, improved: false })
      setPhase('eval')
    } catch (e) {
      setError('Evaluation failed. Please try again.')
      setPhase('active')
    }
  }

  // ── Next Question ──
  const handleNext = async () => {
    if (questionNum >= TOTAL_QUESTIONS) {
      // Final score
      setPhase('loading')
      try {
        const finalEvals = [...allEvals]
        const fs = await getInterviewFinalScore({
          round_type: selectedRound.id,
          evaluations: finalEvals,
          career_context: careerCtx,
        })
        setFinal(fs)
        setPhase('final')
      } catch (e) {
        // Compute locally
        const scores = allEvals.map(e => e.score || 0)
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1))
        setFinal({
          overall_score: avg,
          grade: avg >= 90 ? 'A+' : avg >= 80 ? 'A' : avg >= 70 ? 'B+' : avg >= 60 ? 'B' : avg >= 50 ? 'C' : 'F',
          hire_recommendation: avg >= 85 ? 'Strong Hire' : avg >= 70 ? 'Hire' : avg >= 55 ? 'Maybe' : 'No Hire',
          top_strengths: [], top_weaknesses: [],
          summary: `You scored ${avg}/100 across ${TOTAL_QUESTIONS} questions.`,
          next_steps: ['Review weak areas', 'Practice more mock interviews'],
          question_scores: scores,
        })
        setPhase('final')
      }
      return
    }

    setPhase('loading')
    const nextNum = questionNum + 1
    const newPrevQs = [...prevQuestions, question.question]

    try {
      const q = await generateInterviewQuestion({
        round_type: selectedRound.id,
        career_context: careerCtx,
        question_number: nextNum,
        previous_questions: newPrevQs,
      })
      setPrevQs(newPrevQs)
      setQNum(nextNum)
      setQuestion(q)
      setAnswer('')
      setEval(null)
      setUnlocked(0)
      setHintsOpen(false)
      setAccOpen({ expected: false, improved: false })
      startTimer(q.time_limit_seconds || 120)
      setPhase('active')
    } catch (e) {
      setError('Failed to load next question.')
      setPhase('eval')
    }
  }

  // ── Save to Career Memory ──
  const handleSave = () => {
    addInterviewSession({
      round: selectedRound?.label,
      round_id: selectedRound?.id,
      score: finalScore?.overall_score,
      grade: finalScore?.grade,
      hire_recommendation: finalScore?.hire_recommendation,
      question_scores: finalScore?.question_scores || [],
    })
    setSaved(true)
  }

  const hireClass = (rec) => {
    if (!rec) return ''
    if (rec.includes('Strong')) return 'hire--strong'
    if (rec.includes('Hire'))   return 'hire--hire'
    if (rec.includes('Maybe'))  return 'hire--maybe'
    return 'hire--no'
  }

  // ════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════
  return (
    <div className="interview-panel">

      {/* Error Banner */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={14} /></button>
        </motion.div>
      )}

      {/* ── PHASE: LOADING ── */}
      {phase === 'loading' && (
        <div className="interview-loading">
          <div className="interview-loading__spinner" />
          <p className="interview-loading__text">AI is generating your personalized question…</p>
        </div>
      )}

      {/* ── PHASE: SELECT ── */}
      {phase === 'select' && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="interview-panel__selector-header">
              <h2>AI Interview Simulator</h2>
              <p>Questions are 100% AI-generated from your Career Memory — no mock data</p>
            </div>

            <div className="interview-rounds-grid">
              {ROUNDS.map((r, i) => (
                <motion.div
                  key={r.id}
                  className="interview-round-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => handleSelectRound(r)}
                >
                  <div className={`round-card__icon round-card__icon--${r.id}`}>{r.icon}</div>
                  <div className="round-card__title">{r.label}</div>
                  <div className="round-card__desc">{r.desc}</div>
                  <div className="round-card__meta">
                    <span className="round-card__badge">⏱ {r.time}</span>
                    <span className="round-card__badge">{r.difficulty}</span>
                    <span className="round-card__badge">{r.questions} Qs</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Interview History */}
            {(memory.interview_history || []).length > 0 && (
              <motion.div className="interview-history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h3>Interview History</h3>
                <div className="interview-history__list">
                  {(memory.interview_history || []).slice(0, 5).map((s, i) => (
                    <div key={i} className="interview-history__item">
                      <div className="interview-history__item-left">
                        <span className="interview-history__item-round">{s.round}</span>
                        <span className="interview-history__item-date">{new Date(s.date).toLocaleDateString()}</span>
                      </div>
                      <span className="interview-history__item-score" style={{ color: s.score >= 70 ? '#10b981' : s.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {s.score}/100 · {s.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── PHASE: ACTIVE ── */}
      {phase === 'active' && question && (
        <motion.div className="interview-active" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          {/* Header bar */}
          <div className="interview-active__header">
            <div className="interview-active__round-tag">
              <Target size={16} color="var(--accent-primary)" />
              {selectedRound?.label}
            </div>
            <div className="interview-active__progress">
              <span>Q{questionNum}/{TOTAL_QUESTIONS}</span>
              <div className="interview-active__dots">
                {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                  <div key={i} className={`interview-active__dot ${i < questionNum - 1 ? 'interview-active__dot--done' : i === questionNum - 1 ? 'interview-active__dot--active' : ''}`} />
                ))}
              </div>
              <Timer seconds={timer} totalSeconds={question.time_limit_seconds || 120} />
            </div>
            <button className="interview-active__quit-btn" onClick={() => setPhase('select')}>
              <X size={12} /> Quit
            </button>
          </div>

          {/* Question */}
          <div className="interview-question-card">
            <div className="interview-question-card__meta">
              <span className={`interview-difficulty-badge interview-difficulty-badge--${(question.difficulty || 'Medium').toLowerCase()}`}>
                {question.difficulty || 'Medium'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Question {questionNum}</span>
            </div>
            <p className="interview-question-card__text">{question.question}</p>
          </div>

          {/* Hints */}
          {(question.hints || []).length > 0 && (
            <div className="interview-hints">
              <button className="interview-hints__toggle" onClick={() => setHintsOpen(h => !h)}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lightbulb size={14} color="#f59e0b" /> Hints ({unlockedHints}/{question.hints.length} unlocked)
                </span>
                {hintsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {hintsOpen && (
                <div className="interview-hints__list">
                  {question.hints.map((hint, i) => {
                    const isUnlocked = i < unlockedHints
                    return (
                      <div
                        key={i}
                        className={`interview-hint-item ${isUnlocked ? 'interview-hint-item--unlocked' : 'interview-hint-item--locked'}`}
                        onClick={() => !isUnlocked && setUnlocked(i + 1)}
                      >
                        <span className="interview-hint-item__num">
                          {isUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                        </span>
                        <span>{isUnlocked ? hint : `Click to unlock hint ${i + 1}`}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Answer Box */}
          <div className="interview-answer">
            <div className="interview-answer__header">
              <span className="interview-answer__label">Your Answer</span>
              <span className="interview-answer__count">{answer.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <textarea
              className={`interview-answer__textarea ${selectedRound?.id === 'coding' ? 'coding' : ''}`}
              placeholder={selectedRound?.id === 'coding'
                ? '// Write your code / algorithm here...\n// Explain your approach and time complexity'
                : 'Type your answer here. Be specific and use examples from your experience...'}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
            <div className="interview-answer__footer">
              <button
                className="interview-submit-btn"
                onClick={handleSubmit}
                disabled={!answer.trim()}
              >
                <Sparkles size={14} />
                Submit for AI Evaluation
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── PHASE: EVALUATION ── */}
      {phase === 'eval' && evaluation && (
        <motion.div className="interview-eval" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>

          {/* Score Card */}
          <div className="interview-eval__score-card">
            <ScoreRing score={evaluation.score} size={110} />
            <div className="interview-eval__feedback">
              <h3>AI Evaluation — Q{questionNum}</h3>
              <p>{evaluation.feedback}</p>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="interview-eval__columns">
            <div className="interview-eval__col interview-eval__col--green">
              <div className="interview-eval__col-title interview-eval__col-title--green">
                <CheckCircle size={14} /> Strengths
              </div>
              <ul>{(evaluation.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="interview-eval__col interview-eval__col--amber">
              <div className="interview-eval__col-title interview-eval__col-title--amber">
                <AlertCircle size={14} /> Weaknesses
              </div>
              <ul>{(evaluation.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          </div>

          {/* Expected Answer Accordion */}
          <div className="interview-eval__accordion">
            <button className="interview-eval__acc-toggle" onClick={() => setAccOpen(a => ({ ...a, expected: !a.expected }))}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={14} /> Expected Answer
              </span>
              {accOpen.expected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {accOpen.expected && (
              <div className="interview-eval__acc-content">{question?.expected_answer}</div>
            )}
          </div>

          {/* Improved Answer Accordion */}
          <div className="interview-eval__accordion">
            <button className="interview-eval__acc-toggle" onClick={() => setAccOpen(a => ({ ...a, improved: !a.improved }))}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={14} color="var(--accent-primary)" /> AI-Improved Version of Your Answer
              </span>
              {accOpen.improved ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {accOpen.improved && (
              <div className="interview-eval__acc-content">{evaluation.improved_answer}</div>
            )}
          </div>

          {/* Actions */}
          <div className="interview-eval__actions">
            <button className="interview-eval__btn interview-eval__btn--skip" onClick={() => setPhase('select')}>
              End Round
            </button>
            <button className="interview-eval__btn interview-eval__btn--next" onClick={handleNext}>
              {questionNum >= TOTAL_QUESTIONS ? '🏁 Get Final Score' : `Next Question (${questionNum + 1}/${TOTAL_QUESTIONS})`}
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── PHASE: FINAL SCORE ── */}
      {phase === 'final' && finalScore && (
        <motion.div className="interview-final" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

          {/* Hero Score */}
          <div className="interview-final__hero">
            <div className="interview-final__score-num">{finalScore.overall_score}</div>
            <div className={`interview-final__grade-badge grade--${finalScore.grade}`}>{finalScore.grade}</div>
            <div>
              <div className={`interview-final__hire ${hireClass(finalScore.hire_recommendation)}`}>
                <Trophy size={14} /> {finalScore.hire_recommendation}
              </div>
            </div>
            <p className="interview-final__summary">{finalScore.summary}</p>
          </div>

          {/* Per-question scores */}
          {(finalScore.question_scores || []).length > 0 && (
            <div className="interview-final__stats-grid">
              {finalScore.question_scores.map((s, i) => (
                <div key={i} className="interview-final__stat-card">
                  <div className="interview-final__stat-num" style={{ color: s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {s}
                  </div>
                  <div className="interview-final__stat-label">Question {i + 1}</div>
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Next Steps */}
          <div className="interview-final__cols">
            <div className="interview-final__col">
              <h4><CheckCircle size={14} color="#10b981" /> Top Strengths</h4>
              <ul>{(finalScore.top_strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="interview-final__col">
              <h4><ChevronRight size={14} color="var(--accent-primary)" /> Next Steps</h4>
              <ul>{(finalScore.next_steps || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          </div>

          {/* Actions */}
          <div className="interview-final__actions">
            <button
              className="interview-final__action-btn interview-final__action-btn--secondary"
              onClick={handleSave}
              disabled={saved}
            >
              {saved ? '✓ Saved to Career Memory' : '💾 Save to Career Memory'}
            </button>
            <button
              className="interview-final__action-btn interview-final__action-btn--primary"
              onClick={() => { setPhase('select'); setFinal(null); setAllEvals([]); }}
            >
              <RotateCcw size={14} /> Start New Round
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
