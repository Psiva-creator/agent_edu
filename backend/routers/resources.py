"""
Router: Resources
==================
GET /resources        — List all skills in the resource library
GET /resources/{skill} — Get full resource details for a specific skill
"""

from fastapi import APIRouter, Depends, status, Query

from schemas.models import (
    ResourceListResponse,
    ResourceSearchResponse,
    ResourceStatsResponse,
    ErrorResponse,
)
from services.resource_service import ResourceService
from utils.dependencies import get_resources

router = APIRouter(prefix="/resources", tags=["Resources"])


# ─── GET /resources ───────────────────────────────────────────

@router.get(
    "",
    response_model=ResourceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all skills",
    description=(
        "Returns a sorted list of all skill names available in the "
        "resource library, along with the total count."
    ),
    responses={
        200: {"description": "Skills listed successfully"},
    },
)
async def list_all_resources(
    svc: ResourceService = Depends(get_resources),
):
    skills = svc.get_all_skill_names()
    return {"skills": skills, "total": len(skills)}


# ─── GET /resources/{skill} ──────────────────────────────────

@router.get(
    "/{skill}",
    response_model=ResourceSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Get resources for a skill",
    description=(
        "Look up a specific skill in the resource library. Returns the full "
        "resource entry (docs, YouTube, course, practice site, mini-project) "
        "if found. If not found, returns suggestions and available skills."
    ),
    responses={
        200: {"description": "Skill found or suggestions returned"},
        404: {"model": ErrorResponse, "description": "Skill not found and no suggestions"},
    },
)
async def get_skill_resources(
    skill: str,
    svc: ResourceService = Depends(get_resources),
):
    result = svc.search(skill)
    return result


# ─── GET /resources — Stats (bonus) ──────────────────────────

@router.get(
    "/meta/stats",
    response_model=ResourceStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Resource library statistics",
    description="Get summary statistics: total skills, categories, difficulty breakdown, total hours.",
    responses={
        200: {"description": "Stats retrieved successfully"},
    },
)
async def resource_stats(
    svc: ResourceService = Depends(get_resources),
):
    return svc.get_stats()


# ─── GET /resources — By category (bonus) ────────────────────

@router.get(
    "/meta/categories",
    status_code=status.HTTP_200_OK,
    summary="List resource categories",
    description="Returns all unique categories in the resource library.",
    responses={
        200: {"description": "Categories listed"},
    },
)
async def list_categories(
    svc: ResourceService = Depends(get_resources),
):
    return {"categories": svc.get_all_categories()}


# ─── GET /resources — Multi-skill lookup (bonus) ─────────────

@router.get(
    "/meta/multi",
    status_code=status.HTTP_200_OK,
    summary="Get resources for multiple skills",
    description="Look up resources for multiple comma-separated skills at once.",
    responses={
        200: {"description": "Multi-skill lookup complete"},
    },
)
async def get_multiple_resources(
    skills: str = Query(..., description="Comma-separated skill names"),
    svc: ResourceService = Depends(get_resources),
):
    skill_list = [s.strip() for s in skills.split(",") if s.strip()]
    return {"skills": svc.get_for_skills(skill_list), "count": len(skill_list)}


# ─── GET /resources — Recommend (bonus) ──────────────────────

@router.get(
    "/meta/recommend",
    status_code=status.HTTP_200_OK,
    summary="Get skill recommendations",
    description=(
        "Recommend skills to learn next based on what you already know. "
        "Filters by category and difficulty, excludes known skills."
    ),
    responses={
        200: {"description": "Recommendations generated"},
    },
)
async def recommend_resources(
    known: str = Query("", description="Comma-separated skills you already know"),
    category: str = Query("", description="Filter by category"),
    difficulty: str = Query("", description="beginner | intermediate | advanced"),
    limit: int = Query(5, ge=1, le=20),
    svc: ResourceService = Depends(get_resources),
):
    known_list = [s.strip() for s in known.split(",") if s.strip()] if known else []
    recs = svc.recommend(
        known_skills=known_list,
        category=category or None,
        difficulty=difficulty or None,
        limit=limit,
    )
    return {"recommendations": recs, "count": len(recs)}
