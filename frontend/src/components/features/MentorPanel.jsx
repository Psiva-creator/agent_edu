import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { useApi } from '../../hooks/useApi'
import { askMentor } from '../../services/api'
import { useCareerMemory } from '../../hooks/useCareerMemory'
import Button from '../ui/Button'
import Card from '../ui/Card'
import FallbackBanner from '../ui/FallbackBanner'
import './MentorPanel.css'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  suppressErrorRendering: true,
})

function MermaidBlock({ code }) {
  const [svg, setSvg] = useState('');
  const id = useMemo(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(id, code);
        if (isMounted) setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setSvg(`<div style="color: var(--status-error); padding: var(--space-2); border: 1px dashed var(--status-error); border-radius: var(--radius-md);">[Diagram could not be rendered: Syntax Error]</div>`);
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

export default function MentorPanel({ data: existingData, formData }) {
  const { memory } = useCareerMemory()
  
  const [messages, setMessages] = useState(() => {
    const mentorAdvice = memory?.career_analysis?.mentor_context || existingData?.mentor_advice
    if (mentorAdvice) {
      const content = typeof mentorAdvice === 'string' ? mentorAdvice : (mentorAdvice.answer || mentorAdvice.advice || 'Hello! I am your AI Mentor.')
      return [
        { role: 'assistant', content },
      ]
    }
    return []
  })
  const [input, setInput] = useState('')
  const { loading, execute } = useApi(askMentor)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (text) => {
    const question = text || input.trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev.filter(m => m.role !== 'suggestion'), { role: 'user', content: question }])

    try {
      const memoryContextData = {
        name: memory?.personal_info?.name || existingData?.name,
        target_role: memory?.personal_info?.target_role || existingData?.target_role,
        skills: memory?.resume_intelligence?.skills || existingData?.skills,
        experience_years: memory?.personal_info?.experience_years || existingData?.experience_years,
        roadmap_summary: memory?.career_analysis?.roadmap?.summary || existingData?.roadmap_summary
      };
      const result = await execute({ question, context: memoryContextData })
      // Backend returns MentorQuestionResponse { answer: "..." }
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: result.answer || result.advice || 'I don\'t have specific advice for that yet.', source: result.source },
      ])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mentor-panel">
      <Card padding="none" className="mentor-panel__card">
        {/* Header */}
        <div className="mentor-panel__header">
          <div className="mentor-panel__avatar">
            <Bot size={20} />
          </div>
          <div>
            <h3>AI Career Mentor</h3>
            <p>Ask me anything about your career path</p>
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
            <div className="mentor-panel__welcome">
              <MessageCircle size={32} style={{ color: 'var(--text-tertiary)' }} />
              <p>Ask the AI mentor a question about your career, skills, or job search strategy.</p>
              <div className="mentor-panel__suggestions">
                {['How do I transition into AI/ML?', 'What skills should I learn for backend development?', 'How to prepare for technical interviews?'].map((q) => (
                  <button key={q} className="mentor-panel__suggestion-btn" onClick={() => handleSend(q)}>{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.filter(m => m.role !== 'suggestion').map((msg, i) => (
            <motion.div
              key={i}
              className={`mentor-panel__msg mentor-panel__msg--${msg.role}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mentor-panel__msg-icon">
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className="mentor-panel__msg-content markdown-body">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="mentor-panel__msg mentor-panel__msg--assistant">
              <div className="mentor-panel__msg-icon"><Bot size={14} /></div>
              <div className="mentor-panel__typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mentor-panel__input-area">
          <input
            className="mentor-panel__input"
            placeholder="Ask a career question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button variant="primary" size="sm" icon={Send} disabled={!input.trim() || loading} onClick={() => handleSend()} aria-label="Send message" />
        </div>
      </Card>
    </div>
  )
}
