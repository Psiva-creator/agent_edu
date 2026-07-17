"""
Tests: Market Agent
====================
Covers: market analysis, predefined fallbacks, sector mapping,
        and LLM integration check.
"""
import pytest
from agents.market_agent import MarketAgent


class TestMarketAgent:
    @pytest.mark.asyncio
    async def test_fallback_market_analysis(self, mock_llm):
        agent = MarketAgent(llm_service=mock_llm)
        # Ensure it falls back and returns structured data
        result = await agent.analyze_market(industry="software engineering", location="India")
        
        assert result["industry"] == "software engineering"
        assert result["location"] == "India"
        assert "trends" in result
        assert len(result["trends"]) > 0
        assert "future_opportunities" in result
        assert len(result["future_opportunities"]) > 0
        assert isinstance(result["demand_score"], float)
        assert 0.0 <= result["demand_score"] <= 100.0
        assert "emerging_technologies" in result
        assert len(result["emerging_technologies"]) > 0
        assert "in_demand_skills" in result
        assert len(result["in_demand_skills"]) > 0

    @pytest.mark.asyncio
    async def test_generic_fallback(self, mock_llm):
        agent = MarketAgent(llm_service=mock_llm)
        result = await agent.analyze_market(industry="custom legacy sector", location="Global")
        
        assert result["industry"] == "custom legacy sector"
        assert isinstance(result["demand_score"], float)
        assert 0.0 <= result["demand_score"] <= 100.0
        assert len(result["trends"]) > 0
