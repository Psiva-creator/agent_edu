"""
Router: Roadmap
================
POST /roadmap — Generate a personalized career roadmap with week-by-week breakdown
"""

from fastapi import APIRouter, Depends, status

from schemas.models import RoadmapRequest, RoadmapResponse
from agents.roadmap_agent import RoadmapAgent
from utils.dependencies import get_roadmap_agent

router = APIRouter(tags=["Roadmap"])


# ─── POST /roadmap ────────────────────────────────────────────

@router.post(
    "/roadmap",
    response_model=RoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a career roadmap",
    description=(
        "Generate a personalized week-by-week career roadmap based on "
        "skill gaps, available hours, and deadline. Each week includes: "
        "learning objectives, tasks, resources, practice exercises, "
        "a mini-project, milestone, and estimated hours."
    ),
    responses={
        201: {"description": "Roadmap generated successfully"},
        422: {"description": "Validation error"},
    },
)
async def generate_roadmap(
    data: RoadmapRequest,
    agent: RoadmapAgent = Depends(get_roadmap_agent),
):
    result = await agent.generate_roadmap(
        skill_gaps=data.skill_gaps,
        hours_per_week=data.hours_per_week,
        deadline_weeks=data.deadline_weeks,
        current_role=data.current_role,
        target_role=data.target_role,
    )
    return result
