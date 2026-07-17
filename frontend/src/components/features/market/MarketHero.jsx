import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, RefreshCw, Briefcase, Zap } from 'lucide-react';
import Card from '../../ui/Card';
import MarketPulse from './MarketPulse';

export default function MarketHero({ marketData, targetRole }) {
  const demandScore = marketData.demand_score || 0;
  const pulse = marketData.market_pulse || 'Healthy';
  const growthPrediction = marketData.growth_prediction || '+5% YoY';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="col-span-full">
      <Card padding="none" className="market-hero-card relative overflow-hidden border-[var(--border-default)]">
        {/* Animated Particles Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-[var(--accent-primary)] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob"></div>
          <div className="absolute top-[30%] right-[10%] w-64 h-64 bg-[var(--info)] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-[20%] left-[40%] w-64 h-64 bg-[var(--success)] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="px-6 py-8 md:px-8 md:py-10 flex flex-col lg:flex-row lg:items-center justify-between relative z-10 gap-8">
          
          <div className="flex-1 max-w-xl flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              <span className="text-white block">Market Intelligence:</span>
              <span className="text-gradient block mt-1">{targetRole}</span>
            </h1>
            
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-medium text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <Briefcase size={14} className="text-[var(--accent-primary)]" />
                <span>Enterprise Grade AI Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[var(--warning)]" />
                <span>Predictive Modeling</span>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <RefreshCw size={14} className="text-[var(--info)]" />
                <span>Live Data Sync</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-8 lg:gap-12 mt-4 lg:mt-0">
            
            {/* Hiring Growth */}
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] mb-2">Hiring Growth</span>
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-[var(--success)]" />
                <span className="text-[19px] md:text-[21px] font-bold text-white max-w-[320px] leading-snug">
                  {growthPrediction} growth predicted over the next 5 years.
                </span>
              </div>
            </div>

            {/* Demand Score */}
            <div className="flex flex-col items-end min-w-[140px]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] mb-2">Market Demand</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl md:text-6xl font-bold tracking-tighter leading-none text-gradient">{demandScore}</span>
                <span className="text-sm font-bold text-white">/ 100</span>
              </div>
              <div className="mt-3 w-full bg-[var(--bg-modifier-hover)] h-1 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${demandScore}%` }} 
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--info)] rounded-full" 
                />
              </div>
            </div>

          </div>
        </div>
      </Card>
    </motion.div>
  );
}
