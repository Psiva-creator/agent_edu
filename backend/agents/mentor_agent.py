# [ignoring loop detection]
"""
Mentor Agent
============
Provides mentoring guidance, goals, and strategies based on candidate profiles,
skill gap analysis, roadmap progress, and job recommendations.
"""

import logging
import hashlib
import random
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
            skills = resume_analysis.get("extracted_skills") or resume_analysis.get("skills") or []
            if not isinstance(skills, list):
                skills = []
            try:
                experience_years = int(resume_analysis.get("experience_years") or 0)
            except (ValueError, TypeError):
                experience_years = 0
            current_role = resume_analysis.get("current_role") or "Candidate"
            name = resume_analysis.get("name") or "Candidate"

        # Resolve Skill Gap Analysis
        if not skill_gap_analysis:
            skill_gap_analysis = await sg_agent.analyze_gaps(skills, target_role)

        missing_skills = skill_gap_analysis.get("missing_skills") or []
        if not isinstance(missing_skills, list):
            missing_skills = []

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
                error_msg = str(e).lower()
                reason = "unknown_error"
                if "quota" in error_msg or "429" in error_msg:
                    reason = "quota_exhausted"
                elif "auth" in error_msg or "401" in error_msg or "403" in error_msg:
                    reason = "auth_error"
                elif "timeout" in error_msg:
                    reason = "timeout"
                    
                logger.warning(
                    f"[Fallback] MentorAgent using fallback due to LLM error. Reason: {reason}. Details: {e}",
                    extra={"agent": "MentorAgent", "source": "fallback", "reason": reason}
                )

        # Fallback guidance
        logger.warning(
            "[Fallback] MentorAgent using fallback because LLM is unavailable.",
            extra={"agent": "MentorAgent", "source": "fallback", "reason": "llm_unavailable"}
        )
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
                "source": "ai"
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
        first_gap = missing_skills[0] if missing_skills else "advanced academic concepts"
        second_gap = missing_skills[1] if len(missing_skills) > 1 else "research methodologies"

        # Personalized Advice
        if experience_years == 0:
            advice = (
                f"Hi {name}! As you focus on your education toward becoming a {target_role}, "
                f"your academic priority is building a strong foundation in {first_gap}. Focus on "
                f"understanding the theoretical concepts deeply and applying them to course projects to stand out."
            )
        else:
            advice = (
                f"Hi {name}! Elevating your education in {target_role} is a highly strategic path. "
                f"With {experience_years} years of background, you possess valuable domain insights. "
                f"Your immediate academic target should be mastering {first_gap} and {second_gap}."
            )

        # Goals
        weekly_goals = [
            f"Set up a dedicated, distraction-free study environment for {first_gap}.",
            f"Spend 2 hours reviewing course materials and academic literature on {first_gap}.",
            "Form a study group or connect with a classmate to discuss recent lectures.",
            f"Read an academic journal or professional article about {target_role} trends."
        ]

        monthly_goals = [
            f"Complete a comprehensive academic project or research paper featuring {first_gap}.",
            f"Integrate {second_gap} into your coursework to demonstrate advanced understanding.",
            f"Visit your professor or academic advisor during office hours to discuss your career path.",
            "Complete 3 mock exams or practice problem sets."
        ]

        # Interview Tips
        interview_tips = [
            f"Prepare to discuss your academic coursework featuring {first_gap} using the STAR format.",
            "Emphasize your educational background and how your university projects benefit the team.",
            "Highlight your ability to learn quickly and adapt to new academic challenges.",
            f"Understand the main theoretical principles associated with {first_gap}."
        ]

        # Mistakes to avoid
        common_mistakes = [
            "Cramming: trying to memorize everything the night before an exam instead of spaced repetition.",
            "Neglecting fundamentals and skipping foundational lectures without full comprehension.",
            "Failing to ask questions in class or during office hours when confused.",
            "Ignoring your mental health and burning out from excessive academic stress."
        ]

        # Learning strategy
        learning_strategy = (
            "We recommend adopting the Feynman Technique for your studies. "
            "Explain complex concepts in simple terms as if teaching them to someone else. "
            "This exposes any gaps in your understanding and solidifies long-term academic retention."
        )

        motivation = "Education is a marathon, not a sprint. Keep showing up every single day and you will achieve your academic goals!"

        return {
            "personalized_advice": advice,
            "weekly_goals": weekly_goals,
            "monthly_goals": monthly_goals,
            "interview_tips": interview_tips,
            "motivation": motivation,
            "common_mistakes": common_mistakes,
            "learning_strategy": learning_strategy,
            "source": "fallback"
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
        if career_context and isinstance(career_context, dict):
            context_str = (
                f"Candidate Name: {career_context.get('name') or 'User'}\n"
                f"Current Role: {career_context.get('current_role') or 'Student'}\n"
                f"Target Role: {career_context.get('target_role') or 'Software Engineer'}\n"
                f"Skills: {', '.join(career_context.get('skills') or [])}\n"
                f"Experience: {career_context.get('experience_years') or 0} years\n"
                f"Location: {career_context.get('location') or 'India'}\n"
            )

        if self.llm.is_available:
            try:
                system_message = (
                    "You are a friendly, encouraging, and experienced AI Career Mentor. "
                    "Provide specific, actionable, and practical guidance based on the candidate's background. "
                    "CRITICAL: Keep your response CONCISE (max 1-2 short paragraphs) to ensure fast delivery. "
                    "Use bullet points for readability, but DO NOT generate long diagrams or tables unless specifically requested."
                )
                prompt = (
                    f"Candidate Background Context:\n{context_str}\n\n"
                    f"Question: {question}\n\n"
                    f"Respond in a supportive tone, providing concrete next steps."
                )
                answer = await self.llm.generate(prompt, system_message=system_message)
                if answer and not answer.is_empty:
                    return {"answer": answer.content, "source": "ai"}
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
                    f"[Fallback] MentorAgent (answer) using fallback due to LLM error. Reason: {reason}. Details: {e}",
                    extra={"agent": "MentorAgent", "source": "fallback", "reason": reason, "operation": "answer"}
                )

        # Fallback question answering
        logger.warning(
            "[Fallback] MentorAgent (answer) using fallback because LLM is unavailable.",
            extra={"agent": "MentorAgent", "source": "fallback", "reason": "llm_unavailable", "operation": "answer"}
        )
        target_role = "your academic goals"
        if career_context and isinstance(career_context, dict):
            target_role = career_context.get('target_role') or 'your academic goals'
            
        q_lower = question.lower().strip()
        
        # Handle greetings
        if q_lower in ["hi", "hello", "hey", "help"]:
            answer = f"Hello! I am your AI Education Mentor. I am here to help you navigate your academic journey toward {target_role}. What specific topics or challenges can I help you with today?"
            return {"answer": answer, "source": "fallback"}
            
        # Keyword: Study / Exams
        if "exam" in q_lower or "test" in q_lower or "study" in q_lower or "learn" in q_lower:
            answer = (
                f"To tackle your question about studying, I highly recommend moving away from passive reading. "
                f"For {target_role}, you need deep comprehension. Use 'Active Recall'—test yourself constantly without looking at the material. "
                f"Combine this with the Pomodoro technique (25 minutes of intense focus, 5 minutes of rest) to maximize retention before your exams."
            )
            return {"answer": answer, "source": "fallback"}
            
        # Keyword: Internships / Jobs / Career
        if "intern" in q_lower or "job" in q_lower or "career" in q_lower or "resume" in q_lower:
            answer = (
                f"Regarding your career search: The most effective way to land an internship in {target_role} is through "
                f"proof of work. Recruiters want to see what you've built, not just what you've studied. "
                f"I suggest polishing 2-3 university projects, putting them on GitHub or a personal portfolio, and proactively reaching out to university alumni on LinkedIn for referrals."
            )
            return {"answer": answer, "source": "fallback"}
            
        # Keyword: Stress / Burnout / Time management
        if "stress" in q_lower or "burnout" in q_lower or "health" in q_lower or "balance" in q_lower or "time" in q_lower:
            answer = (
                f"Balancing academics and life is tough. If you're feeling overwhelmed, taking a step back is actually the most productive thing you can do. "
                f"Ensure you are getting at least 7-8 hours of sleep, as sleep is when your brain consolidates what you've learned. "
                f"Protect your time by time-blocking your calendar specifically for deep work versus relaxation."
            )
            return {"answer": answer, "source": "fallback"}
            
        # Keyword: Project / Code
        if "project" in q_lower or "code" in q_lower or "build" in q_lower or "error" in q_lower:
            answer = (
                f"When working on technical projects for {target_role}, getting stuck is part of the process. "
                f"Try to break the problem down into the smallest possible components. If you are facing an error, carefully read the stack trace from top to bottom. "
                f"Building hands-on projects is exactly how you bridge the gap between academic theory and industry expectations."
            )
            return {"answer": answer, "source": "fallback"}

        # Smart Catch-all for everything else (Echoes their exact question)
        # We strip question marks and capitalize properly for the echo
        clean_q = question.strip(' ?.!').capitalize()
        answer = (
            f"That is an excellent point regarding '{clean_q}'.\n\n"
            f"When approaching this in the context of {target_role}, the key is to tie it back to core fundamentals. "
            f"I recommend exploring academic journals, official documentation, or speaking directly with your professors about this specific topic to gain a deeper, more technical understanding. "
            f"How else can I assist you with this?"
        )
            
        return {"answer": answer, "source": "fallback"}

if __name__ == "__main__":
    import asyncio
    
    async def main():
        print("Initializing MentorAgent...")
        agent = MentorAgent()
        
        # Test profile
        profile = {
            "name": "Alice",
            "current_role": "Junior Developer",
            "target_role": "Backend Engineer",
            "skills": ["Python", "FastAPI"],
            "experience_years": 1
        }
        
        print("\nGenerating guidance (this may take a moment)...")
        guidance = await agent.get_guidance(profile=profile)
        
        print("\n" + "="*40)
        print("CAREER GUIDANCE RESULT")
        print("="*40)
        
        if "personalized_advice" in guidance:
            print(f"\nAdvice:\n{guidance['personalized_advice']}")
            
            print("\nWeekly Goals:")
            for g in guidance.get("weekly_goals", []):
                print(f"- {g}")
                
            print("\nMonthly Goals:")
            for g in guidance.get("monthly_goals", []):
                print(f"- {g}")
        else:
            print(guidance)

    asyncio.run(main())
