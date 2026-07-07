"""
Skill Intelligence Agent
========================
AI Agent that analyzes the user's career memory (resume skills, target role, roadmap skill gaps)
and returns a comprehensive Skill Intelligence report with market demand, salary impact,
current vs target levels, time required, and related skills.
"""

import logging
from typing import Optional, Dict, Any

from services.llm_service import LLMService

logger = logging.getLogger(__name__)

class SkillAgent:
    """Agent for deep skill analytics."""

    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm = llm_service or LLMService()

    async def analyze_skills(self, career_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze current skills and gaps based on the career context.
        """
        current_skills = career_context.get("current_skills", [])
        skill_gaps = career_context.get("skill_gaps", [])
        target_role = career_context.get("target_role", "Software Engineer")
        experience = career_context.get("experience_years", 0)

        all_skills = list(set(current_skills + skill_gaps))

        if not all_skills:
            return self._empty_response()

        prompt = f"""You are an elite Tech Career Analyst providing Skill Intelligence.

Candidate Profile:
- Target Role: {target_role}
- Experience: {experience} years
- Current Skills: {", ".join(current_skills) if current_skills else "None specified"}
- Missing Skills / Gaps: {", ".join(skill_gaps) if skill_gaps else "None specified"}

Analyze these specific skills: {", ".join(all_skills[:15])}

For EACH skill, provide a realistic assessment of:
- current_level (0-100): 0 if it's a gap, or 40-90 based on their experience if it's a current skill.
- target_level (0-100): What level is expected for a {target_role}.
- market_demand (0-100): How hot is this skill in the current job market?
- salary_impact (0-100): How much does mastering this increase earning potential?
- time_required (hours): Estimated study/practice hours to reach target_level.
- category: One of [Core, Framework, Tool, Soft Skill, Cloud, Database].
- related_skills: 2-3 associated skills.

Return EXACTLY this JSON structure:
{{
  "overall_market_readiness": <0-100>,
  "top_priority_skill": "<skill_name>",
  "total_learning_hours": <integer>,
  "skills": [
    {{
      "name": "<skill_name>",
      "is_gap": <boolean>,
      "current_level": <0-100>,
      "target_level": <0-100>,
      "market_demand": <0-100>,
      "salary_impact": <0-100>,
      "time_required_hours": <integer>,
      "category": "<category>",
      "related_skills": ["<skill1>", "<skill2>"]
    }}
  ]
}}
"""

        system_msg = "You are a precise data API. Return ONLY valid JSON matching the exact schema."

        if self.llm.is_available:
            try:
                data = await self.llm.generate_json(prompt, system_message=system_msg)
                if isinstance(data, dict) and "skills" in data:
                    return data
            except Exception as e:
                logger.warning(f"Skill Intelligence generation failed: {e}")

        # Fallback
        return self._fallback_response(all_skills, current_skills)

    def _fallback_response(self, all_skills: list, current_skills: list) -> Dict[str, Any]:
        skills_data = []
        for s in all_skills:
            is_gap = s not in current_skills
            skills_data.append({
                "name": s,
                "is_gap": is_gap,
                "current_level": 0 if is_gap else 60,
                "target_level": 85,
                "market_demand": 75,
                "salary_impact": 60,
                "time_required_hours": 40 if is_gap else 10,
                "category": "Core",
                "related_skills": ["Related 1", "Related 2"]
            })
        
        return {
            "overall_market_readiness": 50,
            "top_priority_skill": all_skills[0] if all_skills else "N/A",
            "total_learning_hours": sum(s["time_required_hours"] for s in skills_data),
            "skills": skills_data
        }

    def _empty_response(self) -> Dict[str, Any]:
        return {
            "overall_market_readiness": 0,
            "top_priority_skill": "None",
            "total_learning_hours": 0,
            "skills": []
        }
