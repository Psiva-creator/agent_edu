"""
Resume Analysis Agent
=====================
Analyzes uploaded resumes, extracts key information, calculates
readiness scores, provides career path recommendations, ATS
optimization suggestions, and exports to Markdown / HTML / PDF.

Features:
    - Skill extraction from free-text resumes
    - Missing skill identification against target roles
    - Readiness score calculation (0–100)
    - Career path recommendation
    - ATS optimization suggestions
    - Resume summary generation
    - Markdown generation
    - HTML rendering via Jinja2 templates
    - PDF export via xhtml2pdf

Supports:
    - OpenAI GPT-4 powered analysis (when API key is configured)
    - Intelligent fallback analysis (no API key required)
"""

import io
import re
import logging
from pathlib import Path
from typing import Optional

from jinja2 import Environment, FileSystemLoader

from services.llm_service import LLMService
from prompts.templates import RESUME_ANALYSIS_PROMPT, RESUME_EXPORT_PROMPT

logger = logging.getLogger(__name__)

# ─── Path to Jinja2 templates directory ──────────────────────

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

# ─── Known Skills Database (for extraction) ──────────────────

KNOWN_SKILLS: list[str] = [
    # Languages
    "python", "javascript", "java", "c++", "c#", "go", "rust",
    "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
    "typescript",
    # Frontend
    "react", "angular", "vue", "svelte", "next.js", "nuxt",
    "html", "css", "tailwind", "bootstrap", "sass",
    # Backend
    "node.js", "express", "django", "flask", "fastapi",
    "spring boot", "laravel", ".net",
    # Data / ML
    "machine learning", "deep learning", "tensorflow", "pytorch",
    "scikit-learn", "pandas", "numpy", "matplotlib", "seaborn",
    "nlp", "computer vision", "opencv",
    # Databases
    "sql", "mysql", "postgresql", "mongodb", "redis", "sqlite",
    "dynamodb", "cassandra", "firebase", "supabase",
    # DevOps / Cloud
    "docker", "kubernetes", "aws", "azure", "gcp", "terraform",
    "jenkins", "github actions", "ci/cd", "linux", "nginx",
    # Tools
    "git", "github", "jira", "figma", "postman",
    "graphql", "rest api", "grpc", "websocket",
    "microservices", "agile", "scrum",
    # Data Eng
    "spark", "kafka", "airflow", "hadoop", "snowflake",
    "data analysis", "data visualization", "tableau", "power bi",
]

# ─── Target Role → Required Skills Map ───────────────────────

ROLE_REQUIRED_SKILLS: dict[str, list[str]] = {
    "software engineer": [
        "python", "javascript", "git", "sql", "data structures",
        "algorithms", "rest api", "docker", "testing",
    ],
    "frontend developer": [
        "javascript", "html", "css", "react", "typescript",
        "git", "responsive design", "testing", "figma",
    ],
    "backend developer": [
        "python", "sql", "rest api", "docker", "git",
        "database design", "authentication", "testing", "linux",
    ],
    "data scientist": [
        "python", "sql", "machine learning", "statistics",
        "pandas", "numpy", "data visualization", "deep learning",
    ],
    "ml engineer": [
        "python", "pytorch", "tensorflow", "docker", "aws",
        "machine learning", "mlops", "git", "sql",
    ],
    "devops engineer": [
        "docker", "kubernetes", "aws", "linux", "ci/cd",
        "terraform", "git", "python", "monitoring",
    ],
    "full stack developer": [
        "javascript", "react", "node.js", "sql", "git",
        "docker", "html", "css", "rest api", "testing",
    ],
}


class ResumeAgent:
    """
    Agent responsible for resume analysis, scoring, career
    recommendations, and multi-format export.

    Usage:
        agent = ResumeAgent()
        analysis = await agent.analyze_resume(text, "Data Scientist")
        md   = agent.generate_markdown(data)
        html = agent.render_html(data)
        pdf  = agent.render_pdf(data)
    """

    def __init__(self, llm_service: Optional[LLMService] = None):
        """
        Initialize the ResumeAgent.

        Args:
            llm_service: Injected LLM service (or creates its own).
        """
        self.llm = llm_service or LLMService()

        # Set up Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(TEMPLATES_DIR)),
            autoescape=True,
        )

    # ═══════════════════════════════════════════════════════════
    # ANALYSIS
    # ═══════════════════════════════════════════════════════════

    async def analyze_resume(
        self, resume_text: str, target_role: str = "Software Engineer",
    ) -> dict:
        """
        Analyze a resume and return comprehensive feedback.

        Args:
            resume_text: Raw resume text content.
            target_role: The role the user is targeting.

        Returns:
            Dict with extracted_skills, missing_skills, readiness_score,
            career_path, strengths, improvements, ats_suggestions, summary.
        """
        if not resume_text or not resume_text.strip():
            return {"error": "Empty resume text provided."}

        # ── Try LLM-based analysis ───────────────────────────
        if self.llm.is_available:
            try:
                result = await self._analyze_with_llm(resume_text, target_role)
                if result and result.get("extracted_skills"):
                    logger.info("Resume analyzed via LLM.")
                    return result
            except Exception as e:
                logger.warning(f"LLM resume analysis failed: {e}")

        # ── Fallback analysis ────────────────────────────────
        logger.info("Analyzing resume via fallback engine.")
        return self._analyze_fallback(resume_text, target_role)

    async def _analyze_with_llm(
        self, resume_text: str, target_role: str,
    ) -> dict:
        """Analyze resume using OpenAI."""
        prompt = RESUME_ANALYSIS_PROMPT.format(
            resume_text=resume_text[:4000],  # Limit to avoid token overflow
            target_role=target_role,
        )
        result = await self.llm.generate_json(prompt)
        if isinstance(result, dict) and result:
            # Ensure required fields
            result.setdefault("target_role", target_role)
            result.setdefault("missing_skills", [])
            result.setdefault("career_path", [])
            return result
        return {}

    def _analyze_fallback(
        self, resume_text: str, target_role: str,
    ) -> dict:
        """
        Analyze resume without LLM using pattern matching
        and heuristic scoring.
        """
        text_lower = resume_text.lower()

        # ── 1. Extract skills ────────────────────────────────
        extracted_skills = self._extract_skills(text_lower)

        # ── 2. Identify missing skills ───────────────────────
        required = self._get_required_skills(target_role)
        extracted_lower = {s.lower() for s in extracted_skills}
        missing_skills = [
            s for s in required
            if s.lower() not in extracted_lower
        ]

        # ── 3. Calculate readiness score ─────────────────────
        readiness_score = self._calculate_readiness(
            extracted_skills, required, text_lower,
        )

        # ── 4. Determine career path ─────────────────────────
        career_path = self._recommend_career_path(extracted_skills)

        # ── 5. Identify strengths ────────────────────────────
        strengths = self._identify_strengths(
            extracted_skills, text_lower, target_role,
        )

        # ── 6. Identify improvements ─────────────────────────
        improvements = self._identify_improvements(
            extracted_skills, text_lower, missing_skills,
        )

        # ── 7. ATS suggestions ───────────────────────────────
        ats_suggestions = self._generate_ats_suggestions(
            text_lower, target_role, extracted_skills,
        )

        # ── 8. Generate summary ──────────────────────────────
        experience_years = self._extract_experience_years(text_lower)
        summary = self._generate_summary(
            extracted_skills, experience_years,
            target_role, readiness_score,
        )

        return {
            "target_role": target_role,
            "extracted_skills": extracted_skills,
            "missing_skills": missing_skills,
            "readiness_score": round(readiness_score, 1),
            "readiness_label": self._score_to_label(readiness_score),
            "career_path": career_path,
            "experience_years": experience_years,
            "strengths": strengths,
            "improvements": improvements,
            "ats_suggestions": ats_suggestions,
            "summary": summary,
            "score": round(readiness_score, 1),  # Alias for compatibility
        }

    # ─── Extraction Helpers ───────────────────────────────────

    def _extract_skills(self, text_lower: str) -> list[str]:
        """Extract known skills from resume text."""
        found = []
        for skill in KNOWN_SKILLS:
            # Word boundary matching to avoid partial matches
            pattern = r'\b' + re.escape(skill) + r'\b'
            if re.search(pattern, text_lower):
                # Capitalize properly
                found.append(skill.title() if len(skill) > 3 else skill.upper())
        # Deduplicate while preserving order
        seen = set()
        unique = []
        for s in found:
            key = s.lower()
            if key not in seen:
                seen.add(key)
                unique.append(s)
        return unique

    def _extract_experience_years(self, text_lower: str) -> int:
        """Extract years of experience from resume text."""
        patterns = [
            r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)',
            r'(?:experience|exp)\s*(?:of|:)?\s*(\d+)\+?\s*(?:years?|yrs?)',
            r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:in|of)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text_lower)
            if match:
                return int(match.group(1))
        return 0

    def _get_required_skills(self, target_role: str) -> list[str]:
        """Get required skills for a target role."""
        role_lower = target_role.lower().strip()
        for role, skills in ROLE_REQUIRED_SKILLS.items():
            if role in role_lower or role_lower in role:
                return skills
        # Default
        return ["python", "git", "sql", "rest api", "docker"]

    # ─── Scoring ──────────────────────────────────────────────

    def _calculate_readiness(
        self, extracted: list[str], required: list[str], text_lower: str,
    ) -> float:
        """
        Calculate career readiness score (0–100).

        Weighted formula:
            - Skill match:     40%  (extracted vs required)
            - Skill breadth:   15%  (total skills found)
            - Experience:      20%  (years mentioned)
            - Action verbs:    10%  (achievement-oriented language)
            - Structure:       15%  (key resume sections present)
        """
        extracted_lower = {s.lower() for s in extracted}

        # Skill match (40%)
        if required:
            match_ratio = len(
                [s for s in required if s.lower() in extracted_lower]
            ) / len(required)
        else:
            match_ratio = 0.5
        skill_score = match_ratio * 40

        # Skill breadth (15%)
        breadth_score = min(len(extracted) / 10, 1.0) * 15

        # Experience (20%)
        exp_years = self._extract_experience_years(text_lower)
        exp_score = min(exp_years / 5, 1.0) * 20

        # Action verbs (10%)
        action_verbs = [
            "built", "developed", "designed", "implemented", "created",
            "led", "managed", "improved", "optimized", "deployed",
            "architected", "mentored", "automated", "launched",
        ]
        verb_count = sum(1 for v in action_verbs if v in text_lower)
        verb_score = min(verb_count / 5, 1.0) * 10

        # Structure (15%)
        sections = ["experience", "education", "skills", "project"]
        section_count = sum(1 for s in sections if s in text_lower)
        structure_score = (section_count / len(sections)) * 15

        total = skill_score + breadth_score + exp_score + verb_score + structure_score
        return min(total, 100)

    @staticmethod
    def _score_to_label(score: float) -> str:
        """Convert readiness score to a human-readable label."""
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

    # ─── Career Path ──────────────────────────────────────────

    def _recommend_career_path(self, skills: list[str]) -> list[dict]:
        """Recommend career paths based on extracted skills."""
        skills_lower = {s.lower() for s in skills}
        recommendations = []

        for role, required in ROLE_REQUIRED_SKILLS.items():
            overlap = len([s for s in required if s in skills_lower])
            if overlap >= 2:  # At least 2 matching skills
                match_pct = round((overlap / len(required)) * 100)
                recommendations.append({
                    "role": role.title(),
                    "match_percentage": match_pct,
                    "matching_skills": overlap,
                    "total_required": len(required),
                })

        # Sort by match percentage descending
        recommendations.sort(key=lambda x: x["match_percentage"], reverse=True)
        return recommendations[:5]

    # ─── Strengths & Improvements ─────────────────────────────

    def _identify_strengths(
        self, skills: list[str], text_lower: str, target_role: str,
    ) -> list[str]:
        """Identify resume strengths."""
        strengths = []

        if len(skills) >= 8:
            strengths.append(f"Strong technical breadth with {len(skills)} skills identified")
        elif len(skills) >= 5:
            strengths.append(f"Good range of technical skills ({len(skills)} found)")

        exp = self._extract_experience_years(text_lower)
        if exp >= 3:
            strengths.append(f"Solid experience of {exp}+ years")
        elif exp >= 1:
            strengths.append(f"Relevant experience of {exp}+ year(s)")

        action_words = ["built", "developed", "designed", "implemented", "led", "created"]
        if any(w in text_lower for w in action_words):
            strengths.append("Uses strong action verbs to describe achievements")

        if any(w in text_lower for w in ["project", "portfolio"]):
            strengths.append("Includes project experience")

        if any(w in text_lower for w in ["certified", "certification", "certificate"]):
            strengths.append("Professional certifications mentioned")

        if any(w in text_lower for w in ["github", "linkedin", "portfolio"]):
            strengths.append("Includes professional profile links")

        quantifier_pattern = r'\d+%|\d+x|\$\d+|\d+\s*users|\d+\s*team'
        if re.search(quantifier_pattern, text_lower):
            strengths.append("Quantifies achievements with numbers")

        return strengths[:6]

    def _identify_improvements(
        self, skills: list[str], text_lower: str, missing: list[str],
    ) -> list[str]:
        """Identify areas for improvement."""
        improvements = []

        if missing:
            top_missing = ", ".join(missing[:3])
            improvements.append(f"Add missing skills: {top_missing}")

        if len(skills) < 5:
            improvements.append("List more technical skills relevant to your target role")

        if not re.search(r'\d+%|\d+x', text_lower):
            improvements.append("Quantify achievements (e.g., 'improved performance by 30%')")

        action_words = ["built", "developed", "designed", "implemented", "created"]
        if not any(w in text_lower for w in action_words):
            improvements.append("Use strong action verbs: built, developed, implemented, optimized")

        if "github" not in text_lower and "linkedin" not in text_lower:
            improvements.append("Add links to GitHub, LinkedIn, or portfolio website")

        if "summary" not in text_lower and "objective" not in text_lower:
            improvements.append("Add a professional summary at the top of your resume")

        if "project" not in text_lower:
            improvements.append("Include relevant project experience with tech stacks")

        return improvements[:6]

    # ─── ATS Suggestions ─────────────────────────────────────

    def _generate_ats_suggestions(
        self, text_lower: str, target_role: str, skills: list[str],
    ) -> list[str]:
        """Generate ATS (Applicant Tracking System) optimization tips."""
        suggestions = []

        # Check for standard sections
        standard_sections = {
            "experience": "Work Experience",
            "education": "Education",
            "skills": "Technical Skills",
        }
        for keyword, section_name in standard_sections.items():
            if keyword not in text_lower:
                suggestions.append(
                    f"Add a clear '{section_name}' section heading for ATS parsing"
                )

        # Target role keyword
        if target_role.lower() not in text_lower:
            suggestions.append(
                f"Include the target role '{target_role}' in your summary or objective"
            )

        # Formatting tips
        suggestions.extend([
            "Use a clean, single-column layout — avoid tables, graphics, and columns",
            "Save as PDF to preserve formatting across ATS systems",
            "Use standard fonts (Arial, Calibri, Times New Roman) for compatibility",
        ])

        # Keyword density
        required = self._get_required_skills(target_role)
        missing_in_text = [s for s in required if s not in text_lower]
        if missing_in_text:
            suggestions.append(
                f"Add keywords from job descriptions: {', '.join(missing_in_text[:4])}"
            )

        if len(text_lower) < 300:
            suggestions.append("Resume appears too short — aim for at least 1 full page")
        elif len(text_lower) > 5000:
            suggestions.append("Resume may be too long — keep it to 1–2 pages")

        return suggestions[:8]

    # ─── Summary Generation ───────────────────────────────────

    def _generate_summary(
        self, skills: list[str], exp_years: int,
        target_role: str, score: float,
    ) -> str:
        """Generate a resume analysis summary."""
        skill_str = ", ".join(skills[:5])
        extra = f" and {len(skills) - 5} more" if len(skills) > 5 else ""

        parts = [
            f"Resume analyzed for '{target_role}' role.",
            f"Found {len(skills)} relevant skills ({skill_str}{extra}).",
        ]

        if exp_years:
            parts.append(f"{exp_years} year(s) of experience detected.")

        parts.append(
            f"Readiness score: {score:.0f}/100 ({self._score_to_label(score)})."
        )

        return " ".join(parts)

    # ═══════════════════════════════════════════════════════════
    # EXPORT — MARKDOWN
    # ═══════════════════════════════════════════════════════════

    def generate_markdown(self, data: dict) -> str:
        """
        Generate a professional resume in Markdown format.

        Args:
            data: Dict with name, email, phone, summary, skills,
                  experience, education, projects, certifications.

        Returns:
            Formatted Markdown string.
        """
        lines: list[str] = []

        # ── Header ───────────────────────────────────────────
        lines.append(f"# {data.get('name', 'Name')}")
        contact_parts = []
        if data.get("email"):
            contact_parts.append(data["email"])
        if data.get("phone"):
            contact_parts.append(data["phone"])
        if data.get("linkedin"):
            contact_parts.append(data["linkedin"])
        if data.get("github"):
            contact_parts.append(data["github"])
        if contact_parts:
            lines.append(" | ".join(contact_parts))
        lines.append("")

        # ── Summary ──────────────────────────────────────────
        if data.get("summary"):
            lines.append("## Professional Summary")
            lines.append("")
            lines.append(data["summary"])
            lines.append("")

        # ── Skills ───────────────────────────────────────────
        if data.get("skills"):
            lines.append("## Technical Skills")
            lines.append("")
            lines.append("**" + "** · **".join(data["skills"]) + "**")
            lines.append("")

        # ── Experience ───────────────────────────────────────
        if data.get("experience"):
            lines.append("## Experience")
            lines.append("")
            for exp in data["experience"]:
                title = exp.get("title", "Role")
                company = exp.get("company", "Company")
                duration = exp.get("duration", "")
                lines.append(f"### {title} — {company}")
                if duration:
                    lines.append(f"*{duration}*")
                lines.append("")
                for point in exp.get("points", []):
                    lines.append(f"- {point}")
                lines.append("")

        # ── Education ────────────────────────────────────────
        if data.get("education"):
            lines.append("## Education")
            lines.append("")
            for edu in data["education"]:
                degree = edu.get("degree", "Degree")
                inst = edu.get("institution", "Institution")
                year = edu.get("year", "")
                line = f"**{degree}** — {inst}"
                if year:
                    line += f" ({year})"
                lines.append(line)
                lines.append("")

        # ── Projects ─────────────────────────────────────────
        if data.get("projects"):
            lines.append("## Projects")
            lines.append("")
            for proj in data["projects"]:
                lines.append(f"### {proj.get('name', 'Project')}")
                if proj.get("description"):
                    lines.append(proj["description"])
                if proj.get("tech"):
                    tech = proj["tech"]
                    tech_str = ", ".join(tech) if isinstance(tech, list) else tech
                    lines.append(f"**Tech:** {tech_str}")
                lines.append("")

        # ── Certifications ───────────────────────────────────
        if data.get("certifications"):
            lines.append("## Certifications")
            lines.append("")
            for cert in data["certifications"]:
                lines.append(f"- {cert}")
            lines.append("")

        return "\n".join(lines)

    # ═══════════════════════════════════════════════════════════
    # EXPORT — HTML (Jinja2)
    # ═══════════════════════════════════════════════════════════

    def render_html(self, data: dict) -> str:
        """
        Render resume data as styled HTML using Jinja2 template.

        Args:
            data: Resume data dict.

        Returns:
            Complete HTML string ready for browser or PDF conversion.
        """
        try:
            template = self.jinja_env.get_template("resume_template.html")
            return template.render(**data)
        except Exception as e:
            logger.error(f"Jinja2 template rendering failed: {e}")
            # Fallback: convert markdown to basic HTML
            return self.markdown_to_html(self.generate_markdown(data))

    def markdown_to_html(self, markdown_text: str) -> str:
        """
        Convert Markdown to styled HTML (fallback if Jinja2 fails).

        Args:
            markdown_text: Markdown resume content.

        Returns:
            Styled HTML string.
        """
        try:
            import markdown as md
            html_body = md.markdown(markdown_text, extensions=["extra", "smarty"])
        except ImportError:
            logger.warning("markdown library not installed. Using raw text.")
            html_body = f"<pre>{markdown_text}</pre>"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6; color: #2d3748;
            max-width: 800px; margin: 0 auto; padding: 40px 50px;
        }}
        h1 {{ font-size: 28px; color: #1a202c; border-bottom: 3px solid #4f46e5;
             padding-bottom: 8px; margin-bottom: 8px; }}
        h2 {{ font-size: 16px; color: #4f46e5; text-transform: uppercase;
             letter-spacing: 1px; border-bottom: 1px solid #e2e8f0;
             padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; }}
        h3 {{ font-size: 15px; color: #2d3748; margin-top: 12px; }}
        p {{ margin-bottom: 8px; font-size: 14px; }}
        ul {{ margin-left: 20px; margin-bottom: 10px; }}
        li {{ font-size: 14px; margin-bottom: 4px; }}
        em {{ color: #718096; font-size: 13px; }}
        strong {{ color: #1a202c; }}
    </style>
</head>
<body>{html_body}</body>
</html>"""

    # ═══════════════════════════════════════════════════════════
    # EXPORT — PDF (xhtml2pdf)
    # ═══════════════════════════════════════════════════════════

    def render_pdf(self, data: dict) -> bytes:
        """
        Render resume data as a PDF document.

        Uses Jinja2 → HTML → xhtml2pdf pipeline.

        Args:
            data: Resume data dict.

        Returns:
            PDF file bytes, or empty bytes on failure.
        """
        html_content = self.render_html(data)
        return self.html_to_pdf_bytes(html_content)

    def html_to_pdf_bytes(self, html_content: str) -> bytes:
        """
        Convert HTML string to PDF bytes using xhtml2pdf.

        Args:
            html_content: Complete HTML document string.

        Returns:
            PDF bytes, or empty bytes if conversion fails.
        """
        try:
            from xhtml2pdf import pisa
        except ImportError:
            logger.error(
                "xhtml2pdf is not installed. "
                "Install with: pip install xhtml2pdf"
            )
            return b""

        try:
            pdf_buffer = io.BytesIO()
            pisa_status = pisa.CreatePDF(
                src=html_content,
                dest=pdf_buffer,
                encoding="utf-8",
            )

            if pisa_status.err:
                logger.error(f"xhtml2pdf reported {pisa_status.err} error(s)")
                # Still return what was generated — partial PDFs can be usable
                if pdf_buffer.tell() > 0:
                    pdf_buffer.seek(0)
                    return pdf_buffer.read()
                return b""

            pdf_buffer.seek(0)
            pdf_bytes = pdf_buffer.read()
            logger.info(f"PDF generated successfully ({len(pdf_bytes)} bytes)")
            return pdf_bytes

        except Exception as e:
            logger.error(f"PDF generation failed: {e}")
            return b""
