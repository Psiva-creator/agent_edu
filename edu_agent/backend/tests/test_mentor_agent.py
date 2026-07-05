"""
Tests: Mentor Agent
====================
Covers: mentorship advice generation, fallback advice construction,
        and agent integration.
"""
import pytest
from agents.mentor_agent import MentorAgent


class TestMentorAgent:
    @pytest.mark.asyncio
    async def test_fallback_guidance(self, mock_llm):
        agent = MentorAgent(llm_service=mock_llm)
        profile = {
            "name": "Rishi Sharma",
            "skills": ["Python", "SQL"],
            "target_role": "Data Scientist",
            "experience_years": 2,
            "current_role": "Student",
        }
        
        result = await agent.get_guidance(profile=profile)
        
        assert "personalized_advice" in result
        assert "Rishi Sharma" in result["personalized_advice"]
        assert "Data Scientist" in result["personalized_advice"]
        
        # Verify required fields exist
        assert "weekly_goals" in result
        assert len(result["weekly_goals"]) > 0
        assert "monthly_goals" in result
        assert len(result["monthly_goals"]) > 0
        assert "interview_tips" in result
        assert len(result["interview_tips"]) > 0
        assert "motivation" in result
        assert "common_mistakes" in result
        assert len(result["common_mistakes"]) > 0
        assert "learning_strategy" in result
