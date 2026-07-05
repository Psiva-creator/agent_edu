import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Activity, UserPlus } from 'lucide-react';
import Card from '../../ui/Card';

export default function HiringDemand({ data }) {
  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Briefcase size={20} className="text-warning" />
          <h3>Hiring Demand</h3>
        </div>

        <div className="demand-metrics">
          <div className="metric-box">
            <span className="metric-icon"><Activity size={18} /></span>
            <div className="metric-info">
              <span className="metric-title">Hiring Velocity</span>
              <span className={`metric-value velocity-${data.hiring_velocity?.toLowerCase()}`}>
                {data.hiring_velocity || 'Stable'}
              </span>
            </div>
          </div>

          <div className="metric-box">
            <span className="metric-icon"><UserPlus size={18} /></span>
            <div className="metric-info">
              <span className="metric-title">Recruiter Activity</span>
              <span className={`metric-value activity-${data.recruiter_activity?.toLowerCase()}`}>
                {data.recruiter_activity || 'Moderate'}
              </span>
            </div>
          </div>
        </div>

        {data.growth_percent && (
          <div className="demand-footer">
            <div className="progress-bar-thin">
              <motion.div 
                className="progress-fill-warning" 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, data.growth_percent * 2)}%` }}
              />
            </div>
            <span className="demand-growth-text">+{data.growth_percent}% YoY Job Growth</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
