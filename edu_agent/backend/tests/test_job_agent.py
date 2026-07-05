"""
Tests: Job Matching Agent
=========================
Covers: parsing profiles, LLM-based matching, fallback matching,
        and preference filtering.
"""
import pytest
from agents.job_agent import JobAgent


class TestJobAgent:
    @pytest.mark.asyncio
    async def test_fallback_job_matching(self, mock_llm):
        agent = JobAgent(llm_service=mock_llm)
        profile = {
            "skills": ["Python", "SQL", "Git", "Docker"],
            "target_role": "Backend Developer",
            "experience_years": 3,
            "current_role": "Student",
        }
        
        result = await agent.find_jobs(profile=profile)
        
        assert result["target_role"] == "Backend Developer"
        assert result["current_role"] == "Student"
        assert result["experience_years"] == 3
        assert result["experience_level"] == "mid"
        assert "matches" in result
        assert len(result["matches"]) > 0
        
        # Verify first match details
        first_match = result["matches"][0]
        assert "title" in first_match
        assert "match_percentage" in first_match
        assert "salary_range" in first_match
        assert first_match["salary_range"]["currency"] == "INR"
        assert "hiring_companies" in first_match
        assert len(first_match["hiring_companies"]) > 0
        assert "required_skills" in first_match
        assert "experience_level" in first_match
        assert "remote_availability" in first_match
        assert "match_reason" in first_match

    @pytest.mark.asyncio
    async def test_fallback_filtering_preferences(self, mock_llm):
        agent = JobAgent(llm_service=mock_llm)
        profile = {
            "skills": ["Python", "SQL"],
            "target_role": "Backend Developer",
            "experience_years": 1,
            "current_role": "Student",
        }
        
        # Apply preferences
        preferences = {
            "remote": True,
            "experience_level": "entry"
        }
        
        result = await agent.find_jobs(profile=profile, preferences=preferences)
        assert result["experience_level"] == "entry"
        for match in result["matches"]:
            assert match["experience_level"] == "entry"

    @pytest.mark.asyncio
    async def test_parse_profile_from_string(self, mock_llm):
        agent = JobAgent(llm_service=mock_llm)
        resume_text = (
            "John Doe. B.S. in Computer Science. "
            "Skills: Java, Spring Boot, Git, SQL, Docker, Python. "
            "Experience: 2 years. Target role: Backend Developer."
        )
        
        result = await agent.find_jobs(profile=resume_text)
        assert result["target_role"] == "Backend Developer"
