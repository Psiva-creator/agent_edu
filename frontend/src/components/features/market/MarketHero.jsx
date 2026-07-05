import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, RefreshCw, Briefcase, Zap } from 'lucide-react';
import Card from '../../ui/Card';
import CareerWeather from './CareerWeather';
import MarketPulse from './MarketPulse';

export default function MarketHero({ marketData, targetRole }) {
  const demandScore = marketData.demand_score || 0;
  const pulse = marketData.market_pulse || 'Healthy';
  const weather = marketData.career_weather || 'Sunny';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="col-span-full">
      <Card padding="none" className="market-hero-card">
        {/* Animated Particles Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-[var(--accent-primary)] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob"></div>
          <div className="absolute top-[30%] right-[10%] w-64 h-64 bg-[var(--info)] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-[20%] left-[40%] w-64 h-64 bg-[var(--success)] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between relative z-10">
          <div className="market-hero__content flex-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="market-hero__badge bg-[rgba(var(--accent-primary-rgb),0.1)] text-[var(--accent-primary)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-[rgba(var(--accent-primary-rgb),0.2)]">
                AI Market Intelligence
              </span>
              <MarketPulse pulse={pulse} />
            </div>
            
            <h1 className="market-hero__title mb-4">
              Market Intelligence for <br/>
              <span className="text-gradient leading-tight">{targetRole}</span>
            </h1>
            
            <div className="market-hero__meta mt-6">
              <div className="meta-item">
                <Briefcase size={16} className="text-[var(--accent-primary)]" />
                <span>Enterprise Grade AI Analysis</span>
              </div>
              <div className="meta-item">
                <Zap size={16} className="text-[var(--warning)]" />
                <span>Predictive Modeling</span>
              </div>
              <div className="meta-item">
                <RefreshCw size={16} className="text-[var(--info)]" />
                <span>Live Data Sync</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 mt-8 md:mt-0">
            <div className="hidden md:block">
              <CareerWeather condition={weather} />
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] mb-1">Market Demand</span>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-bold tracking-tighter leading-none text-gradient">{demandScore}</span>
                <span className="text-xl font-medium text-[var(--text-secondary)] mb-1">/ 100</span>
              </div>
              <div className="mt-3 bg-[var(--bg-modifier-hover)] h-1.5 w-full rounded-full overflow-hidden">
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
