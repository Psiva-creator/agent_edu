import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, Activity, DollarSign, TrendingUp } from 'lucide-react';
import Card from '../../ui/Card';

export default function FutureSimulator({ scenarios }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!scenarios || scenarios.length === 0) return null;

  const active = scenarios[activeIndex];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-full md:col-span-1">
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Lightbulb size={20} className="text-warning" />
          <h3>Future Simulator</h3>
        </div>

        <div className="simulator-dropdown relative mb-4">
          <label className="text-xs font-bold uppercase text-secondary mb-2 block">What if I...</label>
          <div className="flex flex-col gap-2">
            {scenarios.map((s, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`text-left px-3 py-2 rounded-md text-sm transition-colors border ${activeIndex === idx ? 'bg-[var(--accent-primary)] bg-opacity-10 border-[var(--accent-primary)] text-accent font-medium' : 'bg-[var(--bg-modifier-hover)] border-transparent text-secondary hover:text-primary'}`}
              >
                {s.action}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="simulation-results grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--border)]"
          >
            <div className="sim-metric bg-[var(--bg-modifier-hover)] p-3 rounded-lg flex flex-col gap-1">
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-secondary"><DollarSign size={12}/> Salary</span>
              <span className="text-lg font-bold text-success">+{active.expected_salary?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="sim-metric bg-[var(--bg-modifier-hover)] p-3 rounded-lg flex flex-col gap-1">
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-secondary"><Activity size={12}/> Hiring Prob</span>
              <span className="text-lg font-bold text-accent">+{active.hiring_probability || 0}%</span>
            </div>
            <div className="sim-metric bg-[var(--bg-modifier-hover)] p-3 rounded-lg flex flex-col gap-1 col-span-2">
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-secondary"><TrendingUp size={12}/> Growth Impact</span>
              <span className="text-sm font-medium">{active.career_growth || 'Accelerated trajectory'}</span>
            </div>
          </motion.div>
        </AnimatePresence>

      </Card>
    </motion.div>
  );
}
