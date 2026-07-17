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
            skills = career_context.get('skills')
            if not isinstance(skills, list):
                skills = []
            context_str = (
                f"Candidate Name: {career_context.get('name') or 'User'}\n"
                f"Current Role: {career_context.get('current_role') or 'Student'}\n"
                f"Target Role: {career_context.get('target_role') or 'Software Engineer'}\n"
                f"Skills: {', '.join(skills)}\n"
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
            
        # Use unseeded random so it generates completely different responses every time
        rng = random.Random()
        
        intros = [
            f"That's a fantastic question regarding your journey toward {target_role}.",
            "I'm glad you asked that! Navigating your education effectively is crucial.",
            "Great question. Balancing academic theory and practical application is key here.",
            f"This is a very common challenge for students aiming for {target_role}."
        ]
        
        body_points_academic = [
            "First, prioritize mastering the core theoretical concepts. Without a solid foundation, advanced topics will become overwhelming.",
            "Consider forming a study group. Explaining complex concepts to peers using the Feynman Technique is one of the best ways to solidify your understanding.",
            "Don't hesitate to utilize your professor's office hours. Asking targeted questions shows initiative and helps clear up confusion early.",
            "Make sure to read academic journals and supplementary materials, not just the textbook. Broadening your sources improves critical thinking."
        ]
        
        body_points_practical = [
            "Beyond coursework, try to apply what you've learned to a practical university project or research paper.",
            "Look into internships or teaching assistant positions. Practical experience on campus is highly valued by future employers.",
            "Build a portfolio of your academic projects. Documenting your methodology and results is just as important as the code or research itself.",
            "Participate in hackathons or academic conferences to network and apply your knowledge under pressure."
        ]
        
        body_points_wellness = [
            "Remember that consistency beats intensity. A structured 1-2 hours of daily study is far more effective than cramming the night before.",
            "Maintain a healthy work-life balance. Adequate sleep and exercise are scientifically proven to enhance memory retention and cognitive function.",
            "Watch out for academic burnout. Take scheduled breaks using the Pomodoro technique to keep your mind fresh.",
            "Don't be too hard on yourself if you hit a roadblock. Education is a marathon, and resilience is the most important skill you can learn."
        ]
        
        conclusions = [
            "Keep pushing forward, you've got this!",
            "Stay curious and keep exploring your academic interests.",
            "I believe in your potential. Let me know if you need any more advice!",
            f"Stick to this strategy and you'll excel in {target_role}."
        ]
        
        # Pick one from each category deterministically based on the question
        intro = rng.choice(intros)
        pt1 = rng.choice(body_points_academic)
        pt2 = rng.choice(body_points_practical)
        pt3 = rng.choice(body_points_wellness)
        conclusion = rng.choice(conclusions)
        
        # Override with highly specific advice if certain keywords are present
        diagram = ""
        q_lower = question.lower()
        if "exam" in q_lower or "test" in q_lower or "study" in q_lower:
            pt1 = "For exams, active recall and spaced repetition are your absolute best tools. Stop passively re-reading your notes and start testing yourself with flashcards or practice tests."
            pt3 = "Make sure you get 8 full hours of sleep before the test. Cramming will only harm your working memory and increase test anxiety."
            diagram = "\n\n```mermaid\ngraph TD\n    A[Review Material] --> B{Understand?}\n    B -- Yes --> C[Create Flashcards]\n    B -- No --> D[Use Feynman Technique]\n    D --> A\n    C --> E[Spaced Repetition]\n    E --> F[Acing the Exam!]\n```\n"
            
        elif "intern" in q_lower or "job" in q_lower or "career" in q_lower:
            pt2 = "Start applying for internships early in the semester. Make sure your academic projects are highlighted clearly on your resume, emphasizing the problem-solving aspects."
            diagram = "\n\n```mermaid\ngraph LR\n    A[Build Projects] --> B[Update Resume]\n    B --> C[Network/Referrals]\n    C --> D[Apply Online]\n    D --> E[Mock Interviews]\n    E --> F((Offer!))\n```\n"
            
        elif "stress" in q_lower or "burnout" in q_lower or "health" in q_lower or "balance" in q_lower:
            pt3 = "If you're feeling overwhelmed, step away from your books. Taking a 24-hour break will reset your cortisol levels and make you much more productive when you return."
            diagram = "\n\n```mermaid\npie title Study-Life Balance\n    \"Focused Study\" : 40\n    \"Sleep\" : 33\n    \"Exercise/Breaks\" : 15\n    \"Social/Free Time\" : 12\n```\n"
        else:
            diagram = "\n\n```mermaid\ngraph TD\n    A[Foundational Knowledge] --> B[Practical Academic Projects]\n    B --> C[Network with Professors]\n    C --> D{Mastery of Subject}\n```\n"

        # Construct a well-formatted multi-paragraph response
        selected_answer = f"{intro}\n\n{pt1} {pt2}\n\n{pt3}\n{diagram}\n{conclusion}"
            
        return {"answer": selected_answer, "source": "fallback"}

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
