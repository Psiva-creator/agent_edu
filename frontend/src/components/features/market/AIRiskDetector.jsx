import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import Card from '../../ui/Card';

export default function AIRiskDetector({ risks }) {
  if (!risks || risks.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="col-span-full md:col-span-1">
      <Card padding="md" className="h-full border-error border-opacity-30 bg-gradient-to-br from-[var(--bg-card)] to-[rgba(var(--error-rgb),0.02)]">
        <div className="widget-header">
          <AlertTriangle size={20} className="text-error" />
          <h3 className="text-error">AI Risk Detector</h3>
        </div>
        
        <div className="flex flex-col gap-3 mt-4">
          {risks.map((risk, idx) => {
            const isHigh = risk.severity?.toLowerCase() === 'high';
            return (
              <div key={idx} className={`p-3 rounded-lg border ${isHigh ? 'bg-[rgba(var(--error-rgb),0.05)] border-[rgba(var(--error-rgb),0.2)]' : 'bg-[var(--bg-modifier-hover)] border-[var(--border)]'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs uppercase font-bold tracking-wider ${isHigh ? 'text-error' : 'text-warning'}`}>{risk.risk_type}</span>
                  {isHigh && <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                  </span>}
                </div>
                <p className="text-sm text-[var(--text-primary)] opacity-90 leading-relaxed">
                  {risk.description}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
