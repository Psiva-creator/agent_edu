import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, AlertOctagon } from 'lucide-react';
import Card from '../../ui/Card';

export default function MarketHealth({ health, growth }) {
  if (!health && !growth) return null;

  const isHealthy = health?.toLowerCase() !== 'declining';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card padding="md" className="h-full">
        <div className="widget-header">
          {isHealthy ? <ShieldCheck size={20} className="text-success" /> : <AlertOctagon size={20} className="text-error" />}
          <h3>Market Health</h3>
        </div>
        
        <div className="health-content">
          <div className="health-status">
            <span className="health-label">Current Status</span>
            <span className={`health-value ${isHealthy ? 'text-success' : 'text-error'}`}>
              {health || 'Stable'}
            </span>
          </div>
          
          <div className="health-growth mt-4">
            <span className="health-label">Growth Prediction</span>
            <p className="health-desc">{growth || 'Steady growth predicted'}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
