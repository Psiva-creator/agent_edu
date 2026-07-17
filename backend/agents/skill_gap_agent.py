"""
Skill Gap Analysis Agent
========================
Identifies gaps between a user's current skills and the skills
required for their target role or career path.

Features:
    - Skill comparison and strength detection
    - Missing skill identification and ranking (high/medium/low priority)
    - Recommends curated learning resources from ResourceService
    - Difficulty and study hour estimations
    - Confidence score generation
    - Supports OpenAI LLM-based analysis
    - Graceful deterministic fallback analysis (no API key required)
    - Reuses ResumeAgent outputs and extraction logic
"""

import logging
from typing import Optional, Union, List, Dict, Any
from pydantic import BaseModel, Field

from services.llm_service import LLMService
from services.resource_service import ResourceService
from prompts.templates import SKILL_GAP_PROMPT

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# Response Models for Validation and Documentation
# ═══════════════════════════════════════════════════════════════

class SkillGapDetail(BaseModel):
    """Detailed analysis of a single missing skill."""
    skill: str = Field(..., description="Name of the missing skill")
    priority: str = Field("medium", description="Priority level: high, medium, low")
    difficulty: str = Field("intermediate", description="Learning difficulty: beginner, intermediate, advanced")
    estimated_hours: int = Field(40, description="Estimated study hours required")
    explanation: str = Field("", description="Why this skill is needed for the target role")
    recommendations: Dict[str, Any] = Field(default_factory=dict, description="Curated learning resources")


class SkillGapResponse(BaseModel):
    """Structured response for skill gap analysis."""
    target_role: str = Field(..., description="Target career role")
    current_skills: List[str] = Field(default_factory=list, description="User's current skills")
    strengths: List[str] = Field(default_factory=list, description="Current skills matching target requirements")
    missing_skills: List[str] = Field(default_factory=list, description="Missing skills ranked by priority")
    gaps: List[SkillGapDetail] = Field(default_factory=list, description="Detailed analysis of skill gaps")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence score of the analysis")


# ═══════════════════════════════════════════════════════════════
# Priority Keywords for Fallback Ranking
# ═══════════════════════════════════════════════════════════════

HIGH_PRIORITY_KEYWORDS = {
    "python", "javascript", "java", "c++", "c#", "go", "rust", "scala", "r", "typescript",
    "data structures", "algorithms", "system design", "machine learning", "statistics",
    "deep learning", "sql", "database design", "database", "nlp", "computer vision", "math"
}

MEDIUM_PRIORITY_KEYWORDS = {
    "react", "angular", "vue", "fastapi", "django", "flask", "spring boot", "node.js",
    "express", "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "pytorch",
    "tensorflow", "rest api", "api", "mongodb", "postgresql", "mysql", "redis",
    "scikit-learn", "pandas", "numpy", "git", "github", "ci/cd", "linux", "nginx", "graphql"
}


# ═══════════════════════════════════════════════════════════════
# Skill Gap Agent Class
# ═══════════════════════════════════════════════════════════════

class SkillGapAgent:
    """Agent responsible for skill gap analysis and recommendations."""

    def __init__(
        self,
        llm_service: Optional[LLMService] = None,
        resource_service: Optional[ResourceService] = None,
        resume_agent: Optional[Any] = None,
    ):
        """
        Initialize the SkillGapAgent.

        Args:
            llm_service:      Injected LLM service (or creates its own).
            resource_service:  Injected resource service (or creates its own).
            resume_agent:      Injected Resume agent (or creates its own).
        """
        self.llm = llm_service or LLMService()
        self.resources = resource_service or ResourceService()
        
        # Local import to avoid circular dependency
        from agents.resume_agent import ResumeAgent
        self.resume_agent = resume_agent or ResumeAgent(llm_service=self.llm)

    async def analyze_gaps(
        self,
        current_skills: Union[List[str], str, Dict[str, Any]],
        target_role: str
    ) -> Dict[str, Any]:
        """
        Identify skill gaps between current skills and target role requirements.

        Args:
            current_skills: User's current skills (list of names, raw resume text, 
                            or dict from ResumeAgent outputs).
            target_role:    The role the user is targeting.

        Returns:
            Structured dictionary matching SkillGapResponse schema.
        """
        if not target_role or not target_role.strip():
            target_role = "Software Engineer"
            
        logger.info(f"SkillGapAgent starting analysis for target role: {target_role}")

        # ── 1. Normalize and parse current_skills input ───────
        parsed_skills = await self._parse_current_skills(current_skills, target_role)
        logger.debug(f"Parsed current skills: {parsed_skills}")

        # ── 2. Run LLM-based analysis if available ────────────
        if self.llm.is_available:
            try:
                result = await self._analyze_with_llm(parsed_skills, target_role)
                if result and result.get("missing_skills") is not None:
                    logger.info("Skill gap analysis completed via LLM.")
                    return result
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
                    f"[Fallback] SkillGapAgent using fallback due to LLM error. Reason: {reason}. Details: {e}",
                    extra={"agent": "SkillGapAgent", "source": "fallback", "reason": reason}
                )

        # ── 3. Run deterministic fallback analysis ────────────
        logger.warning(
            "[Fallback] SkillGapAgent using fallback because LLM is unavailable.",
            extra={"agent": "SkillGapAgent", "source": "fallback", "reason": "llm_unavailable"}
        )
        return self._analyze_fallback(parsed_skills, target_role)

    # ═══════════════════════════════════════════════════════════
    # Parsing / Extraction Helpers
    # ═══════════════════════════════════════════════════════════

    async def _parse_current_skills(
        self,
        current_skills: Union[List[str], str, Dict[str, Any]],
        target_role: str
    ) -> List[str]:
        """Normalize different current_skills input types into a list of strings."""
        if not current_skills:
            return []

        # Case A: ResumeAgent dictionary output or generic dict
        if isinstance(current_skills, dict):
            for key in ["extracted_skills", "skills", "current_skills"]:
                if key in current_skills and isinstance(current_skills[key], list):
                    return [str(s).strip() for s in current_skills[key] if s]
            # If no lists found, convert values to strings
            return [str(val).strip() for val in current_skills.values() if val]

        # Case B: Raw resume text or comma-separated string
        if isinstance(current_skills, str):
            stripped = current_skills.strip()
            if len(stripped) > 50:
                # Looks like raw resume text. Leverage ResumeAgent to extract skills
                logger.info("Input string detected as resume text. Running ResumeAgent extractor.")
                resume_data = await self.resume_agent.analyze_resume(stripped, target_role)
                if isinstance(resume_data, dict) and "extracted_skills" in resume_data:
                    return resume_data["extracted_skills"]
                return []
            else:
                # Treat as comma-separated skills
                return [s.strip() for s in stripped.split(",") if s.strip()]

        # Case C: Already a list
        if isinstance(current_skills, list):
            return [str(s).strip() for s in current_skills if s]

        return []

    # ═══════════════════════════════════════════════════════════
    # LLM Analysis
    # ═══════════════════════════════════════════════════════════

    async def _analyze_with_llm(self, current_skills: List[str], target_role: str) -> Dict[str, Any]:
        """Perform skill gap analysis using OpenAI."""
        skills_str = ", ".join(current_skills) if current_skills else "None specified"
        
        # Inject JSON schema instructions into the prompt template
        base_prompt = SKILL_GAP_PROMPT.format(current_skills=skills_str, target_role=target_role)
        prompt = f"""\
{base_prompt}

You MUST return your answer as a valid JSON object matching this schema:
{{
  "strengths": ["<skill that the user already has that matches the target role>"],
  "missing_skills": ["<critical skill the user lacks or needs to improve, ranked by importance>"],
  "gaps": [
    {{
      "skill": "<name of the missing skill>",
      "priority": "high|medium|low",
      "difficulty": "beginner|intermediate|advanced",
      "estimated_hours": <int (hours to learn)>,
      "explanation": "<brief description of why this skill is needed for the target role>"
    }}
  ],
  "confidence_score": <float between 0.0 and 1.0 representing confidence in this analysis>
}}

Ensure all JSON keys and formats match exactly. Keep explanations concise.
"""
        system_message = (
            "You are a career skills analyst. Return ONLY a valid JSON object matching the requested schema. "
            "Do not include any wrapper text, explanation, or markdown blocks except the raw JSON."
        )

        data = await self.llm.generate_json(prompt, system_message=system_message)
        
        if not data or not isinstance(data, dict):
            return {}

        # Validate structure and format
        strengths = [str(s) for s in data.get("strengths", [])]
        missing_skills = [str(s) for s in data.get("missing_skills", [])]
        raw_gaps = data.get("gaps", [])
        confidence = float(data.get("confidence_score", 0.90))

        # Enforce boundary limits for confidence score
        confidence = max(0.0, min(confidence, 1.0))

        # Enrich gaps with learning resources from ResourceService
        gaps = []
        for g in raw_gaps:
            if not isinstance(g, dict) or "skill" not in g:
                continue
            skill_name = str(g["skill"])
            
            # Fetch recommendations from ResourceService
            rec = self._get_resource_recommendation(skill_name)
            
            gaps.append({
                "skill": skill_name,
                "priority": str(g.get("priority", "medium")).lower(),
                "difficulty": str(g.get("difficulty", "intermediate")).lower(),
                "estimated_hours": int(g.get("estimated_hours", 40)),
                "explanation": str(g.get("explanation", "")),
                "recommendations": rec
            })

        return {
            "target_role": target_role,
            "current_skills": current_skills,
            "strengths": strengths,
            "missing_skills": missing_skills,
            "gaps": gaps,
            "confidence_score": confidence,
            "source": "ai"
        }

    # ═══════════════════════════════════════════════════════════
    # Deterministic Fallback Analysis
    # ═══════════════════════════════════════════════════════════

    def _analyze_fallback(self, current_skills: List[str], target_role: str) -> Dict[str, Any]:
        """Perform fallback skill gap analysis using static mapping and ResourceService."""
        # 1. Normalize current skills for case-insensitive and fuzzy matching
        current_normalized = {}
        for skill in current_skills:
            norm = self.resources._normalize(skill)
            current_normalized[norm] = skill

        # 2. Get required skills for target role
        # We reuse the ResumeAgent static required skills map
        required_skills = self.resume_agent._get_required_skills(target_role)
        
        # Check if the target role was recognized (not defaulted)
        # The default required skills list in ResumeAgent is ["python", "git", "sql", "rest api", "docker"]
        role_lower = target_role.lower().strip()
        from agents.resume_agent import ROLE_REQUIRED_SKILLS
        is_known_role = any(role in role_lower or role_lower in role for role in ROLE_REQUIRED_SKILLS.keys())
        confidence_score = 0.85 if is_known_role else 0.60

        strengths = []
        missing_skills = []
        gaps = []

        # 3. Compare current skills with required skills
        for req in required_skills:
            req_norm = self.resources._normalize(req)
            matched_skill = None
            
            # Substring matching to handle variations (e.g., "Python 3" vs "Python")
            for curr_norm, orig_name in current_normalized.items():
                if req_norm == curr_norm or req_norm in curr_norm or curr_norm in req_norm:
                    matched_skill = orig_name
                    break

            if matched_skill:
                strengths.append(matched_skill)
            else:
                # Re-capitalize matching standard name from library or fallback to Title-Case
                display_name = req.title() if len(req) > 3 else req.upper()
                skill_res = self.resources.get_for_skill(req)
                if skill_res and "name" in skill_res:
                    display_name = skill_res["name"]
                missing_skills.append(display_name)

        # 4. Rank missing skills and build gap entries
        ranked_gaps = []
        for skill in missing_skills:
            norm_name = self.resources._normalize(skill)
            
            # Determine priority class
            if norm_name in HIGH_PRIORITY_KEYWORDS:
                priority = "high"
                priority_val = 1
            elif norm_name in MEDIUM_PRIORITY_KEYWORDS:
                priority = "medium"
                priority_val = 2
            else:
                priority = "low"
                priority_val = 3

            # Retrieve difficulty, hours, and resources
            skill_res = self.resources.get_for_skill(skill)
            if skill_res:
                difficulty = skill_res.get("difficulty", "intermediate")
                estimated_hours = skill_res.get("estimated_hours", 40)
            else:
                difficulty = "intermediate"
                estimated_hours = 40

            explanation = f"{skill} is a key capability required to perform successfully as a {target_role}."
            rec = self._get_resource_recommendation(skill)

            ranked_gaps.append({
                "skill": skill,
                "priority": priority,
                "priority_val": priority_val,
                "difficulty": difficulty,
                "estimated_hours": estimated_hours,
                "explanation": explanation,
                "recommendations": rec
            })

        # Sort gaps: high (1) -> medium (2) -> low (3)
        ranked_gaps.sort(key=lambda x: x["priority_val"])
        
        # Build clean final lists
        final_gaps = []
        final_missing_skills = []
        for g in ranked_gaps:
            final_missing_skills.append(g["skill"])
            # Remove helper key
            g.pop("priority_val")
            final_gaps.append(g)

        return {
            "target_role": target_role,
            "current_skills": current_skills,
            "strengths": strengths,
            "missing_skills": final_missing_skills,
            "gaps": final_gaps,
            "confidence_score": confidence_score,
            "source": "fallback"
        }

    # ═══════════════════════════════════════════════════════════
    # Resource Library Recommendation Fetcher
    # ═══════════════════════════════════════════════════════════

    def _get_resource_recommendation(self, skill: str) -> Dict[str, Any]:
        """Fetch learning resources for a skill, fallback if not in database."""
        skill_res = self.resources.get_for_skill(skill)
        
        if skill_res:
            # Map database keys to schema expectations
            return {
                "official_docs": skill_res.get("official_docs", {}),
                "youtube_playlist": skill_res.get("youtube_playlist", {}),
                "free_course": skill_res.get("free_course", {}),
                "practice_website": skill_res.get("practice_website", {}),
                "mini_project": skill_res.get("mini_project", {})
            }
        else:
            # Reuses standard ResourceService._fallback_resource method
            fallback = self.resources._fallback_resource(skill)
            return {
                "official_docs": fallback.get("official_docs", {}),
                "youtube_playlist": fallback.get("youtube_playlist", {}),
                "free_course": fallback.get("free_course", {}),
                "practice_website": fallback.get("practice_website", {}),
                "mini_project": fallback.get("mini_project", {})
            }
