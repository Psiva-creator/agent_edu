import React from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import Card from '../../ui/Card';

export default function HiddenOpportunities({ opportunities }) {
  if (!opportunities || opportunities.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="col-span-full md:col-span-1">
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Search size={20} className="text-info" />
          <h3>Hidden Opportunities</h3>
        </div>
        
        <p className="text-xs text-secondary mb-4">Roles you haven't considered that match your skill profile:</p>
        
        <div className="flex flex-col gap-3">
          {opportunities.map((opp, idx) => (
            <div key={idx} className="group p-3 rounded-lg bg-[var(--bg-modifier-hover)] border border-[var(--border)] hover:border-info transition-colors">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-info transition-colors">{opp.role}</h4>
                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(var(--info-rgb),0.1)] text-info border border-[rgba(var(--info-rgb),0.2)]">
                  {opp.match_score}% Match
                </div>
              </div>
              <p className="text-xs text-secondary leading-relaxed mb-2">
                {opp.reason}
              </p>
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-info opacity-0 group-hover:opacity-100 transition-opacity">
                Explore Role <ArrowRight size={10} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
