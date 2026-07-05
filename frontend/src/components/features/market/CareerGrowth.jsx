import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';
import Card from '../../ui/Card';

export default function CareerGrowth({ ladder, roi }) {
  if (!ladder && !roi) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="col-span-full md:col-span-1">
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <TrendingUp size={20} className="text-success" />
          <h3>Career Growth Path</h3>
        </div>
        
        {ladder && ladder.length > 0 && (
          <div className="career-ladder mt-4">
            {ladder.map((step, idx) => (
              <div key={idx} className="ladder-step flex items-center mb-3 text-sm">
                <span className="step-num bg-[var(--bg-modifier-hover)] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">{idx + 1}</span>
                <span className="step-title font-medium">{step}</span>
                {idx < ladder.length - 1 && <ArrowRight size={14} className="mx-2 text-secondary opacity-50" />}
              </div>
            ))}
          </div>
        )}

        {roi && roi.length > 0 && (
          <div className="learning-roi mt-6 pt-4 border-t border-[var(--border)]">
            <h4 className="text-xs font-semibold uppercase text-secondary mb-3 tracking-wide">High ROI Skills</h4>
            {roi.map((item, idx) => (
              <div key={idx} className="roi-item flex justify-between items-center mb-2 text-sm">
                <span>{item.skill}</span>
                <span className="text-success font-medium">+{item.salary_bump_percent}% Salary</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
