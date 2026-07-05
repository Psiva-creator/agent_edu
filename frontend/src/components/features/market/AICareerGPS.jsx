import React from 'react';
import { motion } from 'framer-motion';
import { Map, MapPin, Navigation, Clock, ShieldCheck } from 'lucide-react';
import Card from '../../ui/Card';

export default function AICareerGPS({ data }) {
  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card padding="lg" className="h-full border-[var(--accent-primary)] border-opacity-30 relative overflow-hidden bg-gradient-to-br from-[var(--bg-card)] to-[rgba(var(--accent-primary-rgb),0.05)]">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--accent-primary) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

        <div className="widget-header mb-6 relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgba(var(--accent-primary-rgb),0.1)] rounded-lg text-accent">
              <Map size={24} />
            </div>
            <h3 className="text-xl font-bold tracking-tight">AI Career GPS</h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-success bg-[rgba(var(--success-rgb),0.1)] px-3 py-1 rounded-full border border-[rgba(var(--success-rgb),0.2)]">
            <ShieldCheck size={14} />
            <span>{data.confidence_percentage}% Confidence</span>
          </div>
        </div>
        
        <div className="gps-content relative z-10 mt-6">
          <div className="path-visualization flex flex-col relative pb-4 pl-4 border-l-2 border-dashed border-[var(--accent-primary)] border-opacity-50 ml-4">
            
            {/* Start Node */}
            <div className="path-node relative mb-12">
              <div className="absolute -left-[23px] top-0 w-5 h-5 rounded-full bg-[var(--bg-card)] border-2 border-[var(--text-secondary)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)]" />
              </div>
              <div className="node-content -mt-1 pl-4">
                <span className="text-xs uppercase font-bold text-secondary tracking-wider block mb-1">Current Position</span>
                <h4 className="text-lg font-semibold">{data.current_position || 'Your Current Role'}</h4>
              </div>
            </div>

            {/* Travel Info Badge */}
            <div className="absolute left-[-16px] top-[45px] bg-[var(--bg-modifier-hover)] border border-[var(--border)] rounded-full px-3 py-1.5 flex flex-col gap-1 text-xs whitespace-nowrap shadow-md">
              <div className="flex items-center gap-2 text-secondary">
                <Navigation size={12} className="text-accent" /> {data.distance_remaining || 'Learning path generated'}
              </div>
              <div className="flex items-center gap-2 text-secondary">
                <Clock size={12} className="text-warning" /> {data.estimated_time || 'Variable'}
              </div>
            </div>

            {/* End Node */}
            <div className="path-node relative mt-8">
              <div className="absolute -left-[23px] top-0 w-5 h-5 rounded-full bg-[var(--bg-card)] border-2 border-[var(--accent-primary)] flex items-center justify-center shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.5)]">
                <MapPin size={12} className="text-accent" />
              </div>
              <div className="node-content -mt-1 pl-4">
                <span className="text-xs uppercase font-bold text-accent tracking-wider block mb-1">Destination</span>
                <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] to-[var(--accent-primary)]">
                  {data.destination || 'Target Role'}
                </h4>
              </div>
            </div>
            
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
