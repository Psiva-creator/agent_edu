"""
Skills Router
=============
REST endpoints for Skill Intelligence Dashboard.
"""
from fastapi import APIRouter, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from agents.skill_agent import SkillAgent
from services.llm_service import LLMService
from schemas.models import SkillIntelligenceRequest

router = APIRouter(tags=["Skills"])

_llm = LLMService()
_agent = SkillAgent(llm_service=_llm)

@router.post(
    "/skills/analyze",
    status_code=status.HTTP_200_OK,
    summary="Analyze skills for Skill Intelligence Dashboard",
)
async def analyze_skills(data: SkillIntelligenceRequest):
    """Generate detailed skill analytics based on current and target skills."""
    career_context = {
        "current_skills": data.current_skills,
        "skill_gaps": data.skill_gaps,
        "target_role": data.target_role,
        "experience_years": data.experience_years
    }
    return await _agent.analyze_skills(career_context)
