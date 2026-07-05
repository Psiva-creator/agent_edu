import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Rocket } from 'lucide-react';
import Card from '../../ui/Card';

export default function EmergingTech({ tech, trends }) {
  if ((!tech || tech.length === 0) && (!trends || trends.length === 0)) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Cpu size={20} className="text-accent" />
          <h3>Emerging Tech & Trends</h3>
        </div>

        <div className="tech-trends-container">
          {trends && trends.length > 0 ? (
            <div className="trends-list">
              {trends.map((t, idx) => (
                <div key={idx} className="trend-item">
                  <div className="trend-icon"><Rocket size={16} /></div>
                  <div className="trend-content">
                    <span className="trend-name">{t.technology || t.trend || t}</span>
                    <span className="trend-phase">{t.adoption_phase || 'Emerging'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tech-tags">
              {tech.map((t, i) => (
                <div key={i} className="tech-tag">
                  <span className="tech-dot" />
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
