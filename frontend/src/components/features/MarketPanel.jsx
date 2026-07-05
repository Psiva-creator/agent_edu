import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

// Import all sub-components
import MarketHero from './market/MarketHero';
import MarketHealth from './market/MarketHealth';
import SalaryIntelligence from './market/SalaryIntelligence';
import HiringDemand from './market/HiringDemand';
import CompanyGrid from './market/CompanyGrid';
import SkillDemand from './market/SkillDemand';
import EmergingTech from './market/EmergingTech';
import LocationIntelligence from './market/LocationIntelligence';
import CompetitionPanel from './market/CompetitionPanel';
import IndustryTimeline from './market/IndustryTimeline';
import CareerGrowth from './market/CareerGrowth';
import RecommendationCenter from './market/RecommendationCenter';
import ExecutiveSummary from './market/ExecutiveSummary';

import './MarketPanel.css';

export default function MarketPanel({ data, formData }) {
  if (!data) {
    return (
      <EmptyState 
        icon={TrendingUp} 
        title="No market data" 
        description="Run a career analysis to see market insights for your target domain." 
      />
    );
  }

  // Gracefully degrade using report properties if market_data is completely missing
  const targetRole = data.target_role || formData?.target_role || 'Your Target Role';
  const marketData = data.market_data || {};
  
  // Fallbacks for legacy/missing data
  const skills = data.skill_gaps || [];
  const companies = marketData.top_companies || data.hiring_companies?.map(name => ({ name })) || [];
  const salary = marketData.salary_insights || data.expected_salary;

  return (
    <div className="market-dashboard">
      <MarketHero marketData={marketData} targetRole={targetRole} />
      
      {marketData.executive_summary && (
        <div className="market-grid-full">
          <ExecutiveSummary summary={marketData.executive_summary} />
        </div>
      )}

      <div className="market-grid-main">
        {/* Row 1: Core Metrics */}
        <div className="market-col">
          <SalaryIntelligence data={salary} />
        </div>
        <div className="market-col">
          <HiringDemand data={marketData.hiring_demand} />
        </div>
        <div className="market-col">
          <MarketHealth health={marketData.market_health} growth={marketData.growth_prediction} />
        </div>
      </div>

      <div className="market-grid-bento">
        {/* Left Column: Skills & Tech */}
        <div className="bento-col-left">
          <SkillDemand skills={skills} metrics={marketData.skill_metrics} />
          <EmergingTech tech={marketData.emerging_technologies} trends={marketData.technology_trends} />
        </div>
        
        {/* Right Column: Companies & Competition */}
        <div className="bento-col-right">
          <CompanyGrid companies={companies} />
          <CompetitionPanel data={marketData.competition_metrics} />
          <LocationIntelligence locations={marketData.location_insights} />
        </div>
      </div>

      <div className="market-grid-timeline">
        <CareerGrowth ladder={marketData.career_ladder} roi={marketData.learning_roi} />
        <IndustryTimeline timeline={marketData.industry_timeline} />
      </div>

      {marketData.recommendations && (
        <div className="market-grid-full mt-6">
          <RecommendationCenter recommendations={marketData.recommendations} />
        </div>
      )}
    </div>
  );
}
