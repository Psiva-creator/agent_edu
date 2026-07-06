# [ignoring loop detection]
"""
Mentor Agent
============
Provides mentoring guidance, goals, and strategies based on candidate profiles,
skill gap analysis, roadmap progress, and job recommendations.
"""

import logging
from typing import Optional, Union, List, Dict, Any

from services.llm_service import LLMService

logger = logging.getLogger(__name__)


class MentorAgent:
    """Agent responsible for personalized career mentoring guidance."""

    def __init__(
        self,
        llm_service: Optional[LLMService] = None,
        resume_agent: Optional[Any] = None,
        skill_gap_agent: Optional[Any] = None,
        roadmap_agent: Optional[Any] = None,
        job_agent: Optional[Any] = None,
    ):
        """
        Initialize the MentorAgent.
        """
        self.llm = llm_service or LLMService()
        self._resume_agent = resume_agent
        self._skill_gap_agent = skill_gap_agent
        self._roadmap_agent = roadmap_agent
        self._job_agent = job_agent

    async def get_guidance(
        self,
        profile: Union[Dict[str, Any], str],
        target_role: Optional[str] = None,
        resume_analysis: Optional[Dict[str, Any]] = None,
        skill_gap_analysis: Optional[Dict[str, Any]] = None,
        roadmap: Optional[Dict[str, Any]] = None,
        jobs: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Provide career advice, weekly/monthly goals, interview tips, motivation, and strategies.
        """
        # Resolve sub-agents dynamically to avoid circular imports
        from agents.resume_agent import ResumeAgent
        from agents.skill_gap_agent import SkillGapAgent
        from agents.roadmap_agent import RoadmapAgent
        from agents.job_agent import JobAgent

        res_agent = self._resume_agent or ResumeAgent(llm_service=self.llm)
        sg_agent = self._skill_gap_agent or SkillGapAgent(llm_service=self.llm)
        rm_agent = self._roadmap_agent or RoadmapAgent(llm_service=self.llm)
        j_agent = self._job_agent or JobAgent(llm_service=self.llm)

        # Normalize target role
        if not target_role:
            if isinstance(profile, dict):
                target_role = profile.get("target_role", "Software Engineer")
            else:
                target_role = "Software Engineer"

        # Resolve Resume Analysis
        if not resume_analysis:
            if isinstance(profile, str):
                resume_analysis = await res_agent.analyze_resume(profile, target_role)
            elif isinstance(profile, dict):
                # Mock or build from dict
                resume_analysis = profile
            else:
                resume_analysis = {}

        # Resolve Skills & Experience
        skills = []
        experience_years = 0
        current_role = "Candidate"
        name = "Candidate"

        if isinstance(resume_analysis, dict):
            skills = resume_analysis.get("extracted_skills", resume_analysis.get("skills", []))
            experience_years = int(resume_analysis.get("experience_years", 0))
            current_role = resume_analysis.get("current_role", "Candidate")
            name = resume_analysis.get("name", "Candidate")

        # Resolve Skill Gap Analysis
        if not skill_gap_analysis:
            skill_gap_analysis = await sg_agent.analyze_gaps(skills, target_role)

        missing_skills = skill_gap_analysis.get("missing_skills", [])

        # Resolve Roadmap
        if not roadmap:
            roadmap = await rm_agent.generate_roadmap(
                skill_gaps=missing_skills,
                hours_per_week=15,
                deadline_weeks=8,
                current_role=current_role,
                target_role=target_role,
            )

        # Resolve Job Recommendations
        if not jobs:
            jobs = await j_agent.find_jobs(
                profile=resume_analysis,
                preferences={"remote": True}
            )

        # Try LLM generation if available
        if self.llm.is_available:
            try:
                result = await self._get_guidance_llm(
                    name, current_role, target_role, experience_years,
                    skills, missing_skills, roadmap, jobs
                )
                if result and "personalized_advice" in result:
                    return result
            except Exception as e:
                logger.warning(f"LLM mentorship guidance failed: {e}. Using fallback.")

        # Fallback guidance
        return self._get_guidance_fallback(
            name, current_role, target_role, experience_years,
            skills, missing_skills, roadmap, jobs
        )

    async def _get_guidance_llm(
        self,
        name: str,
        current_role: str,
        target_role: str,
        experience_years: int,
        skills: List[str],
        missing_skills: List[str],
        roadmap: Dict[str, Any],
        jobs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate mentoring advice via OpenAI."""
        skills_str = ", ".join(skills) if skills else "None"
        gaps_str = ", ".join(missing_skills) if missing_skills else "None"
        job_titles = [m.get("title", "") for m in jobs.get("matches", [])]
        jobs_str = ", ".join(job_titles) if job_titles else "None"

        # Construct roadmap weekly summary
        weekly_summary = []
        for week in roadmap.get("weeks", [])[:4]:
            num = week.get("week_number", "?")
            theme = week.get("theme", "Learning")
            weekly_summary.append(f"Week {num}: {theme}")
        roadmap_str = "; ".join(weekly_summary) if weekly_summary else "No weekly milestones defined"

        prompt = f"""\
You are an experienced career mentor. Based on the candidate profile and current status, generate structured career guidance.

Candidate details:
- Name: {name}
- Current Role: {current_role}
- Target Role: {target_role}
- Experience: {experience_years} years
- Current Skills: {skills_str}
- Missing Skills (Gaps): {gaps_str}
- Learning Roadmap Summary: {roadmap_str}
- Recommended Job Opportunities: {jobs_str}

Please generate advice in the following exact JSON format:
{{
  "personalized_advice": "<actionable career coaching paragraph tailored to their background>",
  "weekly_goals": [
    "<weekly goal 1>",
    "<weekly goal 2>",
    "<weekly goal 3>"
  ],
  "monthly_goals": [
    "<monthly goal 1>",
    "<monthly goal 2>",
    "<monthly goal 3>"
  ],
  "interview_tips": [
    "<role-specific interview tip 1>",
    "<role-specific interview tip 2>",
    "<role-specific interview tip 3>"
  ],
  "motivation": "<motivational quote or career advice word of encouragement>",
  "common_mistakes": [
    "<pitfall/mistake to avoid 1>",
    "<pitfall/mistake to avoid 2>",
    "<pitfall/mistake to avoid 3>"
  ],
  "learning_strategy": "<learning methodology paragraph, e.g., active recall, project-based learning>"
}}

Return ONLY the raw JSON object. Do not include markdown wraps.
"""
        system_message = (
            "You are a professional career mentoring agent. "
            "Return ONLY a valid JSON object matching the requested schema."
        )

        data = await self.llm.generate_json(prompt, system_message=system_message)
        if isinstance(data, dict) and "personalized_advice" in data:
            return {
                "personalized_advice": str(data.get("personalized_advice", "")),
                "weekly_goals": [str(g) for g in data.get("weekly_goals", [])],
                "monthly_goals": [str(g) for g in data.get("monthly_goals", [])],
                "interview_tips": [str(t) for t in data.get("interview_tips", [])],
                "motivation": str(data.get("motivation", "")),
                "common_mistakes": [str(m) for m in data.get("common_mistakes", [])],
                "learning_strategy": str(data.get("learning_strategy", "")),
            }
        return {}

    def _get_guidance_fallback(
        self,
        name: str,
        current_role: str,
        target_role: str,
        experience_years: int,
        skills: List[str],
        missing_skills: List[str],
        roadmap: Dict[str, Any],
        jobs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Provide fallback career mentorship guidance without OpenAI."""
        first_gap = missing_skills[0] if missing_skills else "advanced concepts"
        second_gap = missing_skills[1] if len(missing_skills) > 1 else "related tools"

        # Personalized Advice
        if experience_years == 0:
            advice = (
                f"Hi {name}! As you start your journey toward becoming a {target_role}, "
                f"your priority is building a foundation in {first_gap}. Focus on "
                f"practical project creation to validate your skills to recruiters. "
                f"Building a strong personal GitHub repository will showcase your skills."
            )
        else:
            advice = (
                f"Hi {name}! Transitioning from {current_role} to {target_role} is a highly strategic path. "
                f"With {experience_years} years of background, you possess valuable domain insights. "
                f"Your immediate learning target should be acquiring knowledge in {first_gap} and {second_gap}."
            )

        # Goals
        weekly_goals = [
            f"Set up a dedicated learning environment for {first_gap}.",
            f"Spend 2 hours reviewing basic documentation and tutorials on {first_gap}.",
            "Create a new workspace directory for practice projects.",
            f"Read a professional article about {target_role} development patterns."
        ]

        monthly_goals = [
            f"Build and host a clean portfolio project featuring {first_gap}.",
            f"Integrate {second_gap} into your projects to demonstrate full application skills.",
            f"Optimize your resume and online profile to match {target_role} job requirements.",
            "Complete 3 system design or problem-solving mock assessments."
        ]

        # Interview Tips
        interview_tips = [
            f"Prepare to describe projects featuring {first_gap} using the STAR format.",
            "Emphasize your background and how your past experiences benefit the team.",
            "Practice coding on a whiteboard or shared editor, narrating your thought process.",
            f"Understand the main performance trade-offs associated with {first_gap} technologies."
        ]

        # Mistakes to avoid
        common_mistakes = [
            "Tutorial Hell: spending hours watching videos without writing original code.",
            "Neglecting fundamentals and copy-pasting code blocks without full comprehension.",
            "Failing to document your work or showcase projects on public platforms.",
            "Applying to roles without customizing your summary to fit the specific role."
        ]

        # Learning strategy
        learning_strategy = (
            "We recommend adopting a 20/80 active learning strategy. Allocate 20% of your study "
            "time to theoretical tutorials, and spend the remaining 80% actively writing code, "
            "debugging, and creating functional applications. This builds strong engineering muscle memory."
        )

        motivation = "Consistency beats intensity. Keep showing up every single day and you will get there!"

        return {
            "personalized_advice": advice,
            "weekly_goals": weekly_goals,
            "monthly_goals": monthly_goals,
            "interview_tips": interview_tips,
            "motivation": motivation,
            "common_mistakes": common_mistakes,
            "learning_strategy": learning_strategy,
        }

    async def answer_question(
        self,
        question: str,
        career_context: Optional[dict] = None,
    ) -> dict:
        """
        Answer a candidate's career question based on their context.
        """
        if not question or not question.strip():
            return {"answer": "Please ask a valid career question."}

        context_str = ""
        if career_context:
            context_str = (
                f"Candidate Name: {career_context.get('name', 'User')}\n"
                f"Current Role: {career_context.get('current_role', 'Student')}\n"
                f"Target Role: {career_context.get('target_role', 'Software Engineer')}\n"
                f"Skills: {', '.join(career_context.get('skills', []))}\n"
                f"Experience: {career_context.get('experience_years', 0)} years\n"
                f"Location: {career_context.get('location', 'India')}\n"
            )

        if self.llm.is_available:
            try:
                system_message = (
                    "You are a friendly, encouraging, and experienced AI Career Mentor. "
                    "Provide specific, actionable, and practical guidance based on the candidate's background. "
                    "CRITICAL: You MUST use rich Markdown formatting in your response. "
                    "Use Markdown tables for comparing options or structured data. "
                    "Use Mermaid.js code blocks (```mermaid) to draw flowcharts, timelines, or diagrams when explaining processes, architectures, or career steps."
                )
                prompt = (
                    f"Candidate Background Context:\n{context_str}\n\n"
                    f"Question: {question}\n\n"
                    f"Respond in a supportive tone, providing concrete next steps."
                )
                answer = await self.llm.generate(prompt, system_message=system_message)
                if answer and not answer.is_empty:
                    return {"answer": answer.content}
            except Exception as e:
                logger.warning(f"LLM question answering failed: {e}")

        # Fallback question answering
        target_role = career_context.get('target_role', 'Software Engineer') if career_context else 'your target role'
        fallback_answers = [
            f"Focus on building 2-3 real-world portfolio projects targeting {target_role}. "
            f"Hands-on coding, hosting applications, and writing clear documentation will showcase your expertise to hiring managers.",
            "Consistency beats intensity! Dedicate a structured 1-2 hours daily to coding, "
            "focus on understanding the basic software design patterns, and avoid tutorial hell.",
            "Reach out to engineering leads or developers in similar roles on LinkedIn. "
            "Ask for 15-minute informational interviews to understand how they work day-to-day."
        ]
        # Choose a response
        selected_answer = fallback_answers[0]
        if "project" in question.lower() or "portfolio" in question.lower():
            selected_answer = fallback_answers[0]
        elif "study" in question.lower() or "learn" in question.lower() or "consist" in question.lower():
            selected_answer = fallback_answers[1]
        elif "network" in question.lower() or "job" in question.lower() or "referral" in question.lower():
            selected_answer = fallback_answers[2]
            
        return {"answer": selected_answer}

