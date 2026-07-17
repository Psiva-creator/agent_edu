import pytest
from unittest.mock import MagicMock
from agents.skill_agent import SkillAgent

@pytest.mark.asyncio
async def test_skill_agent_fallback_is_dynamic():
    """
    Ensure the fallback response returns different data for different inputs.
    """
    # Create an agent with LLM forced to unavailable to trigger fallback
    mock_llm = MagicMock()
    mock_llm.is_available = False
    
    agent = SkillAgent(llm_service=mock_llm)
    
    # Input 1: Cloud Engineer, lots of experience
    context_1 = {
        "current_skills": ["Python", "AWS", "Docker"],
        "skill_gaps": ["Kubernetes"],
        "target_role": "Cloud Architect",
        "experience_years": 8
    }
    
    # Input 2: Junior Data Analyst, little experience
    context_2 = {
        "current_skills": ["SQL", "Excel"],
        "skill_gaps": ["Python", "Machine Learning"],
        "target_role": "Data Analyst",
        "experience_years": 1
    }
    
    result_1 = await agent.analyze_skills(context_1)
    result_2 = await agent.analyze_skills(context_2)
    
    # Verify the fallback source is set
    assert result_1.get("source") == "fallback"
    assert result_2.get("source") == "fallback"
    
    # Ensure they are not identical
    assert result_1["overall_market_readiness"] != result_2["overall_market_readiness"]
    assert result_1["top_priority_skill"] != result_2["top_priority_skill"]
    assert result_1["total_learning_hours"] != result_2["total_learning_hours"]
    
    # Check that categories were assigned somewhat dynamically
    skills_1 = {s["name"]: s for s in result_1["skills"]}
    skills_2 = {s["name"]: s for s in result_2["skills"]}
    
    assert skills_1["AWS"]["category"] == "Cloud"
    assert skills_2["SQL"]["category"] == "Data/AI"
    
    # Current level scaling test
    assert skills_1["Python"]["current_level"] > skills_2["SQL"]["current_level"]
