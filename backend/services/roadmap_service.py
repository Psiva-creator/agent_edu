from typing import List, Dict, Any, Optional
from agents.roadmap_agent import RoadmapAgent
from services.llm_service import LLMService
from services.resource_service import ResourceService

class RoadmapService:
    def __init__(self, llm_service: LLMService, resource_service: ResourceService):
        self.agent = RoadmapAgent(
            llm_service=llm_service,
            resource_service=resource_service
        )

    async def generate(
        self,
        skill_gaps: List[str],
        hours_per_week: int,
        deadline_weeks: int,
        current_role: str,
        target_role: str,
    ) -> Dict[str, Any]:
        return await self.agent.generate_roadmap(
            skill_gaps=skill_gaps,
            hours_per_week=hours_per_week,
            deadline_weeks=deadline_weeks,
            current_role=current_role,
            target_role=target_role
        )
