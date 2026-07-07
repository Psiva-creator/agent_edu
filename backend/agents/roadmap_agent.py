"""
Career Roadmap Agent
====================
Generates personalized career development roadmaps with
weekly breakdowns including learning objectives, tasks,
resources, practice exercises, mini-projects, and milestones.

Supports:
    - OpenAI GPT-4 powered generation (when API key is configured)
    - Intelligent fallback generation (no API key required)
    - Dynamic skill-to-resource mapping via ResourceService
    - Configurable hours/week and deadline
"""

import logging
import math
from typing import Optional

from services.llm_service import LLMService
from services.resource_service import ResourceService
from prompts.templates import ROADMAP_PROMPT

logger = logging.getLogger(__name__)


# ─── Validation Constants ────────────────────────────────────────

MIN_HOURS_PER_WEEK = 1
MAX_HOURS_PER_WEEK = 80
MIN_WEEKS = 1
MAX_WEEKS = 52
DEFAULT_WEEKS = 10
DEFAULT_HOURS = 10


# ─── Known Role → Skill Mappings (fallback inference) ────────────

ROLE_SKILL_MAP: dict[str, list[str]] = {
    "python developer": [
        "Python Basics", "Functions", "OOP", "Flask", "Django", "SQL", "REST APIs"
    ],
    "frontend developer": [
        "HTML", "CSS", "JavaScript", "React", "State Management", "Routing", "Performance"
    ],
    "backend developer": [
        "Node.js", "Express", "Databases", "Authentication", "System Design", "Docker", "CI/CD"
    ],
    "full stack developer": [
        "JavaScript", "React", "Node.js", "SQL", "Docker", "Git", "System Architecture"
    ],
    "java developer": [
        "Java Basics", "OOP", "Spring Boot", "Hibernate", "Microservices", "SQL"
    ],
    "cpp developer": [
        "C++ Basics", "Pointers", "Memory Management", "STL", "Multithreading", "Algorithms"
    ],
    "mobile app developer": [
        "Dart", "Flutter", "State Management", "API Integration", "App Store Deployment"
    ],
    "game developer": [
        "C#", "Unity Engine", "Physics", "3D Math", "Game Logic", "Optimization"
    ],
    "ai engineer": [
        "Python", "NumPy", "Pandas", "Statistics", "Machine Learning", "Deep Learning", "PyTorch", "NLP"
    ],
    "machine learning engineer": [
        "Python", "Scikit-Learn", "TensorFlow", "MLOps", "Model Deployment", "AWS"
    ],
    "data scientist": [
        "Python", "Data Analysis", "SQL", "Machine Learning", "Data Visualization", "Big Data"
    ],
    "data analyst": [
        "Excel", "SQL", "Tableau", "PowerBI", "Python", "Data Cleaning"
    ],
    "nlp engineer": [
        "Python", "Text Processing", "Transformers", "HuggingFace", "LLMs", "LangChain"
    ],
    "computer vision engineer": [
        "Python", "OpenCV", "PyTorch", "CNNs", "Object Detection", "Image Segmentation"
    ],
    "mlops engineer": [
        "Docker", "Kubernetes", "CI/CD", "Model Registry", "Monitoring", "AWS SageMaker"
    ],
    "cybersecurity analyst": [
        "Networking", "Linux", "Security Basics", "SIEM", "Incident Response", "Threat Hunting"
    ],
    "cybersecurity engineer": [
        "Linux", "Networking", "Python", "OWASP", "Cryptography", "Security Architecture"
    ],
    "security engineer": [
        "Linux", "Networking", "Python", "OWASP", "Cryptography", "Security Architecture"
    ],
    "penetration tester": [
        "Networking", "Linux", "Kali", "Web Exploitation", "Network Spoofing", "Privilege Escalation"
    ],
    "soc analyst": [
        "Networking", "Logs Analysis", "SIEM", "Wireshark", "Malware Analysis"
    ],
    "cloud security": [
        "AWS Security", "IAM", "Compliance", "Vulnerability Management", "Network Security"
    ],
    "cloud engineer": [
        "Linux", "Networking", "AWS", "Docker", "Terraform", "CI/CD"
    ],
    "aws engineer": [
        "AWS EC2", "S3 & RDS", "VPC & Networking", "IAM", "Lambda & Serverless", "CloudFormation"
    ],
    "azure engineer": [
        "Azure VMs", "Azure Networking", "Active Directory", "Azure Functions", "ARM Templates"
    ],
    "google cloud engineer": [
        "GCP Compute", "GCP Networking", "Cloud Storage", "BigQuery", "GKE"
    ],
    "devops engineer": [
        "Linux", "Bash", "Docker", "Kubernetes", "CI/CD (Jenkins/Actions)", "Terraform", "Monitoring"
    ],
    "site reliability engineer": [
        "Linux", "Python/Go", "Kubernetes", "Observability", "Incident Management", "SLIs/SLOs"
    ],
    "data engineer": [
        "Python", "SQL", "Data Modeling", "ETL Pipelines", "Spark", "Airflow"
    ],
    "database administrator": [
        "SQL", "Database Design", "Performance Tuning", "Backup & Recovery", "Security"
    ],
    "big data engineer": [
        "Hadoop", "Spark", "Kafka", "NoSQL", "Data Warehousing"
    ],
    "ui designer": [
        "Design Principles", "Typography", "Color Theory", "Figma", "Prototyping", "Design Systems"
    ],
    "ux designer": [
        "User Research", "Wireframing", "User Testing", "Information Architecture", "Figma"
    ],
    "product designer": [
        "UX Research", "UI Design", "Interaction Design", "Prototyping", "Design Handoff"
    ],
    "blockchain developer": [
        "Cryptography", "Solidity", "Smart Contracts", "Web3.js", "Ethereum", "DeFi"
    ],
    "software engineer": [
        "Python", "Data Structures", "Algorithms", "SQL", "Git", "System Design"
    ]
}

# ─── Phase Definitions ───────────────────────────────────────────

PHASES = [
    {
        "name": "Foundations",
        "fraction": 0.25,
        "focus": "Core concepts, setup, and fundamentals",
        "milestone_tpl": "Demonstrate understanding of {skills} fundamentals",
        "deliverable_tpl": "Notes, setup environment, and practice exercises for {skills}",
    },
    {
        "name": "Core Skills",
        "fraction": 0.25,
        "focus": "Hands-on practice and intermediate concepts",
        "milestone_tpl": "Build working examples using {skills}",
        "deliverable_tpl": "Working code samples and small utilities using {skills}",
    },
    {
        "name": "Advanced Topics",
        "fraction": 0.25,
        "focus": "Deep dives, real-world patterns, and integration",
        "milestone_tpl": "Complete an intermediate project with {skills}",
        "deliverable_tpl": "Mini-project integrating {skills} with real-world data",
    },
    {
        "name": "Portfolio & Interview Prep",
        "fraction": 0.25,
        "focus": "Portfolio projects, interview prep, and job readiness",
        "milestone_tpl": "Portfolio-ready project and interview readiness",
        "deliverable_tpl": "Deployed portfolio project targeting {role} role",
    },
]


class RoadmapAgent:
    """
    Agent responsible for generating career development roadmaps.

    Uses OpenAI when available; falls back to intelligent mock
    generation using the curated resource library.
    """

    def __init__(
        self,
        llm_service: Optional[LLMService] = None,
        resource_service: Optional[ResourceService] = None,
    ):
        """
        Initialize the RoadmapAgent.

        Args:
            llm_service:      Injected LLM service (or creates its own).
            resource_service:  Injected resource service (or creates its own).
        """
        self.llm = llm_service or LLMService()
        self.resources = resource_service or ResourceService()

    # ─── Public API ───────────────────────────────────────────

    async def generate_roadmap(
        self,
        skill_gaps: list[str],
        hours_per_week: int = DEFAULT_HOURS,
        deadline_weeks: int = DEFAULT_WEEKS,
        current_role: str = "Student",
        target_role: str = "Software Engineer",
    ) -> dict:
        """
        Generate a personalized career roadmap.

        Args:
            skill_gaps:      Skills the user needs to learn.
            hours_per_week:  Available study hours per week (1–80).
            deadline_weeks:  Total weeks for the roadmap (1–52).
            current_role:    User's current role (for context).
            target_role:     Desired target role.

        Returns:
            Structured roadmap dict with weekly breakdown.

        Raises:
            ValueError: If inputs fail validation.
        """
        # ── Validate inputs ──────────────────────────────────
        hours_per_week = self._validate_hours(hours_per_week)
        deadline_weeks = self._validate_weeks(deadline_weeks)
        skill_gaps = self._validate_skills(skill_gaps, current_role, target_role)

        logger.info(
            f"Generating roadmap: {current_role} → {target_role} | "
            f"{len(skill_gaps)} skills | {hours_per_week}h/wk | {deadline_weeks} weeks"
        )

        # ── Try LLM-based generation first ───────────────────
        if self.llm.is_available:
            try:
                result = await self._generate_with_llm(
                    skill_gaps, hours_per_week, deadline_weeks,
                    current_role, target_role,
                )
                if result and result.get("weeks"):
                    logger.info("Roadmap generated via LLM successfully.")
                    return result
            except Exception as e:
                logger.warning(f"LLM roadmap generation failed: {e}. Using fallback.")

        # ── Fallback: intelligent mock generation ─────────────
        logger.info("Generating roadmap via intelligent fallback.")
        return self._generate_fallback(
            skill_gaps, hours_per_week, deadline_weeks,
            current_role, target_role,
        )

    # ─── Validation ───────────────────────────────────────────

    @staticmethod
    def _validate_hours(hours: int) -> int:
        """Clamp hours_per_week to valid range."""
        if not isinstance(hours, (int, float)):
            return DEFAULT_HOURS
        return max(MIN_HOURS_PER_WEEK, min(int(hours), MAX_HOURS_PER_WEEK))

    @staticmethod
    def _validate_weeks(weeks: int) -> int:
        """Clamp deadline_weeks to valid range."""
        if not isinstance(weeks, (int, float)):
            return DEFAULT_WEEKS
        return max(MIN_WEEKS, min(int(weeks), MAX_WEEKS))

    def _validate_skills(
        self, skills: list[str],
        current_role: str, target_role: str,
    ) -> list[str]:
        """
        Validate skill list. If empty, infer from target role.
        Deduplicates and strips whitespace.
        """
        if not skills:
            skills = self._infer_skill_gaps(current_role, target_role)
            logger.info(f"No skill_gaps provided; inferred {len(skills)} from target role.")

        # Clean: deduplicate, strip, remove empties
        seen = set()
        cleaned = []
        for s in skills:
            s = s.strip()
            if s and s.lower() not in seen:
                seen.add(s.lower())
                cleaned.append(s)

        return cleaned or ["Python", "SQL", "Git"]  # absolute fallback

    # ─── LLM Generation ──────────────────────────────────────

    async def _generate_with_llm(
        self, skill_gaps, hours_per_week, deadline_weeks,
        current_role, target_role,
    ) -> dict:
        """Generate roadmap using OpenAI GPT-4."""
        prompt = ROADMAP_PROMPT.format(
            current_role=current_role,
            target_role=target_role,
            skill_gaps=", ".join(skill_gaps),
            hours_per_week=hours_per_week,
            deadline_weeks=deadline_weeks,
        )

        weeks_data = await self.llm.generate_json(
            prompt,
            system_message=(
                "You are a career development planner. "
                "Return ONLY valid JSON — an array of week objects."
            ),
        )

        if isinstance(weeks_data, list) and len(weeks_data) > 0:
            return self._wrap_response(
                weeks_data, skill_gaps, hours_per_week,
                deadline_weeks, current_role, target_role,
            )
        return {}

    # ─── Fallback Generation ──────────────────────────────────

    def _generate_fallback(
        self, skill_gaps: list[str], hours_per_week: int,
        deadline_weeks: int, current_role: str, target_role: str,
    ) -> dict:
        """
        Generate an intelligent roadmap without LLM.

        Strategy:
          1. Distribute skills across weeks.
          2. Assign each week to a learning phase.
          3. Populate tasks, resources, projects from ResourceService.
          4. Calculate estimated hours per task.
        """
        weeks = []
        total_skills = len(skill_gaps)
        skills_per_week = max(1, math.ceil(total_skills / deadline_weeks))

        # Compute phase boundaries
        phase_ranges = self._compute_phase_ranges(deadline_weeks)

        for week_num in range(1, deadline_weeks + 1):
            # ── Determine which skills this week covers ──────
            start_idx = min((week_num - 1) * skills_per_week, total_skills)
            end_idx = min(start_idx + skills_per_week, total_skills)
            week_skills = skill_gaps[start_idx:end_idx] if start_idx < total_skills else []

            # ── Determine current phase ──────────────────────
            phase = self._get_phase(week_num, phase_ranges)
            progress = week_num / deadline_weeks  # 0.0 → 1.0

            # ── Build learning objectives ────────────────────
            learning_objectives = self._build_objectives(week_skills, phase, target_role)

            # ── Build tasks with hour estimates ──────────────
            tasks = self._build_tasks(week_skills, hours_per_week, phase)

            # ── Gather resources from library ────────────────
            resources = self._build_resources(week_skills)

            # ── Build practice exercises ─────────────────────
            practice = self._build_practice(week_skills, phase)

            # ── Build mini-project ───────────────────────────
            mini_project = self._build_mini_project(week_skills, phase, target_role)

            # ── Build milestone ──────────────────────────────
            milestone = self._build_milestone(
                week_num, week_skills, phase, deadline_weeks, target_role,
            )

            # ── Calculate estimated hours ────────────────────
            estimated_hours = self._estimate_hours(tasks, hours_per_week)

            # ── Assemble week ────────────────────────────────
            weeks.append({
                "week_number": week_num,
                "theme": (
                    f"{phase['name']}: {', '.join(week_skills)}"
                    if week_skills
                    else f"{phase['name']}: Review & Consolidation"
                ),
                "phase": phase["name"],
                "learning_objectives": learning_objectives,
                "tasks": tasks,
                "resources": resources,
                "practice": practice,
                "mini_project": mini_project,
                "milestone": milestone,
                "estimated_hours": estimated_hours,
            })

        return self._wrap_response(
            weeks, skill_gaps, hours_per_week,
            deadline_weeks, current_role, target_role,
        )

    # ─── Week Component Builders ──────────────────────────────

    def _build_objectives(
        self, skills: list[str], phase: dict, target_role: str,
    ) -> list[str]:
        """Generate learning objectives for the week."""
        objectives = []

        if phase["name"] == "Foundations":
            for s in skills:
                objectives.append(f"Understand core concepts and terminology of {s}")
                objectives.append(f"Set up development environment for {s}")
        elif phase["name"] == "Core Skills":
            for s in skills:
                objectives.append(f"Apply {s} to solve intermediate-level problems")
                objectives.append(f"Build fluency with {s} through hands-on coding")
        elif phase["name"] == "Advanced Topics":
            for s in skills:
                objectives.append(f"Integrate {s} into a real-world project scenario")
                objectives.append(f"Understand best practices and design patterns in {s}")
        else:  # Portfolio & Interview Prep
            objectives.append(f"Complete a portfolio-ready project for {target_role}")
            objectives.append("Prepare for technical interview questions")
            objectives.append("Review and refine all learned skills")

        return objectives[:4]  # Cap at 4 objectives per week

    def _build_tasks(
        self, skills: list[str], hours_per_week: int, phase: dict,
    ) -> list[dict]:
        """Generate structured tasks with time estimates."""
        tasks = []
        n_skills = max(len(skills), 1)

        # Time allocation ratios per phase
        if phase["name"] == "Foundations":
            ratios = {"learn": 0.40, "practice": 0.30, "review": 0.15, "project": 0.15}
        elif phase["name"] == "Core Skills":
            ratios = {"learn": 0.30, "practice": 0.30, "review": 0.10, "project": 0.30}
        elif phase["name"] == "Advanced Topics":
            ratios = {"learn": 0.20, "practice": 0.25, "review": 0.10, "project": 0.45}
        else:
            ratios = {"learn": 0.10, "practice": 0.15, "review": 0.15, "project": 0.60}

        for skill in skills:
            # Learning task
            tasks.append({
                "title": f"Study {skill} — {phase['focus']}",
                "description": (
                    f"Work through {skill} documentation, tutorials, and core concepts. "
                    f"Focus on {phase['focus'].lower()}."
                ),
                "estimated_hours": round(hours_per_week * ratios["learn"] / n_skills, 1),
                "priority": "high",
                "type": "learning",
            })

            # Practice task
            tasks.append({
                "title": f"Practice {skill} with exercises",
                "description": (
                    f"Complete coding exercises, challenges, or problem sets for {skill}. "
                    f"Aim for active recall and hands-on application."
                ),
                "estimated_hours": round(hours_per_week * ratios["practice"] / n_skills, 1),
                "priority": "high",
                "type": "practice",
            })

        # Review & self-assessment (shared across all skills)
        tasks.append({
            "title": "Weekly review & self-assessment",
            "description": (
                f"Review what you learned about {', '.join(skills) if skills else 'this week'}. "
                f"Quiz yourself, update notes, and identify areas to revisit."
            ),
            "estimated_hours": round(hours_per_week * ratios["review"], 1),
            "priority": "medium",
            "type": "review",
        })

        # Project work
        tasks.append({
            "title": f"Project work — {phase['name']} phase",
            "description": (
                f"Apply {', '.join(skills) if skills else 'learned skills'} in a project. "
                f"Focus: {phase['focus'].lower()}."
            ),
            "estimated_hours": round(hours_per_week * ratios["project"], 1),
            "priority": "high" if phase["name"] in ("Advanced Topics", "Portfolio & Interview Prep") else "medium",
            "type": "project",
        })

        return tasks

    def _build_resources(self, skills: list[str]) -> list[dict]:
        """Gather learning resources from the resource library."""
        resources = []

        for skill in skills:
            skill_data = self.resources.get_for_skill(skill)
            if not skill_data:
                # Fallback resource
                resources.append({
                    "title": f"{skill} — Search for tutorials",
                    "url": f"https://www.google.com/search?q={skill}+tutorial",
                    "type": "article",
                    "skill": skill,
                })
                continue

            res = skill_data.get("resources", {})

            # Official docs
            docs = res.get("official_docs")
            if docs:
                resources.append({**docs, "skill": skill})

            # YouTube (first one)
            yt = res.get("youtube", [])
            if yt:
                resources.append({**yt[0], "skill": skill})

            # Course (first one)
            courses = res.get("courses", [])
            if courses:
                resources.append({**courses[0], "skill": skill})

        return resources

    def _build_practice(self, skills: list[str], phase: dict) -> list[str]:
        """Generate practice exercise suggestions."""
        exercises = []

        for skill in skills:
            if phase["name"] == "Foundations":
                exercises.append(f"Complete 5 beginner exercises for {skill}")
                exercises.append(f"Follow along with a {skill} quick-start tutorial")
            elif phase["name"] == "Core Skills":
                exercises.append(f"Solve 3 intermediate {skill} coding challenges")
                exercises.append(f"Implement a small utility using {skill}")
            elif phase["name"] == "Advanced Topics":
                exercises.append(f"Refactor a project to use {skill} best practices")
                exercises.append(f"Write unit tests for your {skill} code")
            else:
                exercises.append(f"Mock interview questions on {skill}")
                exercises.append(f"Optimize and document your {skill} portfolio project")

        return exercises[:4]  # Cap at 4

    def _build_mini_project(
        self, skills: list[str], phase: dict, target_role: str,
    ) -> dict:
        """Generate a mini-project suggestion for the week."""
        if not skills:
            return {
                "title": "Review Portfolio",
                "description": f"Polish your portfolio for {target_role} applications.",
                "skills_used": [],
                "difficulty": "medium",
            }

        primary_skill = skills[0]
        skill_data = self.resources.get_for_skill(primary_skill)
        res = skill_data.get("resources", {}) if skill_data else {}
        mini = res.get("mini_project", {})

        if mini:
            return {
                "title": mini.get("title", f"Build a {primary_skill} project"),
                "description": mini.get("description", f"Hands-on project using {primary_skill}."),
                "skills_used": mini.get("skills_practiced", skills),
                "difficulty": self._phase_difficulty(phase),
            }

        # Generic fallback project
        return {
            "title": f"Build a {primary_skill} Mini-App",
            "description": (
                f"Create a small application that demonstrates your understanding of "
                f"{', '.join(skills)}. Focus on clean code and documentation."
            ),
            "skills_used": skills,
            "difficulty": self._phase_difficulty(phase),
        }

    def _build_milestone(
        self, week_num: int, skills: list[str],
        phase: dict, total_weeks: int, target_role: str,
    ) -> dict:
        """Generate milestone for the week."""
        skill_str = ", ".join(skills[:3]) if skills else "review"

        title = phase["milestone_tpl"].format(
            skills=skill_str, role=target_role,
        )
        deliverable = phase["deliverable_tpl"].format(
            skills=skill_str, role=target_role,
        )

        return {
            "title": title,
            "description": f"Complete Week {week_num} of {total_weeks} — {phase['name']} phase",
            "deliverable": deliverable,
            "week": week_num,
        }

    # ─── Helper Methods ───────────────────────────────────────

    def _infer_skill_gaps(self, current_role: str, target_role: str) -> list[str]:
        """Infer likely skill gaps based on common role transitions."""
        target_lower = target_role.lower().strip()
        for role, skills in ROLE_SKILL_MAP.items():
            if role in target_lower or target_lower in role:
                return skills
        # Default skills for unknown roles
        return ["Python", "SQL", "Git", "Docker", "System Design"]

    def _compute_phase_ranges(self, total_weeks: int) -> list[dict]:
        """Compute week ranges for each learning phase."""
        ranges = []
        current = 1
        for phase in PHASES:
            span = max(1, round(total_weeks * phase["fraction"]))
            end = min(current + span - 1, total_weeks)
            ranges.append({**phase, "start": current, "end": end})
            current = end + 1
            if current > total_weeks:
                break

        # Ensure last phase extends to final week
        if ranges:
            ranges[-1]["end"] = total_weeks

        return ranges

    def _get_phase(self, week: int, phase_ranges: list[dict]) -> dict:
        """Get the phase definition for a given week number."""
        for pr in phase_ranges:
            if pr["start"] <= week <= pr["end"]:
                return pr
        return phase_ranges[-1]  # Default to last phase

    @staticmethod
    def _phase_difficulty(phase: dict) -> str:
        """Map phase to difficulty level."""
        mapping = {
            "Foundations": "beginner",
            "Core Skills": "intermediate",
            "Advanced Topics": "advanced",
            "Portfolio & Interview Prep": "advanced",
        }
        return mapping.get(phase["name"], "intermediate")

    @staticmethod
    def _estimate_hours(tasks: list[dict], hours_per_week: int) -> float:
        """Sum up estimated hours from tasks, capped at hours_per_week."""
        total = sum(t.get("estimated_hours", 0) for t in tasks)
        return min(round(total, 1), hours_per_week)

    @staticmethod
    def _wrap_response(
        weeks: list, skill_gaps: list[str], hours_per_week: int,
        deadline_weeks: int, current_role: str, target_role: str,
    ) -> dict:
        """Wrap the weekly data into the full response envelope."""
        return {
            "current_role": current_role,
            "target_role": target_role,
            "total_weeks": deadline_weeks,
            "hours_per_week": hours_per_week,
            "total_estimated_hours": hours_per_week * deadline_weeks,
            "skill_gaps_addressed": skill_gaps,
            "weeks": weeks,
            "summary": (
                f"A {deadline_weeks}-week roadmap to transition from "
                f"{current_role} to {target_role}. Covers {len(skill_gaps)} skill "
                f"areas at {hours_per_week} hours/week "
                f"(~{hours_per_week * deadline_weeks} total hours). "
                f"Phases: Foundations → Core Skills → Advanced Topics → "
                f"Portfolio & Interview Prep."
            ),
        }
