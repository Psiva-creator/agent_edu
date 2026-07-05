import React from 'react';
import { Activity } from 'lucide-react';

export default function MarketPulse({ pulse }) {
  if (!pulse) return null;
  
  // Healthy, Growing, Cooling, Hot
  const pulseColors = {
    'Hot': 'text-error shadow-[0_0_15px_var(--error)]',
    'Growing': 'text-success shadow-[0_0_15px_var(--success)]',
    'Healthy': 'text-accent shadow-[0_0_15px_var(--accent-primary)]',
    'Cooling': 'text-warning shadow-[0_0_15px_var(--warning)]'
  };
  
  const statusClass = pulseColors[pulse] || pulseColors['Healthy'];

  return (
    <div className="flex items-center gap-3 bg-[var(--bg-modifier-hover)] rounded-full px-4 py-1.5 border border-[var(--border)]">
      <div className="relative flex items-center justify-center">
        <Activity size={14} className={statusClass.split(' ')[0]} />
        <span className={`absolute w-2 h-2 rounded-full animate-ping ${statusClass.split(' ')[0].replace('text-', 'bg-')}`}></span>
      </div>
      <span className="text-[11px] uppercase font-bold tracking-widest text-secondary pt-[1px]">Market Pulse: <span className="text-primary">{pulse}</span></span>
    </div>
  );
}
