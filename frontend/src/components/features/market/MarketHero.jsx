import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, MapPin, Target } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import '../MarketPanel.css';

export default function MarketHero({ marketData, targetRole }) {
  const industry = marketData?.industry || targetRole;
  const location = marketData?.location || 'Global';
  const score = marketData?.demand_score || 85;
  const health = marketData?.market_health || 'Growing';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="market-hero">
      <Card variant="accent" padding="xl" className="market-hero-card">
        <div className="market-hero__content">
          <Badge variant="primary" className="market-hero__badge">
            <Target size={14} /> AI Market Intelligence
          </Badge>
          
          <h1 className="market-hero__title">
            <span className="text-gradient">{industry}</span> Market
          </h1>
          
          <div className="market-hero__meta">
            <div className="meta-item">
              <MapPin size={16} />
              <span>{location}</span>
            </div>
            <div className="meta-item">
              <TrendingUp size={16} />
              <span>{health} Market</span>
            </div>
            <div className="meta-item">
              <Clock size={16} />
              <span>Live Analysis</span>
            </div>
          </div>
        </div>

        <div className="market-hero__stats">
          <div className="stat-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" className="circle-bg" />
              <motion.circle 
                cx="50" cy="50" r="45" 
                className="circle-progress"
                initial={{ strokeDashoffset: 283 }}
                animate={{ strokeDashoffset: 283 - (283 * score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="stat-value">
              <span className="num">{Math.round(score)}</span>
              <span className="label">Demand Score</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
