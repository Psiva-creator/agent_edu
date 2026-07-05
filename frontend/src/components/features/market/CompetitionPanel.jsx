import React from 'react';
import { motion } from 'framer-motion';
import { Users, Crosshair, AlertTriangle } from 'lucide-react';
import Card from '../../ui/Card';

export default function CompetitionPanel({ data }) {
  if (!data) return null;

  const difficultyColors = {
    'Low': 'var(--success)',
    'Moderate': 'var(--warning)',
    'High': 'var(--error)',
    'Extreme': 'var(--error)'
  };
  const color = difficultyColors[data.overall_difficulty] || 'var(--warning)';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Users size={20} className="text-error" />
          <h3>Competition Landscape</h3>
        </div>
        
        <div className="competition-main">
          <div className="competition-score" style={{ borderColor: color }}>
            <span className="comp-label">Difficulty</span>
            <span className="comp-value" style={{ color }}>{data.overall_difficulty || 'Moderate'}</span>
          </div>
          
          <div className="competition-stats">
            <div className="comp-stat-item">
              <Crosshair size={14} />
              <span>~{data.applicants_per_role || 50} applicants/role</span>
            </div>
            {data.interview_probability && (
              <div className="comp-stat-item">
                <AlertTriangle size={14} />
                <span>{data.interview_probability}% interview probability</span>
              </div>
            )}
          </div>
        </div>

        {data.key_differentiators && data.key_differentiators.length > 0 && (
          <div className="differentiators mt-4">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">How to stand out</span>
            <ul className="diff-list">
              {data.key_differentiators.map((diff, i) => (
                <li key={i}>{diff}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
