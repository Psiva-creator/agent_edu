import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import Card from '../../ui/Card';

export default function OpportunityTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="col-span-full md:col-span-1">
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Clock size={20} className="text-secondary" />
          <h3>Opportunity Forecast</h3>
        </div>
        
        <div className="mt-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--border)] before:to-transparent">
          {timeline.map((item, idx) => (
            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6 last:mb-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-secondary group-[.is-active]:text-[var(--accent-primary)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></div>
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-[var(--border)] bg-[var(--bg-modifier-hover)] shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-[var(--accent-primary)]">{item.timeframe}</div>
                </div>
                <div className="text-sm text-secondary leading-relaxed">{item.prediction}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
