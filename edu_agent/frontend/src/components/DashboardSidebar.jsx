import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Map,
  FileText,
  Brain,
  ArrowRight,
} from 'lucide-react'

const TAB_ICONS = {
  overview: LayoutDashboard,
  roadmap: Map,
  resume: FileText,
  mentor: Brain,
}

function DashboardSidebar({ tabs, activeTab, onTabChange, formData }) {
  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 shrink-0">
      <div className="glass-card p-5 sticky top-24">
        {/* Profile summary */}
        <div className="mb-6 pb-5 border-b border-white/5">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Career Path</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-300 truncate">{formData.current_role}</span>
            <ArrowRight className="w-3 h-3 text-accent-400 shrink-0" aria-hidden="true" />
            <span className="text-white font-medium truncate">{formData.target_role}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Dashboard sections">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id] || LayoutDashboard
              const isActive = activeTab === tab.id

              return (
                <li key={tab.id}>
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'text-accent-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-accent-500/10 rounded-xl border border-accent-500/20"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative" aria-hidden="true" />
                    <span className="relative">{tab.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

export default DashboardSidebar
