import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, Bot, User } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { askMentor } from '../../services/api'
import Button from '../ui/Button'
import Card from '../ui/Card'
import './MentorPanel.css'

export default function MentorPanel({ data: existingData, formData }) {
  const [messages, setMessages] = useState(() => {
    // CareerReportResponse has mentor_advice as a string
    if (existingData?.mentor_advice) {
      return [
        { role: 'assistant', content: existingData.mentor_advice },
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
      const result = await execute({ question, context: null })
      // Backend returns MentorQuestionResponse { answer: "..." }
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: result.answer || result.advice || 'I don\'t have specific advice for that yet.' },
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
              <div className="mentor-panel__msg-content">{msg.content}</div>
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
