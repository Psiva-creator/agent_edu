import { motion } from 'framer-motion'
import { Map, ExternalLink, ChevronRight, CheckCircle2, Circle, Clock } from 'lucide-react'
import ProgressBar from './ui/ProgressBar'

function RoadmapTimeline({ milestones = [], resources = [], estimatedTimeline = '' }) {
  const completed = milestones.filter((m) => m.status === 'completed').length
  const progress = milestones.length ? (completed / milestones.length) * 100 : 0

  const getStatusStyles = (status) => {
    switch (status) {
      case 'completed':
        return { dot: 'bg-emerald-500 shadow-emerald-500/40', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', Icon: CheckCircle2, label: 'Completed' }
      case 'current':
        return { dot: 'bg-accent-500 shadow-accent-500/40', badge: 'bg-accent-500/15 text-accent-400 border-accent-500/20', Icon: Clock, label: 'In Progress' }
      default:
        return { dot: 'bg-dark-500', badge: 'bg-dark-600/50 text-slate-500 border-dark-500/30', Icon: Circle, label: 'Upcoming' }
    }
  }

  return (
    <div className="space-y-8">
      {estimatedTimeline && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center text-white shrink-0">
              <Map className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white font-display">Your Career Roadmap</h3>
              <p className="text-sm text-slate-500">Estimated timeline: {estimatedTimeline}</p>
            </div>
          </div>
          <ProgressBar value={progress} label="Roadmap Progress" size="sm" />
        </motion.div>
      )}

      <div className="relative">
        {milestones.map((milestone, index) => {
          const styles = getStatusStyles(milestone.status)
          const StatusIcon = styles.Icon

          return (
            <motion.div
              key={index}
              className="relative pl-12 pb-10 last:pb-0"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              {index < milestones.length - 1 && (
                <div className={`absolute left-[19px] top-10 bottom-0 w-px ${milestone.status === 'completed' ? 'bg-emerald-500/30' : 'bg-dark-600'}`} aria-hidden="true" />
              )}

              <div className={`absolute left-3 top-1 w-5 h-5 rounded-full flex items-center justify-center ${styles.dot}`}>
                <StatusIcon className="w-3 h-3 text-white" aria-hidden="true" />
              </div>

              <motion.div className="glass-card p-5" whileHover={{ x: 4 }}>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {milestone.month ? `Week ${milestone.month}` : `Phase ${index + 1}`}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles.badge}`}>
                    {styles.label}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mb-1 font-display">{milestone.title}</h4>
                <p className="text-sm text-slate-400 mb-3 leading-relaxed">{milestone.description}</p>

                {milestone.tasks?.length > 0 && (
                  <ul className="space-y-2">
                    {milestone.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} className="flex items-start gap-2 text-sm text-slate-400">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-accent-500/60 shrink-0" aria-hidden="true" />
                        {task}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {resources.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white font-display mb-4">Recommended Resources</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <motion.a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-4 flex items-center gap-3 group"
                whileHover={{ y: -2 }}
              >
                <div className="w-9 h-9 rounded-lg bg-accent-500/15 flex items-center justify-center text-sm shrink-0">
                  {resource.type === 'Course' ? '🎓' : resource.type === 'Book' ? '📖' : resource.type === 'Certification' ? '🏆' : '💻'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-accent-400 transition-colors">
                    {resource.title}
                  </p>
                  <p className="text-xs text-slate-500">{resource.type} · {resource.priority} priority</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-accent-400 transition-colors shrink-0" aria-hidden="true" />
              </motion.a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RoadmapTimeline
