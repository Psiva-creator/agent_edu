"""
Router: Jobs
Endpoint for job search.
"""

from fastapi import APIRouter, Depends
from agents.job_agent import JobAgent
from utils.dependencies import get_job_agent

router = APIRouter(tags=["jobs"])

@router.get("/jobs")
async def search_jobs(
    query: str = "", 
    location: str = "",
    agent: JobAgent = Depends(get_job_agent)
):
    """Search for matching job opportunities using JobAgent."""
    
    # We pass the query as the target_role to JobAgent
    result = await agent.find_jobs(
        profile={"target_role": query},
        preferences={"location": location}
    )
    
    # Map the broad role recommendations from JobAgent into specific "job listings"
    # for the frontend JobsPanel to render.
    listings = []
    
    for match in result.get("matches", []):
        companies = match.get("hiring_companies", ["Tech Corp"])
        # Create a "job listing" for the top 3 companies for this role
        for company in companies[:3]:
            salary_dict = match.get("salary_range", {})
            min_sal = salary_dict.get("min", 0) // 100000
            max_sal = salary_dict.get("max", 0) // 100000
            salary_str = f"₹{min_sal}L - ₹{max_sal}L" if min_sal else "Not Disclosed"
            
            listings.append({
                "title": match.get("title", query),
                "company": company,
                "location": location or "Remote / Hybrid",
                "salary": salary_str,
                "match_percentage": match.get("match_percentage", 80),
                "required_skills": match.get("required_skills", []),
                "url": f"https://www.google.com/search?q={query.replace(' ', '+')}+jobs+at+{company}"
            })
            
    # Sort listings by match percentage
    listings.sort(key=lambda x: x["match_percentage"], reverse=True)
    
    return {
        "query": query,
        "location": location,
        "total_found": len(listings),
        "matches": listings
    }
