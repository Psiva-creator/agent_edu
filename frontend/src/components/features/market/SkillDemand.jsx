import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowUpRight } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';

export default function SkillDemand({ skills, metrics }) {
  if (!skills || skills.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Zap size={20} className="text-warning" />
          <h3>Skills in Demand</h3>
        </div>
        
        {metrics && metrics.length > 0 ? (
          <div className="skill-metrics-list">
            {metrics.map((m, idx) => (
              <div key={idx} className="skill-metric-item">
                <div className="skill-metric-header">
                  <span className="skill-name">{m.skill}</span>
                  {m.salary_impact && <Badge variant="success" size="sm">+{m.salary_impact}</Badge>}
                </div>
                <div className="skill-progress">
                  <motion.div 
                    className="skill-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${m.demand_percent || 50}%` }}
                    transition={{ delay: 0.3 + idx * 0.1, duration: 0.8 }}
                  />
                </div>
                <div className="skill-metric-footer">
                  <span>{m.demand_percent}% Demand</span>
                  <span className="skill-diff">{m.difficulty || 'Moderate'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="market-panel__badges mt-4">
            {skills.map((skill, i) => (
              <Badge key={i} variant="outline" size="md">
                {skill} <ArrowUpRight size={12} className="ml-1 opacity-50" />
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
