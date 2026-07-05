import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import Card from '../../ui/Card';

export default function OpportunityRadar({ data }) {
  if (!data || data.length === 0) return null;

  // Group opportunities by category
  const categories = {
    'High': data.filter(d => d.category.includes('High')),
    'Medium': data.filter(d => d.category.includes('Medium')),
    'Emerging': data.filter(d => d.category.includes('Emerging')),
    'Declining': data.filter(d => d.category.includes('Declining'))
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="h-full">
      <Card padding="md" className="h-full">
        <div className="widget-header">
          <Target size={20} className="text-accent" />
          <h3>Opportunity Radar</h3>
        </div>
        
        <div className="radar-container mt-4 relative flex items-center justify-center h-64 overflow-hidden rounded-xl bg-[var(--bg-modifier-hover)] border border-[var(--border)]">
          {/* Radar Circles */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-16 h-16 rounded-full border border-accent absolute"></div>
            <div className="w-32 h-32 rounded-full border border-accent absolute"></div>
            <div className="w-48 h-48 rounded-full border border-accent absolute"></div>
            <div className="w-64 h-64 rounded-full border border-accent absolute bg-[rgba(var(--accent-primary-rgb),0.02)]"></div>
          </div>
          
          {/* Scanning Line Animation */}
          <motion.div 
            className="absolute w-32 h-32 origin-bottom-right rounded-tl-full border-l-2 border-accent bg-gradient-to-tr from-[rgba(var(--accent-primary-rgb),0.2)] to-transparent"
            style={{ right: '50%', bottom: '50%' }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          />

          {/* Dots/Opportunities */}
          {categories['High']?.map((opp, i) => (
            <motion.div key={`h-${i}`} className="absolute w-2 h-2 rounded-full bg-success shadow-[0_0_8px_var(--success)]" style={{ top: `${30 + i * 15}%`, left: `${40 + i * 10}%` }} title={opp.opportunity_name} whileHover={{ scale: 2 }}>
              <span className="absolute top-3 -left-10 w-24 text-center text-[10px] font-bold text-success opacity-0 hover:opacity-100 transition-opacity bg-[var(--bg-card)] px-1 rounded">{opp.opportunity_name}</span>
            </motion.div>
          ))}
          
          {categories['Emerging']?.map((opp, i) => (
            <motion.div key={`e-${i}`} className="absolute w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent-primary)]" style={{ top: `${20 + i * 20}%`, right: `${30 + i * 15}%` }} title={opp.opportunity_name} whileHover={{ scale: 2 }}>
              <span className="absolute top-3 -left-10 w-24 text-center text-[10px] font-bold text-accent opacity-0 hover:opacity-100 transition-opacity bg-[var(--bg-card)] px-1 rounded">{opp.opportunity_name}</span>
            </motion.div>
          ))}

          {categories['Medium']?.map((opp, i) => (
            <motion.div key={`m-${i}`} className="absolute w-2 h-2 rounded-full bg-warning shadow-[0_0_8px_var(--warning)]" style={{ bottom: `${30 + i * 10}%`, left: `${25 + i * 20}%` }} title={opp.opportunity_name} whileHover={{ scale: 2 }}>
              <span className="absolute top-3 -left-10 w-24 text-center text-[10px] font-bold text-warning opacity-0 hover:opacity-100 transition-opacity bg-[var(--bg-card)] px-1 rounded">{opp.opportunity_name}</span>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <span className="text-[10px] uppercase font-bold text-success flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> High</span>
          <span className="text-[10px] uppercase font-bold text-accent flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent"></div> Emerging</span>
          <span className="text-[10px] uppercase font-bold text-warning flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning"></div> Medium</span>
        </div>
      </Card>
    </motion.div>
  );
}
