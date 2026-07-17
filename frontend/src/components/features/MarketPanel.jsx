import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import FallbackBanner from '../ui/FallbackBanner';

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

// New Premium Visualizers
import AICareerGPS from './market/AICareerGPS';
import OpportunityRadar from './market/OpportunityRadar';
import FutureSimulator from './market/FutureSimulator';
import AIDecisionAssistant from './market/AIDecisionAssistant';
import OpportunityTimeline from './market/OpportunityTimeline';
import AIRiskDetector from './market/AIRiskDetector';
import HiddenOpportunities from './market/HiddenOpportunities';
import RecruiterPerspective from './market/RecruiterPerspective';
import MarketStory from './market/MarketStory';

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
      <FallbackBanner source={data.source} />
      <MarketHero marketData={marketData} targetRole={targetRole} />
      
      {marketData.executive_summary && (
        <div className="market-grid-full">
          <ExecutiveSummary summary={marketData.executive_summary} />
        </div>
      )}

      {/* Row 1: Core Metrics */}
      <div className="market-grid-main">
        {salary && (
          <div className="market-col">
            <SalaryIntelligence data={salary} />
          </div>
        )}
        {marketData.hiring_demand && (
          <div className="market-col">
            <HiringDemand data={marketData.hiring_demand} />
          </div>
        )}
        {(marketData.market_health || marketData.growth_prediction) && (
          <div className="market-col">
            <MarketHealth health={marketData.market_health} growth={marketData.growth_prediction} />
          </div>
        )}
      </div>

      {/* Row 2: Premium AI Features (New) */}
      <div className="market-grid-ai">
        <div className="col-span-12 lg:col-span-4">
          <AICareerGPS data={marketData.ai_career_gps} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col gap-6">
          <OpportunityRadar data={marketData.opportunity_radar} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <FutureSimulator scenarios={marketData.future_simulator} />
        </div>
      </div>

      {/* Row 3: AI Decisions & Risk */}
      <div className="market-grid-ai-secondary">
        <div className="col-span-12 lg:col-span-8">
          <AIDecisionAssistant decision={marketData.decision_assistant} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <AIRiskDetector risks={marketData.ai_risk_detector} />
        </div>
      </div>

      {/* Row 4: Bento Box (Skills, Tech, Companies, Competition) */}
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

      {/* Row 5: Timelines & Forecasts */}
      <div className="market-grid-timeline">
        <CareerGrowth ladder={marketData.career_ladder} roi={marketData.learning_roi} />
        <OpportunityTimeline timeline={marketData.opportunity_timeline} />
        <IndustryTimeline timeline={marketData.industry_timeline} />
      </div>

      {/* Row 6: Narrative & Hidden Opportunities */}
      <div className="market-grid-narrative">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <RecruiterPerspective data={marketData.recruiter_perspective} />
          <MarketStory data={marketData.market_story} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <HiddenOpportunities opportunities={marketData.hidden_opportunities} />
        </div>
      </div>

      {/* Row 7: Actionable Recommendations */}
      {marketData.recommendations && (
        <div className="market-grid-full mt-6">
          <RecommendationCenter recommendations={marketData.recommendations} />
        </div>
      )}
    </div>
  );
}
