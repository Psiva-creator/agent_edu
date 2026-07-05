import React from 'react';
import { motion } from 'framer-motion';
import { Map, ArrowRight } from 'lucide-react';
import Card from '../../ui/Card';

export default function LocationIntelligence({ locations }) {
  if (!locations || locations.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Map size={20} className="text-info" />
          <h3>Top Tech Hubs</h3>
        </div>
        
        <div className="location-list">
          {locations.map((loc, idx) => (
            <div key={idx} className="location-item">
              <div className="location-info">
                <span className="location-city">{loc.city}</span>
                <span className="location-share">{loc.job_share || 0}% of jobs</span>
              </div>
              <div className="location-salary">
                <span className="text-sm text-secondary">Avg. Salary</span>
                <span className="font-medium">{loc.avg_salary_multiplier ? `~${loc.avg_salary_multiplier}x` : 'Avg'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
