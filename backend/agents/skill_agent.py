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
                    data["source"] = "ai"
                    return data
            except Exception as e:
                error_msg = str(e).lower()
                reason = "unknown_error"
                if "quota" in error_msg or "429" in error_msg:
                    reason = "quota_exhausted"
                elif "auth" in error_msg or "401" in error_msg or "403" in error_msg:
                    reason = "auth_error"
                elif "timeout" in error_msg:
                    reason = "timeout"
                
                logger.warning(
                    f"[Fallback] SkillAgent using fallback due to LLM error. Reason: {reason}. Details: {e}",
                    extra={"agent": "SkillAgent", "source": "fallback", "reason": reason}
                )
                return self._fallback_response(all_skills, current_skills, target_role, experience)

        logger.warning(
            "[Fallback] SkillAgent using fallback because LLM is unavailable.",
            extra={"agent": "SkillAgent", "source": "fallback", "reason": "llm_unavailable"}
        )
        return self._fallback_response(all_skills, current_skills, target_role, experience)

    def _fallback_response(self, all_skills: list, current_skills: list, target_role: str, experience: int) -> Dict[str, Any]:
        skills_data = []
        target_role_lower = target_role.lower()
        
        for s in all_skills:
            is_gap = s not in current_skills
            s_lower = s.lower()
            
            # Dynamic heuristic for market_demand based on skill name
            if "cloud" in s_lower or "aws" in s_lower or "azure" in s_lower:
                base_demand = 85
                cat = "Cloud"
            elif "data" in s_lower or "sql" in s_lower or "machine learning" in s_lower or "ai" in s_lower:
                base_demand = 90
                cat = "Data/AI"
            elif "react" in s_lower or "node" in s_lower or "frontend" in s_lower or "backend" in s_lower:
                base_demand = 80
                cat = "Web Development"
            else:
                base_demand = 70
                cat = "Core"
                
            # Bump demand if it aligns with the target role vaguely
            if any(word in target_role_lower for word in s_lower.split() if len(word) > 2):
                base_demand = min(98, base_demand + 10)
                
            # Target level scales with experience up to a point
            target_level = min(95, 60 + (experience * 5))
            
            # Current level dynamic
            if is_gap:
                current_level = 0
                time_required = 40 + len(s) * 2  # arbitrary variance so it's not identical across skills
            else:
                current_level = min(90, 40 + (experience * 5) + (len(s) % 10))
                time_required = max(5, 20 - (experience * 2))
                
            salary_impact = min(90, base_demand - 10 + (experience * 2))
            
            skills_data.append({
                "name": s,
                "is_gap": is_gap,
                "current_level": current_level,
                "target_level": target_level,
                "market_demand": base_demand,
                "salary_impact": salary_impact,
                "time_required_hours": time_required,
                "category": cat,
                "related_skills": [f"{s} Fundamentals", f"Advanced {s}"]
            })
        
        # Sort by market demand so top priority is somewhat intelligent
        skills_data.sort(key=lambda x: x["market_demand"], reverse=True)
        
        overall = min(95, 40 + (experience * 5))
        
        return {
            "overall_market_readiness": overall,
            "top_priority_skill": skills_data[0]["name"] if skills_data else "N/A",
            "total_learning_hours": sum(s["time_required_hours"] for s in skills_data),
            "skills": skills_data,
            "source": "fallback"
        }

    def _empty_response(self) -> Dict[str, Any]:
        return {
            "overall_market_readiness": 0,
            "top_priority_skill": "None",
            "total_learning_hours": 0,
            "skills": [],
            "source": "fallback"
        }
