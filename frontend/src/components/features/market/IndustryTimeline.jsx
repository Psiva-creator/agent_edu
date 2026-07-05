import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import Card from '../../ui/Card';

export default function IndustryTimeline({ timeline }) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="col-span-full md:col-span-1">
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Clock size={20} className="text-accent-secondary" />
          <h3>Industry Timeline</h3>
        </div>
        
        <div className="timeline-container mt-4 relative pl-4 border-l-2 border-[var(--border)]">
          {timeline.map((event, idx) => (
            <div key={idx} className="timeline-event relative mb-6 last:mb-0">
              <span className="timeline-dot absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-card)]" />
              <div className="timeline-content">
                <span className="timeline-year text-xs font-bold text-[var(--accent-primary)] mb-1 block">{event.timeframe || event.year}</span>
                <h4 className="text-sm font-semibold mb-1">{event.event || event.milestone}</h4>
                <p className="text-xs text-secondary leading-relaxed">{event.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
