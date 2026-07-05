import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import Card from '../../ui/Card';

export default function SalaryIntelligence({ data }) {
  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <DollarSign size={20} className="text-success" />
          <h3>Salary Intelligence</h3>
        </div>

        <div className="salary-grid">
          <div className="salary-main">
            <span className="salary-label">Average Base Salary</span>
            <span className="salary-value">
              {data.currency} {data.average?.toLocaleString()}
            </span>
            <div className="salary-growth">
              <TrendingUp size={14} />
              <span>+{data.growth_percent}% projected growth</span>
            </div>
          </div>

          <div className="salary-bars">
            {['entry', 'junior', 'mid', 'senior', 'lead'].map((level) => {
              if (!data[level]) return null;
              // Calculate width relative to highest salary for visualization
              const maxSal = data.highest || Math.max(
                data.lead || 0, 
                data.senior || 0, 
                data.mid || 0, 
                data.junior || 0, 
                data.entry || 0
              );
              const safeMax = maxSal > 0 ? maxSal : 1;
              const width = Math.max(15, (data[level] / safeMax) * 100);
              
              return (
                <div key={level} className="salary-bar-item">
                  <div className="salary-bar-header">
                    <span className="level-name">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                    <span className="level-val">{data.currency} {data[level].toLocaleString()}</span>
                  </div>
                  <div className="salary-bar-track">
                    <motion.div 
                      className="salary-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
