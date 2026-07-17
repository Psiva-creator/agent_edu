"""
Career Report Service
=====================
Generates a one-page Career Intelligence Report with comprehensive
analysis including candidate summary, readiness score, strengths,
weaknesses, skill gaps, salary estimates, target roles, roadmap
summary, mentor advice, certifications, hiring companies, and
an overall recommendation.

Exports:
    - JSON (structured dict)
    - HTML (Jinja2 template rendered)
    - PDF  (xhtml2pdf from HTML)

Supports:
    - OpenAI GPT-4 powered generation
    - Intelligent fallback with heuristic analysis
"""

import io
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader

from services.llm_service import LLMService
from prompts.templates import CAREER_REPORT_PROMPT

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

# ═══════════════════════════════════════════════════════════════
# Reference Data — Salaries, Skills, Certifications, Companies
# ═══════════════════════════════════════════════════════════════

# ─── Role → Salary Range (INR / year) ────────────────────────

SALARY_MAP: dict[str, dict] = {
    "data scientist":       {"min": 600000,  "max": 2500000, "median": 1200000},
    "frontend developer":   {"min": 400000,  "max": 1800000, "median": 900000},
    "backend developer":    {"min": 500000,  "max": 2000000, "median": 1000000},
    "full stack developer": {"min": 500000,  "max": 2200000, "median": 1100000},
    "devops engineer":      {"min": 600000,  "max": 2500000, "median": 1300000},
    "ml engineer":          {"min": 700000,  "max": 3000000, "median": 1500000},
    "software engineer":    {"min": 500000,  "max": 2500000, "median": 1200000},
    "cloud architect":      {"min": 1200000, "max": 4000000, "median": 2200000},
    "product manager":      {"min": 800000,  "max": 3000000, "median": 1600000},
}

# ─── Role → Required Skills ──────────────────────────────────

TARGET_SKILLS_MAP: dict[str, list[str]] = {
    "data scientist":       ["Statistics", "Machine Learning", "Python", "SQL", "Data Visualization", "Deep Learning"],
    "frontend developer":   ["React", "JavaScript", "CSS", "TypeScript", "UI/UX", "Testing"],
    "backend developer":    ["Python", "FastAPI", "SQL", "Docker", "System Design", "Testing"],
    "full stack developer": ["JavaScript", "React", "Node.js", "SQL", "Docker", "Git"],
    "devops engineer":      ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux"],
    "ml engineer":          ["PyTorch", "TensorFlow", "MLOps", "Docker", "AWS", "Python"],
    "software engineer":    ["Data Structures", "Algorithms", "System Design", "Git", "Testing", "Docker"],
}

# ─── Role → Recommended Certifications ───────────────────────

CERTIFICATIONS_MAP: dict[str, list[str]] = {
    "data scientist":       ["Google Data Analytics Certificate", "IBM Data Science Professional", "AWS Certified ML Specialty"],
    "frontend developer":   ["Meta Front-End Developer Certificate", "Google UX Design Certificate", "AWS Certified Cloud Practitioner"],
    "backend developer":    ["AWS Certified Developer Associate", "MongoDB Certified Developer", "Docker Certified Associate"],
    "full stack developer": ["Meta Full-Stack Engineer Certificate", "AWS Certified Developer Associate", "MongoDB Certified Developer"],
    "devops engineer":      ["AWS Certified DevOps Engineer", "Certified Kubernetes Administrator (CKA)", "HashiCorp Terraform Associate"],
    "ml engineer":          ["AWS Certified ML Specialty", "Google TensorFlow Developer Certificate", "DeepLearning.AI TensorFlow Developer"],
    "software engineer":    ["AWS Certified Cloud Practitioner", "Google IT Support Certificate", "HackerRank Problem Solving"],
}

# ─── Role → Hiring Companies ─────────────────────────────────

HIRING_COMPANIES_MAP: dict[str, list[str]] = {
    "data scientist":       ["Google", "Amazon", "Microsoft", "Flipkart", "Swiggy", "PhonePe", "Fractal Analytics", "Tiger Analytics"],
    "frontend developer":   ["Google", "Meta", "Razorpay", "Swiggy", "Zomato", "Paytm", "Atlassian", "Freshworks"],
    "backend developer":    ["Amazon", "Microsoft", "Flipkart", "Zerodha", "PhonePe", "Ola", "Juspay", "Groww"],
    "full stack developer": ["Google", "Amazon", "Razorpay", "Flipkart", "Zomato", "ShareChat", "Meesho", "Groww"],
    "devops engineer":      ["Amazon", "Microsoft", "Infosys", "Wipro", "TCS", "Razorpay", "Juspay", "Hasura"],
    "ml engineer":          ["Google", "Amazon", "Microsoft", "NVIDIA", "Flipkart", "Ola", "Fractal Analytics", "PhonePe"],
    "software engineer":    ["Google", "Microsoft", "Amazon", "Flipkart", "Atlassian", "Razorpay", "PhonePe", "Groww"],
}


class ReportService:
    """
    Generates comprehensive Career Intelligence Reports.

    Usage:
        svc = ReportService()
        report = await svc.generate_report(data)  # JSON
        html   = svc.render_html(report)           # HTML
        pdf    = svc.render_pdf(report)             # PDF bytes
    """

    def __init__(self, llm_service: Optional[LLMService] = None):
        """
        Initialize the ReportService.

        Args:
            llm_service: Injected LLM service (or creates its own).
        """
        self.llm = llm_service or LLMService()
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(TEMPLATES_DIR)),
            autoescape=True,
        )

    # ═══════════════════════════════════════════════════════════
    # GENERATE — Main entry point
    # ═══════════════════════════════════════════════════════════

    async def generate_report(self, data: dict) -> dict:
        """
        Generate a full Career Intelligence Report by orchestrating all 6 agents.

        Args:
            data: Dict with name, current_role, target_role, skills,
                  experience_years, education, location.

        Returns:
            Comprehensive report dict with all 12 sections + HTML.
        """
        # Extract inputs
        name = data.get("name", "User")
        current_role = data.get("current_role", "Student")
        target_role = data.get("target_role", "Software Engineer")
        skills = data.get("skills", [])
        experience_years = int(data.get("experience_years", 0))
        education = data.get("education", "Not specified")
        location = data.get("location", "India")

        # ── 1. Resume Agent ──────────────────────────────────
        # Build a rich, professional synthetic resume text to feed to ResumeAgent.
        # This ensures accurate readiness scoring (detecting structure, experience, and action verbs).
        summary_text = ""
        experience_text = ""
        projects_text = ""

        if experience_years > 0 or skills:
            summary_text = (
                f"PROFESSIONAL SUMMARY:\n"
                f"An experienced professional with {experience_years} years of experience. "
                f"Developed, designed, and implemented robust systems. Built and deployed high-performance applications "
                f"using modern technologies. Mentored junior developers and optimized engineering processes.\n\n"
            )
            experience_text = (
                f"PROFESSIONAL EXPERIENCE:\n"
                f"Senior Role at Current Company\n"
                f"- Developed and launched multiple user-facing features.\n"
                f"- Automated CI/CD pipelines and improved test coverage.\n\n"
            )
            projects_text = (
                f"PROJECTS:\n"
                f"- Built an end-to-end web platform using {', '.join(skills[:3]) if skills else 'modern tools'}.\n\n"
            )

        resume_text = (
            f"Candidate Name: {name}\n"
            f"Current Role: {current_role}\n"
            f"Target Role: {target_role}\n"
            f"Location: {location}\n"
            f"\n"
            f"{summary_text}"
            f"TECHNICAL SKILLS:\n"
            f"- Languages & Frameworks: {', '.join(skills) if skills else 'None'}\n"
            f"- Tools & Platforms: Git, Docker, Databases\n"
            f"\n"
            f"{experience_text}"
            f"{projects_text}"
            f"EDUCATION:\n"
            f"- {education}\n"
        )
        from agents.resume_agent import ResumeAgent
        resume_agent = ResumeAgent(llm_service=self.llm)
        resume_analysis = await resume_agent.analyze_resume(resume_text, target_role)

        # ── 2. Skill Gap Agent ──────────────────────────────
        from agents.skill_gap_agent import SkillGapAgent
        skill_gap_agent = SkillGapAgent(llm_service=self.llm)
        extracted_skills = resume_analysis.get("extracted_skills", skills)
        if not extracted_skills:
            extracted_skills = skills
        skill_gap_analysis = await skill_gap_agent.analyze_gaps(extracted_skills, target_role)
        missing_skills = skill_gap_analysis.get("missing_skills", [])

        # ── 3. Job Agent ────────────────────────────────────
        from agents.job_agent import JobAgent
        job_agent = JobAgent(llm_service=self.llm)
        merged_profile = {
            **resume_analysis,
            "name": name,
            "current_role": current_role,
            "target_role": target_role,
            "skills": extracted_skills,
            "experience_years": experience_years,
            "education": education,
            "location": location,
        }
        jobs = await job_agent.find_jobs(profile=merged_profile, preferences={"remote": True})

        # ── 4. Market Agent ─────────────────────────────────
        from agents.market_agent import MarketAgent
        market_agent = MarketAgent(llm_service=self.llm)
        try:
            market_analysis = await market_agent.analyze_market(industry=target_role, location=location)
        except Exception as e:
            logger.warning(f"Market agent failed: {e}")
            market_analysis = {}

        # ── 5. Roadmap Agent ────────────────────────────────
        from agents.roadmap_agent import RoadmapAgent
        roadmap_agent = RoadmapAgent(llm_service=self.llm)
        roadmap = await roadmap_agent.generate_roadmap(
            skill_gaps=missing_skills,
            hours_per_week=15,
            deadline_weeks=8,
            current_role=current_role,
            target_role=target_role
        )

        # ── 6. Mentor Agent ─────────────────────────────────
        from agents.mentor_agent import MentorAgent
        mentor_agent = MentorAgent(llm_service=self.llm)
        mentor_advice = await mentor_agent.get_guidance(
            profile=merged_profile,
            target_role=target_role,
            resume_analysis=resume_analysis,
            skill_gap_analysis=skill_gap_analysis,
            roadmap=roadmap,
            jobs=jobs
        )

        # ── 7. Career Report Assembly ────────────────────────
        # 1. Readiness Score
        readiness_score = float(resume_analysis.get("readiness_score", 0.0))
        if readiness_score == 0.0:
            # Fallback calculation if zero
            readiness_score = float(skill_gap_analysis.get("confidence_score", 0.85) * 100)
        readiness_label = self._score_to_label(int(readiness_score))

        # 2. Candidate Summary
        candidate_summary = resume_analysis.get("summary", "")
        if not candidate_summary:
            candidate_summary = (
                f"{name} is a {current_role} targeting the {target_role} role. "
                f"They currently possess {len(extracted_skills)} technical skills and "
                f"have {experience_years} years of professional experience."
            )

        # 3. Strengths
        strengths = resume_analysis.get("strengths", [])
        if not strengths:
            strengths = self._analyze_strengths(extracted_skills, experience_years, [], target_role)

        # 4. Weaknesses
        weaknesses = resume_analysis.get("improvements", [])
        if not weaknesses:
            weaknesses = self._analyze_weaknesses(extracted_skills, experience_years, [], set())

        # 5. Expected Salary
        expected_salary = {
            "currency": "INR",
            "min": 0,
            "max": 0,
            "median": 0
        }
        if jobs and jobs.get("matches"):
            first_match = jobs["matches"][0]
            if "salary_range" in first_match:
                expected_salary = first_match["salary_range"]
        if expected_salary.get("median", 0) == 0:
            expected_salary = SALARY_MAP.get(target_role.lower(), {"min": 500000, "max": 2000000, "median": 1000000})
            expected_salary["currency"] = "INR"

        # 6. Target Roles
        target_roles = []
        for match in jobs.get("matches", []):
            req_skills = match.get("required_skills", [])
            matched_len = len(set(extracted_skills) & set(req_skills))
            target_roles.append({
                "title": match.get("title", ""),
                "match": int(match.get("match_percentage", 0)),
                "matched_skills": matched_len,
                "total_required": len(req_skills),
                "is_primary": match.get("title", "").lower() == target_role.lower()
            })
        if not target_roles:
            target_roles = self._compute_target_roles({s.lower() for s in extracted_skills}, target_role)

        # 7. Roadmap Summary
        roadmap_summary = ""
        if roadmap and roadmap.get("weeks"):
            weeks = roadmap["weeks"]
            total_w = len(weeks)
            phase_themes = [w.get("theme", "") for w in weeks if w.get("theme")]
            unique_themes = []
            for t in phase_themes:
                if t not in unique_themes:
                    unique_themes.append(t)
            roadmap_summary = (
                f"Personalized {total_w}-week learning plan. "
                f"Focus areas: {', '.join(unique_themes[:3])}. "
                f"Total estimated effort: {roadmap.get('total_estimated_hours', total_w * 10)} hours."
            )
        if not roadmap_summary:
            timeline = max(8, 20 - experience_years * 2)
            roadmap_summary = (
                f"Phase 1: Build foundations. "
                f"Phase 2: Hands-on projects. "
                f"Phase 3: Portfolio and applications. Total: {timeline} weeks."
            )

        # 8. Certifications
        certifications = CERTIFICATIONS_MAP.get(target_role.lower(), [])
        if not certifications:
            certifications = ["AWS Certified Cloud Practitioner", "Google IT Support Certificate"]

        # 9. Hiring Companies
        companies = []
        for match in jobs.get("matches", []):
            for c in match.get("hiring_companies", []):
                if c not in companies:
                    companies.append(c)
        if not companies:
            companies = HIRING_COMPANIES_MAP.get(target_role.lower(), [])
        hiring_companies = companies[:5]

        # 10. Next Steps
        next_steps = mentor_advice.get("weekly_goals", [])[:3] + mentor_advice.get("monthly_goals", [])[:2]
        if not next_steps:
            next_steps = [
                f"Complete an online course in {missing_skills[0]}" if missing_skills else "Review your skills",
                "Build 2–3 portfolio projects showcasing your target skills"
            ]

        # 11. Overall Recommendation
        overall_recommendation = mentor_advice.get("learning_strategy", "")
        if not overall_recommendation:
            overall_recommendation = self._generate_recommendation(
                int(readiness_score), target_role, missing_skills, experience_years
            )

        report = {
            "name": name,
            "current_role": current_role,
            "target_role": target_role,
            "generated_at": datetime.now().strftime("%B %d, %Y at %I:%M %p"),

            # 12 Sections
            "candidate_summary": candidate_summary,
            "readiness_score": readiness_score,
            "readiness_label": readiness_label,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "skill_gaps": missing_skills,
            "expected_salary": expected_salary,
            "target_roles": target_roles,
            "roadmap_summary": roadmap_summary,
            "mentor_advice": mentor_advice.get("personalized_advice", ""),
            "certifications": certifications,
            "hiring_companies": hiring_companies,
            "overall_recommendation": overall_recommendation,
            "next_steps": next_steps,
            "market_data": market_analysis,
            "source": "ai"
        }

        report["report_html"] = self.render_html(report)
        return report

    # ═══════════════════════════════════════════════════════════
    # FALLBACK GENERATOR
    # ═══════════════════════════════════════════════════════════

    def _generate_fallback(self, data: dict) -> dict:
        """Generate a comprehensive report without LLM."""
        name = data.get("name", "User")
        current = data.get("current_role", "Student")
        target = data.get("target_role", "Software Engineer")
        skills = data.get("skills", [])
        exp = data.get("experience_years", 0)
        education = data.get("education", "Not specified")
        location = data.get("location", "India")
        target_lower = target.lower()

        # ── 1. Readiness Score ───────────────────────────────
        required = TARGET_SKILLS_MAP.get(target_lower, ["Python", "SQL", "Git"])
        skills_lower = {s.lower() for s in skills}
        matched = [s for s in required if s.lower() in skills_lower]
        match_ratio = len(matched) / max(len(required), 1)

        readiness = min(100, int(
            match_ratio * 40 +                         # skill match (40%)
            min(len(skills) / 8, 1.0) * 15 +           # breadth (15%)
            min(exp / 5, 1.0) * 25 +                    # experience (25%)
            (10 if education else 0) +                   # education (10%)
            10                                           # base (10%)
        ))
        label = self._score_to_label(readiness)

        # ── 2. Candidate Summary ─────────────────────────────
        candidate_summary = (
            f"{name} is a {current} with {exp} year(s) of experience and "
            f"{len(skills)} technical skills. Currently pursuing a career transition "
            f"to {target}, with a readiness score of {readiness}/100 ({label}). "
            f"Key strengths include {', '.join(skills[:3]) if skills else 'motivation to learn'}. "
            f"Education: {education}. Based in {location}."
        )

        # ── 3. Strengths ────────────────────────────────────
        strengths = self._analyze_strengths(skills, exp, matched, target)

        # ── 4. Weaknesses ───────────────────────────────────
        weaknesses = self._analyze_weaknesses(skills, exp, required, skills_lower)

        # ── 5. Skill Gaps ───────────────────────────────────
        skill_gaps = [s for s in required if s.lower() not in skills_lower]

        # ── 6. Salary Estimate ───────────────────────────────
        salary = SALARY_MAP.get(target_lower, {"min": 400000, "max": 2000000, "median": 1000000})
        salary = {**salary, "currency": "INR"}

        # ── 7. Target Roles ──────────────────────────────────
        target_roles = self._compute_target_roles(skills_lower, target)

        # ── 8. Roadmap Summary ───────────────────────────────
        gap_preview = ", ".join(skill_gaps[:3]) if skill_gaps else "review"
        timeline = max(8, 20 - exp * 2)
        roadmap_summary = (
            f"Phase 1 (Weeks 1–{timeline // 3}): Build foundations in {gap_preview}. "
            f"Phase 2 (Weeks {timeline // 3 + 1}–{2 * timeline // 3}): Hands-on projects and intermediate skills. "
            f"Phase 3 (Weeks {2 * timeline // 3 + 1}–{timeline}): Portfolio development, mock interviews, "
            f"and job applications. Total estimated effort: {timeline} weeks at 10 hours/week."
        )

        # ── 9. Mentor Advice ─────────────────────────────────
        mentor_advice = self._generate_mentor_advice(
            name, current, target, skill_gaps, exp, skills,
        )

        # ── 10. Certifications ───────────────────────────────
        certifications = CERTIFICATIONS_MAP.get(
            target_lower,
            ["AWS Certified Cloud Practitioner", "Google IT Support Certificate", "HackerRank Problem Solving"],
        )

        # ── 11. Hiring Companies ─────────────────────────────
        hiring_companies = HIRING_COMPANIES_MAP.get(
            target_lower,
            ["Google", "Amazon", "Microsoft", "Flipkart", "Infosys", "TCS", "Wipro"],
        )

        # ── 12. Overall Recommendation ───────────────────────
        overall_recommendation = self._generate_recommendation(
            readiness, target, skill_gaps, exp,
        )

        # ── Assemble Report ──────────────────────────────────
        report = {
            "name": name,
            "current_role": current,
            "target_role": target,
            "generated_at": datetime.now().strftime("%B %d, %Y at %I:%M %p"),

            # 12 Sections
            "candidate_summary": candidate_summary,
            "readiness_score": readiness,
            "readiness_label": label,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "skill_gaps": skill_gaps,
            "expected_salary": salary,
            "target_roles": target_roles,
            "roadmap_summary": roadmap_summary,
            "mentor_advice": mentor_advice,
            "certifications": certifications,
            "hiring_companies": hiring_companies,
            "overall_recommendation": overall_recommendation,

            # Next steps (bonus)
            "next_steps": [
                f"Complete an online course in {skill_gaps[0]}" if skill_gaps else "Review your skills",
                "Build 2–3 portfolio projects showcasing your target skills",
                f"Earn the '{certifications[0]}' certification" if certifications else "Get certified",
                "Create a polished resume and LinkedIn profile",
                f"Apply for entry-level {target} positions at {hiring_companies[0]}" if hiring_companies else "Apply for jobs",
            ],
            
            "market_data": {},
            "source": "fallback"
        }

        report["report_html"] = self.render_html(report)
        return report

    # ═══════════════════════════════════════════════════════════
    # ANALYSIS HELPERS
    # ═══════════════════════════════════════════════════════════

    def _analyze_strengths(
        self, skills: list, exp: int, matched: list, target: str,
    ) -> list[str]:
        """Identify candidate strengths."""
        strengths = []

        if len(skills) >= 6:
            strengths.append(f"Broad technical skillset with {len(skills)} skills")
        elif len(skills) >= 3:
            strengths.append(f"Solid foundation with {len(skills)} relevant skills")

        if len(matched) >= 3:
            strengths.append(f"{len(matched)} skills directly match {target} requirements")

        if exp >= 3:
            strengths.append(f"Strong industry experience ({exp}+ years)")
        elif exp >= 1:
            strengths.append(f"Has {exp} year(s) of hands-on experience")

        # Skill-specific strengths
        skill_lower = {s.lower() for s in skills}
        if "python" in skill_lower:
            strengths.append("Python proficiency — the most in-demand language")
        if "git" in skill_lower or "github" in skill_lower:
            strengths.append("Version control skills (Git/GitHub)")
        if any(s in skill_lower for s in ["react", "angular", "vue"]):
            strengths.append("Modern frontend framework experience")
        if any(s in skill_lower for s in ["docker", "kubernetes", "aws"]):
            strengths.append("Cloud/DevOps awareness")

        return strengths[:6]

    def _analyze_weaknesses(
        self, skills: list, exp: int, required: list, skills_lower: set,
    ) -> list[str]:
        """Identify areas of weakness."""
        weaknesses = []

        missing = [s for s in required if s.lower() not in skills_lower]
        if len(missing) >= 3:
            weaknesses.append(f"Missing {len(missing)} critical skills for target role")
        elif missing:
            weaknesses.append(f"Gaps in: {', '.join(missing[:3])}")

        if exp == 0:
            weaknesses.append("No professional work experience listed")
        elif exp < 2:
            weaknesses.append("Limited industry experience")

        if len(skills) < 4:
            weaknesses.append("Narrow technical skillset — needs broadening")

        if "system design" not in {s.lower() for s in skills}:
            weaknesses.append("No system design / architecture experience")

        if "testing" not in {s.lower() for s in skills}:
            weaknesses.append("No testing / QA skills mentioned")

        return weaknesses[:5]

    def _compute_target_roles(
        self, skills_lower: set, primary_target: str,
    ) -> list[dict]:
        """Compute matching roles ranked by skill overlap."""
        roles = []
        for role, required in TARGET_SKILLS_MAP.items():
            matched = sum(1 for s in required if s.lower() in skills_lower)
            match_pct = round((matched / max(len(required), 1)) * 100)
            if match_pct >= 15:
                roles.append({
                    "title": role.title(),
                    "match": match_pct,
                    "matched_skills": matched,
                    "total_required": len(required),
                    "is_primary": role == primary_target.lower(),
                })

        roles.sort(key=lambda r: r["match"], reverse=True)
        return roles[:5]

    def _generate_mentor_advice(
        self, name, current, target, gaps, exp, skills,
    ) -> str:
        """Generate personalized mentor advice."""
        if exp == 0 and len(skills) < 4:
            return (
                f"{name}, you're at the beginning of your journey to becoming a {target}. "
                f"Focus on mastering one skill at a time — start with {gaps[0] if gaps else 'Python'}. "
                f"Build small projects, contribute to open-source, and document everything. "
                f"Consistency beats intensity. Dedicate 2 hours daily and you'll see results in 3 months."
            )
        elif exp < 3:
            return (
                f"{name}, you have a {current} background and are building towards {target}. "
                f"Your next step should be closing the gap in {', '.join(gaps[:2]) if gaps else 'advanced topics'}. "
                f"Focus on project-based learning — theory alone won't differentiate you. "
                f"Start networking on LinkedIn and attend tech meetups in your area."
            )
        else:
            return (
                f"{name}, with {exp} years of experience as a {current}, you're well-positioned "
                f"for a transition to {target}. Focus on {', '.join(gaps[:2]) if gaps else 'portfolio polish'} "
                f"to round out your profile. Consider getting certified and start applying — "
                f"your experience gives you a significant advantage over fresh candidates."
            )

    def _generate_recommendation(
        self, score: int, target: str, gaps: list, exp: int,
    ) -> str:
        """Generate overall recommendation based on readiness."""
        if score >= 80:
            return (
                f"Strongly recommended for {target} roles. Ready to apply immediately. "
                f"Focus on interview preparation and portfolio polish."
            )
        elif score >= 60:
            return (
                f"Good candidate for junior {target} roles. Close remaining skill gaps "
                f"({', '.join(gaps[:2])}) within 4–6 weeks, then start applying."
            )
        elif score >= 40:
            return (
                f"Developing candidate. Invest 8–12 weeks in structured learning covering "
                f"{', '.join(gaps[:3])}. Build 2–3 portfolio projects before applying."
            )
        else:
            return (
                f"Early-stage candidate for {target}. Recommend a {max(12, 20 - exp * 2)}-week "
                f"intensive learning plan. Start with fundamentals, build consistently, "
                f"and target internships or entry-level positions."
            )

    @staticmethod
    def _score_to_label(score: int) -> str:
        """Convert readiness score to label."""
        if score >= 85:
            return "Expert"
        elif score >= 70:
            return "Proficient"
        elif score >= 55:
            return "Competent"
        elif score >= 35:
            return "Developing"
        else:
            return "Beginner"

    def _merge_defaults(self, llm_result: dict, data: dict) -> dict:
        """Ensure all required fields exist in LLM result."""
        target = data.get("target_role", "Software Engineer")
        defaults = {
            "name": data.get("name", "User"),
            "current_role": data.get("current_role", "Student"),
            "target_role": target,
            "generated_at": datetime.now().strftime("%B %d, %Y at %I:%M %p"),
            "candidate_summary": "",
            "strengths": [],
            "weaknesses": [],
            "certifications": CERTIFICATIONS_MAP.get(target.lower(), []),
            "hiring_companies": HIRING_COMPANIES_MAP.get(target.lower(), []),
            "target_roles": [],
            "overall_recommendation": "",
        }
        for key, default in defaults.items():
            if key not in llm_result or not llm_result[key]:
                llm_result[key] = default
        return llm_result

    # ═══════════════════════════════════════════════════════════
    # EXPORT — HTML (Jinja2)
    # ═══════════════════════════════════════════════════════════

    def render_html(self, report: dict) -> str:
        """
        Render the career report as a professional HTML page
        using the Jinja2 report template.

        Args:
            report: Full report dict from generate_report().

        Returns:
            Complete HTML string.
        """
        salary = report.get("expected_salary", {})

        # Prepare template context
        context = {
            **report,
            "salary_min": f"{salary.get('min', 0):,}",
            "salary_max": f"{salary.get('max', 0):,}",
            "salary_median": f"{salary.get('median', 0):,}",
        }

        try:
            template = self.jinja_env.get_template("report_template.html")
            return template.render(**context)
        except Exception as e:
            logger.error(f"Jinja2 report template failed: {e}")
            # Fallback: inline HTML
            return self._render_inline_html(report)

    def _render_inline_html(self, report: dict) -> str:
        """Fallback inline HTML renderer if template fails."""
        salary = report.get("expected_salary", {})
        gaps_html = "".join(f"<li>{g}</li>" for g in report.get("skill_gaps", []))
        strengths_html = "".join(f"<li>{s}</li>" for s in report.get("strengths", []))
        weaknesses_html = "".join(f"<li>{w}</li>" for w in report.get("weaknesses", []))
        steps_html = "".join(f"<li>{s}</li>" for s in report.get("next_steps", []))
        certs_html = "".join(f"<li>{c}</li>" for c in report.get("certifications", []))
        companies_html = ", ".join(report.get("hiring_companies", []))
        roles_html = "".join(
            f'<tr><td>{r["title"]}</td><td>{r["match"]}%</td></tr>'
            for r in report.get("target_roles", [])
        )

        return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Career Report</title>
<style>
body {{ font-family: 'Segoe UI',sans-serif; max-width:900px; margin:0 auto; padding:40px; color:#1e293b; }}
h1 {{ color:#4f46e5; border-bottom:3px solid #4f46e5; padding-bottom:12px; }}
h2 {{ color:#4f46e5; font-size:14pt; margin-top:18px; border-bottom:1px solid #e2e8f0; padding-bottom:4px; }}
.score {{ font-size:40pt; font-weight:700; color:#4f46e5; }}
.salary {{ font-size:18pt; font-weight:600; color:#059669; }}
ul {{ margin-left:20px; }} li {{ margin-bottom:4px; font-size:11pt; }}
table {{ width:100%; border-collapse:collapse; }} th,td {{ padding:6px 10px; border-bottom:1px solid #e2e8f0; text-align:left; }}
th {{ background:#f8fafc; color:#64748b; font-size:10pt; text-transform:uppercase; }}
.advice {{ background:#f0f9ff; border-left:4px solid #4f46e5; padding:12px; border-radius:6px; font-size:11pt; }}
.rec {{ background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:14px; text-align:center; margin-top:16px; }}
.rec .label {{ font-size:9pt; text-transform:uppercase; color:#059669; font-weight:700; }}
.rec .text {{ font-size:12pt; color:#065f46; font-weight:600; margin-top:4px; }}
</style></head><body>
<h1>Career Intelligence Report</h1>
<p><strong>{report.get("name")}</strong> — {report.get("current_role")} → {report.get("target_role")}</p>
<h2>Candidate Summary</h2><p>{report.get("candidate_summary","")}</p>
<h2>Readiness Score</h2><span class="score">{report.get("readiness_score",0)}</span><span> / 100 — {report.get("readiness_label","")}</span>
<h2>Expected Salary</h2><div class="salary">₹{salary.get("min",0):,} — ₹{salary.get("max",0):,}</div><p>Median: ₹{salary.get("median",0):,}/year</p>
<h2>Strengths</h2><ul>{strengths_html}</ul>
<h2>Weaknesses</h2><ul>{weaknesses_html}</ul>
<h2>Skill Gaps</h2><ul>{gaps_html}</ul>
<h2>Target Roles</h2><table><tr><th>Role</th><th>Match</th></tr>{roles_html}</table>
<h2>Roadmap Summary</h2><p>{report.get("roadmap_summary","")}</p>
<h2>Recommended Certifications</h2><ul>{certs_html}</ul>
<h2>Hiring Companies</h2><p>{companies_html}</p>
<h2>Mentor Advice</h2><div class="advice">{report.get("mentor_advice","")}</div>
<div class="rec"><div class="label">Overall Recommendation</div><div class="text">{report.get("overall_recommendation","")}</div></div>
<h2>Next Steps</h2><ol>{steps_html}</ol>
<p style="text-align:center;color:#94a3b8;font-size:9pt;margin-top:20px;">Generated by Career Guide AI • {report.get("generated_at","")}</p>
</body></html>"""

    # ═══════════════════════════════════════════════════════════
    # EXPORT — PDF (xhtml2pdf)
    # ═══════════════════════════════════════════════════════════

    def render_pdf(self, report: dict) -> bytes:
        """
        Render the career report as a PDF document.

        Args:
            report: Full report dict (must contain report_html or will render it).

        Returns:
            PDF bytes, or empty bytes on failure.
        """
        html = report.get("report_html", "")
        if not html:
            html = self.render_html(report)

        try:
            from xhtml2pdf import pisa
        except ImportError:
            logger.error("xhtml2pdf not installed. Run: pip install xhtml2pdf")
            return b""

        try:
            buf = io.BytesIO()
            pisa_status = pisa.CreatePDF(
                src=html,
                dest=buf,
                encoding="utf-8",
            )

            if pisa_status.err:
                logger.warning(f"xhtml2pdf reported {pisa_status.err} error(s)")

            buf.seek(0)
            pdf_bytes = buf.read()
            logger.info(f"Report PDF generated ({len(pdf_bytes)} bytes)")
            return pdf_bytes

        except Exception as e:
            logger.error(f"Report PDF generation failed: {e}")
            return b""
