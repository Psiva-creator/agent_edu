"""
Router: Resume vs Job Comparison
=================================
POST /api/v1/compare

Compares a user's resume/career profile against a specific job listing.
Computes matched, partial, and missing skills, ATS keyword density,
experience gap, project gap, and generates AI action suggestions.

No LLM required — pure logic using Career Memory signals.
"""

import re
from fastapi import APIRouter, status
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/compare", tags=["Compare"])


# ─── Request / Response Models ───────────────────────────────


class CompareRequest(BaseModel):
    """Inputs for resume vs job comparison."""
    # Resume / Career Memory signals
    resume_skills: list[str] = Field([], description="User's extracted skills from resume")
    profile_skills: list[str] = Field([], description="User's self-reported skills from profile")
    resume_experience_years: int = Field(0, description="Years of experience from resume/profile")
    has_projects: bool = Field(False, description="Does the resume include projects?")
    has_certifications: bool = Field(False, description="Does the resume include certifications?")
    education: Optional[str] = Field(None, description="Highest education level")
    resume_text: Optional[str] = Field(None, description="Raw resume text for ATS keyword matching")

    # Job details
    job_title: str = Field(..., description="Job title")
    job_company: str = Field("", description="Company name")
    job_required_skills: list[str] = Field([], description="Skills required by the job")
    job_description: Optional[str] = Field(None, description="Full job description for ATS scan")
    job_min_experience: int = Field(0, description="Minimum experience years required")
    job_salary: Optional[str] = Field(None, description="Salary range")
    job_location: Optional[str] = Field(None, description="Job location")


class SkillComparisonItem(BaseModel):
    skill: str
    status: str  # "matched" | "partial" | "missing"
    match_detail: Optional[str] = None


class SectionGap(BaseModel):
    section: str
    user_value: str
    job_requirement: str
    status: str      # "met" | "partial" | "gap"
    gap_detail: str


class AISuggestion(BaseModel):
    icon: str
    action: str
    detail: str
    priority: str    # "high" | "medium" | "low"


class CompareResponse(BaseModel):
    """Full comparison result."""
    job_title: str
    job_company: str
    overall_match_pct: int
    ats_keyword_match_pct: int
    skill_match_pct: int
    experience_gap_years: int
    experience_status: str      # "met" | "gap" | "exceeds"

    # Skill breakdown
    matched_skills: list[SkillComparisonItem] = []
    partial_skills: list[SkillComparisonItem] = []
    missing_skills: list[SkillComparisonItem] = []

    # Section comparisons
    section_gaps: list[SectionGap] = []

    # AI suggestions
    ai_suggestions: list[AISuggestion] = []

    # Summary counters
    total_required: int = 0
    total_matched: int = 0
    total_partial: int = 0
    total_missing: int = 0


# ─── Comparison Logic ─────────────────────────────────────────


def _normalize(skill: str) -> str:
    return skill.lower().strip()


def _partial_match(user_skill: str, job_skill: str) -> bool:
    """Check if user skill partially matches job skill (substring or acronym)."""
    u = _normalize(user_skill)
    j = _normalize(job_skill)

    # Direct substring
    if u in j or j in u:
        return True

    # Common equivalences
    equivalences = {
        "ml": ["machine learning"],
        "ai": ["artificial intelligence"],
        "nlp": ["natural language processing"],
        "cv": ["computer vision"],
        "js": ["javascript"],
        "ts": ["typescript"],
        "py": ["python"],
        "k8s": ["kubernetes"],
        "dl": ["deep learning"],
        "tf": ["tensorflow"],
        "pytorch": ["torch", "pytorch"],
        "node": ["node.js", "nodejs"],
        "react": ["reactjs", "react.js"],
        "postgres": ["postgresql"],
        "mongo": ["mongodb"],
        "gcp": ["google cloud"],
        "aws": ["amazon web services"],
        "azure": ["microsoft azure"],
    }
    for abbrev, expansions in equivalences.items():
        if u == abbrev and any(e in j for e in expansions):
            return True
        if j == abbrev and any(e in u for e in expansions):
            return True

    return False


def _compare_skills(
    user_skills: list[str],
    job_skills: list[str],
) -> tuple[list[SkillComparisonItem], list[SkillComparisonItem], list[SkillComparisonItem]]:
    """Return (matched, partial, missing) SkillComparisonItems."""
    user_lower = [_normalize(s) for s in user_skills]
    matched, partial, missing = [], [], []

    for job_skill in job_skills:
        j_lower = _normalize(job_skill)

        # Exact match
        if j_lower in user_lower:
            matched.append(SkillComparisonItem(skill=job_skill, status="matched"))
            continue

        # Partial match
        found_partial = None
        for us_orig, us_lower in zip(user_skills, user_lower):
            if _partial_match(us_orig, job_skill):
                found_partial = us_orig
                break

        if found_partial:
            partial.append(SkillComparisonItem(
                skill=job_skill,
                status="partial",
                match_detail=f"You have '{found_partial}' — related but may need to verify depth"
            ))
        else:
            missing.append(SkillComparisonItem(skill=job_skill, status="missing"))

    return matched, partial, missing


def _compute_ats_match(resume_text: str, job_description: str, job_skills: list[str]) -> int:
    """Compute ATS keyword match percentage."""
    if not resume_text and not job_skills:
        return 0

    resume_lower = (resume_text or "").lower()

    if job_description:
        # Extract meaningful keywords from JD (words > 3 chars, not stopwords)
        stopwords = {"with", "and", "the", "for", "that", "this", "have", "will", "from",
                     "are", "our", "your", "their", "you", "can", "experience", "work",
                     "team", "role", "looking", "about", "also", "must", "strong"}
        words = re.findall(r'\b[a-zA-Z][a-zA-Z+#\.]*\b', job_description)
        keywords = [w.lower() for w in words if len(w) > 3 and w.lower() not in stopwords]
        keywords = list(dict.fromkeys(keywords))[:40]  # unique, top 40
    else:
        keywords = [_normalize(s) for s in job_skills]

    if not keywords:
        return 0

    found = sum(1 for kw in keywords if kw in resume_lower)
    return min(round((found / len(keywords)) * 100), 100)


def _build_section_gaps(
    req: CompareRequest,
) -> list[SectionGap]:
    gaps = []

    # Experience
    exp_needed = req.job_min_experience
    exp_have = req.resume_experience_years
    diff = exp_have - exp_needed
    if diff >= 0:
        exp_status = "met" if diff < 3 else "met"
        detail = f"You have {exp_have} yrs, job requires {exp_needed} yrs ✓" if diff >= 0 else ""
    else:
        exp_status = "gap"
        detail = f"You have {exp_have} yrs, job requires {exp_needed} yrs — {abs(diff)} yr gap"

    gaps.append(SectionGap(
        section="Experience",
        user_value=f"{exp_have} years",
        job_requirement=f"{exp_needed}+ years",
        status=exp_status,
        gap_detail=detail,
    ))

    # Projects
    gaps.append(SectionGap(
        section="Projects",
        user_value="Included" if req.has_projects else "Not in resume",
        job_requirement="Preferred",
        status="met" if req.has_projects else "gap",
        gap_detail="" if req.has_projects else "Add 1–2 relevant projects to your resume",
    ))

    # Certifications
    gaps.append(SectionGap(
        section="Certifications",
        user_value="Included" if req.has_certifications else "None listed",
        job_requirement="Preferred",
        status="met" if req.has_certifications else "partial",
        gap_detail="" if req.has_certifications else "Certifications strengthen applications",
    ))

    # Education
    edu = req.education or ""
    edu_status = "met" if edu else "partial"
    gaps.append(SectionGap(
        section="Education",
        user_value=edu or "Not specified",
        job_requirement="Relevant degree or equivalent",
        status=edu_status,
        gap_detail="" if edu else "Consider adding education details",
    ))

    return gaps


def _generate_suggestions(
    missing: list[SkillComparisonItem],
    partial: list[SkillComparisonItem],
    exp_gap: int,
    has_projects: bool,
    has_certs: bool,
    job_title: str,
) -> list[AISuggestion]:
    suggestions = []

    # Top missing skills
    for item in missing[:3]:
        suggestions.append(AISuggestion(
            icon="📚",
            action=f"Learn {item.skill}",
            detail=f"This is a required skill for {job_title}. Start with official docs or a focused course.",
            priority="high",
        ))

    # Partial skills — needs deepening
    for item in partial[:2]:
        suggestions.append(AISuggestion(
            icon="🔧",
            action=f"Deepen {item.skill}",
            detail=item.match_detail or f"You have a related skill — verify your {item.skill} proficiency matches job expectations.",
            priority="medium",
        ))

    # Experience gap
    if exp_gap > 0:
        suggestions.append(AISuggestion(
            icon="💼",
            action="Bridge Experience Gap",
            detail=f"You're {exp_gap} year(s) short on experience. Consider freelance projects, open-source contributions, or internships to fill the gap.",
            priority="high" if exp_gap > 2 else "medium",
        ))

    # Projects
    if not has_projects:
        suggestions.append(AISuggestion(
            icon="🚀",
            action="Add a Relevant Project",
            detail=f"Build and document a project using key {job_title} skills. This directly improves your match score.",
            priority="high",
        ))

    # Certifications
    if not has_certs:
        suggestions.append(AISuggestion(
            icon="📜",
            action="Get Certified",
            detail="A role-relevant certification (e.g. AWS, Google, Microsoft) signals commitment and fills skill gaps quickly.",
            priority="low",
        ))

    # Resume bullet improvement
    suggestions.append(AISuggestion(
        icon="✍️",
        action="Improve Resume Bullets",
        detail=f"Rewrite experience bullets using the {job_title} job description keywords. Quantify results (e.g. '40% faster', '10k users').",
        priority="medium",
    ))

    return suggestions[:7]


# ─── Endpoint ────────────────────────────────────────────────


@router.post(
    "",
    response_model=CompareResponse,
    status_code=status.HTTP_200_OK,
    summary="Compare resume against a job listing",
    description=(
        "Compares a user's career profile/resume signals against a specific "
        "job listing. Returns matched, partial, missing skills with color codes, "
        "ATS keyword match %, experience gap, section gaps, and AI action suggestions."
    ),
)
async def compare_resume_to_job(req: CompareRequest) -> CompareResponse:
    # Merge resume + profile skills (deduplicate)
    all_user_skills_set: dict[str, str] = {}
    for s in (req.resume_skills + req.profile_skills):
        all_user_skills_set[_normalize(s)] = s
    all_user_skills = list(all_user_skills_set.values())

    # If no job skills provided, build default set from title
    job_skills = req.job_required_skills
    if not job_skills:
        from agents.job_agent import ROLE_SKILLS_MAP
        title_lower = req.job_title.lower()
        for role, skills in ROLE_SKILLS_MAP.items():
            if role in title_lower or title_lower in role:
                job_skills = skills
                break
        if not job_skills:
            job_skills = ["Communication", "Problem Solving", "Teamwork"]

    # ── Skill comparison ──────────────────────────────────────
    matched, partial, missing = _compare_skills(all_user_skills, job_skills)

    total_required = len(job_skills)
    total_matched = len(matched)
    total_partial = len(partial)
    total_missing = len(missing)

    # ── Skill match % ─────────────────────────────────────────
    # partial counts as 0.5
    skill_match_pct = 0
    if total_required > 0:
        skill_match_pct = round(
            ((total_matched + total_partial * 0.5) / total_required) * 100
        )

    # ── ATS keyword match ─────────────────────────────────────
    ats_pct = _compute_ats_match(
        req.resume_text or "",
        req.job_description or "",
        job_skills,
    )

    # ── Experience gap ────────────────────────────────────────
    exp_gap = max(0, req.job_min_experience - req.resume_experience_years)
    if req.resume_experience_years >= req.job_min_experience:
        exp_status = "exceeds" if req.resume_experience_years > req.job_min_experience + 2 else "met"
    else:
        exp_status = "gap"

    # ── Section gaps ─────────────────────────────────────────
    section_gaps = _build_section_gaps(req)

    # ── Overall match % ───────────────────────────────────────
    # Weighted: skills 50%, ats 20%, experience 20%, sections 10%
    exp_score = 100 if exp_status in ("met", "exceeds") else max(0, 100 - exp_gap * 15)
    section_score = (
        (100 if req.has_projects else 40) +
        (100 if req.has_certifications else 60) +
        (100 if req.education else 60)
    ) // 3

    overall = round(
        skill_match_pct * 0.50 +
        ats_pct * 0.20 +
        exp_score * 0.20 +
        section_score * 0.10
    )
    overall = max(0, min(overall, 100))

    # ── AI Suggestions ────────────────────────────────────────
    suggestions = _generate_suggestions(
        missing, partial, exp_gap,
        req.has_projects, req.has_certifications,
        req.job_title,
    )

    return CompareResponse(
        job_title=req.job_title,
        job_company=req.job_company,
        overall_match_pct=overall,
        ats_keyword_match_pct=ats_pct,
        skill_match_pct=skill_match_pct,
        experience_gap_years=exp_gap,
        experience_status=exp_status,
        matched_skills=matched,
        partial_skills=partial,
        missing_skills=missing,
        section_gaps=section_gaps,
        ai_suggestions=suggestions,
        total_required=total_required,
        total_matched=total_matched,
        total_partial=total_partial,
        total_missing=total_missing,
    )
