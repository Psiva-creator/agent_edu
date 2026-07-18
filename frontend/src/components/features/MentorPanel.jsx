import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { renderMermaidSafe } from '../../utils/mermaidUtils'
import { useApi } from '../../hooks/useApi'
import { askMentor } from '../../services/api'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import Card from '../ui/Card'
import FallbackBanner from '../ui/FallbackBanner'
import './MentorPanel.css'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  suppressErrorRendering: true,
})

// Local fallbacks are now fully managed by the backend Career Mentor Agent

function MermaidBlock({ code }) {
  const [svg, setSvg] = useState('');
  const id = useMemo(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const { svg: renderedSvg } = await renderMermaidSafe(id, code);
        if (isMounted) setSvg(renderedSvg);
      } catch (err) {
        if (isMounted) {
          setSvg(`<div style="color: var(--status-error); padding: 16px; border: 1px dashed var(--status-error); border-radius: 8px; text-align: center; background: rgba(var(--error-rgb), 0.05); font-size: 14px;">
            <p style="margin: 0; font-weight: 600;">Unable to render diagram</p>
            <p style="margin: 4px 0 0 0; opacity: 0.8;">The AI generated invalid flowchart syntax.</p>
          </div>`);
        }
      }
    };
    renderChart();
    return () => { isMounted = false; };
  }, [code, id]);

  return <div className="mentor-mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />;
}

// Define markdown components outside to prevent unmounting on every keystroke
const markdownComponents = {
  code(props) {
    const {children, className, node, ...rest} = props
    const match = /language-(\w+)/.exec(className || '')
    if (match && match[1] === 'mermaid') {
      return <MermaidBlock code={String(children).replace(/\n$/, '')} />
    }
    return <code {...rest} className={className}>{children}</code>
  }
}

const stripReasoning = (content) => {
  if (typeof content !== 'string') return content;
  return content.replace(/<details\b[^>]*>([\s\S]*?)<\/details>/gi, '').trim();
}

export default function MentorPanel({ data: existingData, formData }) {
  const { memory } = useCareerMemory()
  const textareaRef = useRef(null)
  const scrollRef = useRef(null)
  
  const getFormattedTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Resolve user name
  const userName = memory?.personal_info?.name || formData?.name || existingData?.name || 'there';

  const [messages, setMessages] = useState(() => {
    const mentorAdvice = memory?.career_analysis?.mentor_context || existingData?.mentor_advice
    if (mentorAdvice) {
      const content = typeof mentorAdvice === 'string' 
        ? mentorAdvice 
        : (mentorAdvice.answer || mentorAdvice.advice || 'Hello! I am your AI Mentor.')
      return [
        { role: 'assistant', content: stripReasoning(content), timestamp: getFormattedTime() },
      ]
    }
    return []
  })

  const [input, setInput] = useState('')
  const [toast, setToast] = useState(null)
  const { loading, execute } = useApi(askMentor)
  const lastQuestionRef = useRef('')

  const activeResumeId = memory?.resume_intelligence?.raw_analysis?.id || memory?.raw_report?.resume_analysis?.id || memory?.raw_report?.id;
  const initialMount = useRef(true);

  // Monitor resume updates to show temporary toast notification
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    setToast("📑 Active resume updated. AI Mentor context refreshed.");
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [activeResumeId]);

  // Context-aware suggestions engine
  const suggestions = useMemo(() => {
    const hasResume = !!(memory?.resume_intelligence?.skills?.length > 0 || memory?.raw_report?.resume_analysis);
    const hasRoadmap = !!(memory?.career_analysis?.roadmap || memory?.raw_report?.roadmap);
    
    // Calculate roadmap completion progress
    const targetRoleKey = (memory?.personal_info?.target_role || '').replace(/\s+/g, '_')
    const savedProgress = localStorage.getItem(`roadmap_progress_${targetRoleKey}`)
    let completedTasksCount = 0
    try {
      if (savedProgress) {
        completedTasksCount = Object.keys(JSON.parse(savedProgress)).length
      }
    } catch {}
    const hasProgress = completedTasksCount > 0;
    const hasJobs = !!(memory?.career_analysis?.jobs?.matches?.length > 0);

    if (hasProgress) {
      return [
        { text: "What is my next learning goal on the roadmap?", label: "Continue learning" },
        { text: "How can I accelerate my roadmap progress?", label: "Speed up learning" },
        { text: "Test me on my completed roadmap skills", label: "Self-assessment" },
        { text: "Recommend a portfolio project for my current progress", label: "Build projects" }
      ];
    } else if (hasRoadmap) {
      return [
        { text: "Explain the Week 1 milestones of my roadmap", label: "Explore Week 1" },
        { text: "What resources do you recommend for my roadmap target?", label: "Study material" },
        { text: "How many hours per week should I study for this roadmap?", label: "Time allocation" },
        { text: "How do I track my roadmap progress?", label: "Track progress" }
      ];
    } else if (hasResume) {
      return [
        { text: `How can I improve my ATS score of ${memory?.resume_intelligence?.ats_score || 75}%?`, label: "Improve ATS Score" },
        { text: "Can you review the experience and projects on my resume?", label: "Resume audit" },
        { text: "What skills are missing for my target role?", label: "Identify gaps" },
        { text: "Recommend some projects based on my resume profile", label: "Build projects" }
      ];
    } else if (hasJobs) {
      return [
        { text: "What should I prepare for my matched job recommendations?", label: "Interview prep" },
        { text: "How do I follow up on a job application?", label: "Hiring follow-up" },
        { text: "Explain eligibility requirements for the recommended roles", label: "Role fit" },
        { text: "How do I customize my application for these jobs?", label: "Job application advice" }
      ];
    } else {
      return [
        { text: "How do I start a career in software engineering?", label: "Kickstart Career" },
        { text: "What is the best career path for a beginner?", label: "Career domains" },
        { text: "How do I build a professional portfolio?", label: "Portfolio guide" },
        { text: "What certifications are most valuable today?", label: "Certifications" }
      ];
    }
  }, [memory]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Auto-grow message composer textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = async (text) => {
    const question = (text || input).trim()
    if (!question || loading) return
    
    setInput('')
    lastQuestionRef.current = question
    
    // Clear suggestion items and add user query
    setMessages(prev => [
      ...prev.filter(m => m.role !== 'error'),
      { role: 'user', content: question, timestamp: getFormattedTime() }
    ])

    try {
      const targetRoleKey = (memory?.personal_info?.target_role || existingData?.target_role || '').replace(/\s+/g, '_')
      const savedProgress = localStorage.getItem(`roadmap_progress_${targetRoleKey}`)
      let completedTasksCount = 0
      try {
        if (savedProgress) {
          completedTasksCount = Object.keys(JSON.parse(savedProgress)).length
        }
      } catch {}

      const memoryContextData = {
        name: memory?.personal_info?.name || existingData?.name || 'Candidate',
        current_role: memory?.personal_info?.current_role || existingData?.current_role || 'Student',
        target_role: memory?.personal_info?.target_role || existingData?.target_role || 'Software Engineer',
        skills: memory?.resume_intelligence?.skills || existingData?.skills || [],
        experience_years: memory?.personal_info?.experience_years || existingData?.experience_years || 0,
        education: memory?.personal_info?.education || existingData?.education || null,
        certifications: memory?.resume_intelligence?.certifications || [],
        projects: memory?.resume_intelligence?.projects || [],
        ats_score: memory?.resume_intelligence?.ats_score || memory?.resume_intelligence?.overall_score || null,
        resume_analysis: memory?.resume_intelligence || null,
        roadmap: memory?.career_analysis?.roadmap || existingData?.roadmap || null,
        completed_tasks_count: completedTasksCount,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      }

      // Backend now manages all context, history, and state logic
      const result = await execute({ question, context: memoryContextData })
      
      const finalAnswer = result.answer || result.advice || 'I don\'t have specific advice for that yet.'
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: finalAnswer, timestamp: getFormattedTime(), source: result.source }
      ])
    } catch (err) {
      console.error("Mentor request failed:", err)
      setMessages(prev => [
        ...prev,
        { role: 'error', content: 'Failed to send message. Please check your connection and try again.' }
      ])
    }
  }

  const handleRetry = () => {
    setMessages(prev => prev.slice(0, -1))
    handleSend(lastQuestionRef.current)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mentor-panel">
      <Card padding="none" className="mentor-panel__card" style={{ position: 'relative' }}>
        
        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              style={{
                position: 'absolute',
                top: '72px',
                left: '50%',
                x: '-50%',
                background: 'rgba(17, 24, 39, 0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-full)',
                padding: 'var(--space-2) var(--space-5)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                zIndex: 100,
                boxShadow: 'var(--shadow-glow)',
                whiteSpace: 'nowrap'
              }}
            >
              <Sparkles size={13} style={{ color: 'var(--accent-primary)', animation: 'pulse 2s infinite' }} />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="mentor-panel__header">
          <div className="mentor-panel__avatar">
            <Bot size={20} />
          </div>
          <div className="mentor-panel__header-info">
            <h3>AI Career Mentor</h3>
            <div className="mentor-panel__status-wrap">
              <span className="mentor-panel__status-dot" />
              <p>Active Mentorship Agent</p>
            </div>
          </div>
        </div>
        
        {messages.some(m => m.source === 'fallback') && (
          <div style={{ padding: '0 16px' }}>
            <FallbackBanner source="fallback" />
          </div>
        )}

        {/* Messages */}
        <div className="mentor-panel__messages" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="mentor-panel__welcome" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 'var(--space-12) var(--space-6)',
              margin: 'auto 0',
              maxWidth: '800px',
              width: '100%',
              alignSelf: 'center'
            }}>
              <div className="mentor-panel__welcome-icon" style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                marginBottom: 'var(--space-5)',
                boxShadow: 'var(--shadow-glow)'
              }}>
                <Bot size={28} />
              </div>
              
              <h2 style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)'
              }}>
                How can I help you today{userName !== 'there' ? `, ${userName}` : ''}?
              </h2>
              
              <p className="mentor-panel__welcome-subtitle" style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                maxWidth: '460px',
                lineHeight: 'var(--leading-relaxed)',
                marginBottom: 'var(--space-8)',
                margin: '0 auto var(--space-8)'
              }}>
                Your AI Career Coach. Ask me anything about coding, resumes, portfolios, certifications, mock interviews, or your roadmap syllabus.
              </p>

              <div className="mentor-panel__suggestions" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-3)',
                width: '100%',
                maxWidth: '640px'
              }}>
                {suggestions.map((suggestion, idx) => (
                  <button 
                    key={idx} 
                    className="mentor-panel__suggestion-btn" 
                    onClick={() => handleSend(suggestion.text)}
                    aria-label={`Suggested question: ${suggestion.text}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      padding: 'var(--space-4)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      gap: '4px'
                    }}
                  >
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 'var(--weight-bold)',
                      color: 'var(--accent-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {suggestion.label}
                    </span>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 'var(--leading-normal)'
                    }}>
                      {suggestion.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              if (msg.role === 'system') return null; // Fully stripped from UI

              if (msg.role === 'error') {
                return (
                  <div key={i} className="mentor-panel__error-card">
                    <AlertCircle size={14} className="mentor-panel__error-icon" />
                    <span className="mentor-panel__error-text">{msg.content}</span>
                    <button 
                      className="mentor-panel__retry-btn"
                      onClick={handleRetry}
                      aria-label="Retry sending last message"
                    >
                      Retry
                    </button>
                  </div>
                )
              }

              return (
                <motion.div
                  key={i}
                  className={`mentor-panel__msg mentor-panel__msg--${msg.role}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mentor-panel__msg-icon">
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className="mentor-panel__msg-wrapper">
                    <div className="mentor-panel__msg-content markdown-body">
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {stripReasoning(msg.content)}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.timestamp && (
                      <span className="mentor-panel__msg-time">{msg.timestamp}</span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {loading && (
            <div className="mentor-panel__msg mentor-panel__msg--assistant">
              <div className="mentor-panel__msg-icon"><Bot size={14} /></div>
              <div className="mentor-panel__msg-wrapper">
                <div className="mentor-panel__typing-bubble">
                  <span className="mentor-panel__typing-label">AI Mentor is typing</span>
                  <div className="mentor-panel__typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mentor-panel__composer">
          <div className="mentor-panel__composer-container">
            <textarea
              ref={textareaRef}
              className="mentor-panel__composer-input"
              placeholder="Ask a career question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
              aria-label="Ask a career question"
            />
            <button
              className="mentor-panel__send-btn"
              disabled={!input.trim() || loading}
              onClick={() => handleSend()}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
