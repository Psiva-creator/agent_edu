"""
Router: Jobs
Endpoint for job search.
"""

from fastapi import APIRouter

router = APIRouter(tags=["jobs"])


@router.get("/jobs")
async def search_jobs(query: str = "", location: str = ""):
    """Search for matching job opportunities."""
    # TODO: Integrate with JobAgent
    return {"message": "Job search endpoint", "query": query, "location": location, "results": []}
