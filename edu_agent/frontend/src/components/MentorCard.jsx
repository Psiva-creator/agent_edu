import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Send, Target, MessageSquare, Users, FolderOpen, Brain } from 'lucide-react'
import Card from './Card'
import Button from './Button'
import { askMentor } from '../services/api'

const ADVICE_ICONS = [Target, MessageSquare, Users, FolderOpen]

function MentorCard({ mentor, careerContext }) {
  const [expanded, setExpanded] = useState(0)
  const [question, setQuestion] = useState('')
  const [chatLog, setChatLog] = useState([])
  const [asking, setAsking] = useState(false)

  if (!mentor) return null

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    const userMsg = question
    setQuestion('')
    setChatLog((prev) => [...prev, { role: 'user', text: userMsg }])
    setAsking(true)

    try {
      const response = await askMentor(userMsg, careerContext)
      setChatLog((prev) => [...prev, { role: 'mentor', text: response.answer }])
    } catch (err) {
      console.error(err)
      setChatLog((prev) => [
        ...prev,
        { role: 'mentor', text: 'Sorry, I encountered an error. Please try again.' },
      ])
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="text-center" static>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center text-4xl shadow-xl shadow-accent-500/25"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {mentor.avatar_emoji}
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white font-display">{mentor.name}</h3>
            <p className="text-sm text-accent-400 mt-1">{mentor.specialty}</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg">{mentor.greeting}</p>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent-400" aria-hidden="true" />
          Personalized Advice
        </h3>
        {mentor.advice?.map((item, index) => {
          const Icon = ADVICE_ICONS[index] || Target
          const isOpen = expanded === index

          return (
            <motion.div
              key={index}
              className="glass-card overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset"
                onClick={() => setExpanded(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={`mentor-advice-${index}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-500/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-accent-400" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-white">{item.topic}</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    id={`mentor-advice-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                    role="region"
                    aria-label={item.topic}
                  >
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-white/5 pt-4">
                        <p className="text-sm text-slate-400 leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <Card className="space-y-4" static>
        <h3 className="text-lg font-bold text-white font-display text-left flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent-400" aria-hidden="true" />
          Ask AI Mentor
        </h3>
        <p className="text-sm text-slate-400 text-left">
          Want more personalized advice? Ask specific questions about your career path.
        </p>

        {chatLog.length > 0 && (
          <div
            className="space-y-3 bg-dark-900/50 p-4 rounded-xl border border-white/5 max-h-80 overflow-y-auto text-left flex flex-col"
            role="log"
            aria-live="polite"
            aria-label="Chat with AI mentor"
          >
            {chatLog.map((msg, idx) => (
              <motion.div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-accent-600 text-white font-medium shadow-md shadow-accent-600/10'
                    : 'bg-slate-800/80 text-slate-200 border border-white/5'
                }`}>
                  <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
              </motion.div>
            ))}
            {asking && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 text-slate-400 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 border border-white/5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleAsk} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about interview tips, portfolio ideas..."
            className="form-input flex-1"
            disabled={asking}
            aria-label="Question for AI mentor"
          />
          <Button type="submit" variant="primary" size="md" disabled={asking || !question.trim()}>
            <Send className="w-4 h-4" aria-hidden="true" />
            {asking ? 'Thinking...' : 'Ask'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default MentorCard
