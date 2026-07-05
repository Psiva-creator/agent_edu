import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ChevronRight } from 'lucide-react';
import Card from '../../ui/Card';

export default function RecommendationCenter({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="col-span-full">
      <Card padding="lg" className="recommendation-center-card bg-gradient-to-br from-[var(--bg-card)] to-[rgba(var(--accent-primary-rgb),0.05)] border-[var(--accent-primary)] border-opacity-20">
        <div className="widget-header mb-6">
          <Lightbulb size={24} className="text-accent" />
          <h3 className="text-xl">Actionable AI Recommendations</h3>
        </div>
        
        <div className="recommendations-grid">
          {recommendations.map((rec, idx) => (
            <motion.div 
              key={idx} 
              className="recommendation-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + (idx * 0.1) }}
            >
              <div className="rec-header">
                <span className="rec-type">{rec.type || 'Strategy'}</span>
                <span className={`rec-impact impact-${rec.impact?.toLowerCase() || 'medium'}`}>
                  {rec.impact || 'Medium'} Impact
                </span>
              </div>
              <h4 className="rec-action">{rec.action}</h4>
              <p className="rec-reason">{rec.reasoning}</p>
              
              <div className="rec-footer">
                <span className="rec-timeframe">{rec.timeframe || 'Immediate'}</span>
                <ChevronRight size={16} className="text-secondary" />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
