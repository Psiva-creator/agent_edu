import React from 'react';
import { motion } from 'framer-motion';
import { GitCompare, CheckCircle2 } from 'lucide-react';
import Card from '../../ui/Card';

export default function AIDecisionAssistant({ decision }) {
  if (!decision) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-full">
      <Card padding="lg" className="h-full bg-gradient-to-r from-[var(--bg-card)] to-[rgba(var(--bg-modifier-hover),0.3)]">
        <div className="widget-header mb-6">
          <GitCompare size={20} className="text-accent" />
          <h3>AI Decision Assistant</h3>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6 px-4 pb-2 border-b border-[var(--border)]">
              <h4 className="text-lg font-bold w-1/3">{decision.career_a}</h4>
              <span className="text-xs text-secondary uppercase font-bold tracking-widest w-1/3 text-center">VS</span>
              <h4 className="text-lg font-bold w-1/3 text-right">{decision.career_b}</h4>
            </div>
            
            <div className="flex flex-col gap-3">
              {decision.comparison?.map((comp, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 px-4 hover:bg-[var(--bg-modifier-hover)] rounded-lg transition-colors group">
                  <div className={`w-1/3 text-sm font-semibold ${comp.winner.includes('A') ? 'text-success' : 'text-secondary'}`}>
                    {comp.winner.includes('A') && <CheckCircle2 size={14} className="inline mr-1" />}
                    {comp.winner.includes('A') ? 'Winner' : ''}
                  </div>
                  
                  <div className="w-1/3 text-center flex flex-col items-center">
                    <span className="text-[11px] uppercase tracking-wider text-secondary mb-1">{comp.metric}</span>
                    <span className="text-xs text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity absolute mt-6 bg-[var(--bg-card)] p-2 rounded shadow-lg z-10 w-48 border border-[var(--border)]">{comp.details}</span>
                  </div>
                  
                  <div className={`w-1/3 text-right text-sm font-semibold ${comp.winner.includes('B') ? 'text-success' : 'text-secondary'}`}>
                    {comp.winner.includes('B') ? 'Winner' : ''}
                    {comp.winner.includes('B') && <CheckCircle2 size={14} className="inline ml-1" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:w-64 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[var(--border)] pt-6 md:pt-0 md:pl-8">
            <span className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2 block">AI Recommendation</span>
            <p className="text-sm leading-relaxed text-[var(--text-primary)] font-medium bg-[rgba(var(--accent-primary-rgb),0.1)] p-4 rounded-xl border border-[rgba(var(--accent-primary-rgb),0.2)] shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.05)]">
              "{decision.recommendation}"
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
