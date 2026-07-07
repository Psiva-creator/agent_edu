"""
Pydantic Schemas — Request & Response Models
=============================================
All API models for request validation and response serialization.
These power Swagger/OpenAPI auto-documentation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ═══════════════════════════════════════════════════════════════
# Common / Shared
# ═══════════════════════════════════════════════════════════════

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    status_code: int = 400


class SuccessMessage(BaseModel):
    """Generic success wrapper."""
    message: str
    status: str = "ok"


# ═══════════════════════════════════════════════════════════════
# Resume — Analysis
# ═══════════════════════════════════════════════════════════════

class ResumeAnalysisRequest(BaseModel):
    """Request body for resume analysis."""
    resume_text: str = Field(..., min_length=50, description="Full resume text content")
    target_role: str = Field(default="Software Engineer", description="Target career role")

    model_config = {"json_schema_extra": {
        "examples": [{
            "resume_text": "John Doe. 3 years experience in Python, Django. Built REST APIs at Acme Corp...",
            "target_role": "Backend Developer"
        }]
    }}


class CareerPathMatch(BaseModel):
    """A single career path recommendation."""
    role: str
    match_percentage: int
    matching_skills: int
    total_required: int


class ResumeAnalysisResponse(BaseModel):
    """Response from resume analysis."""
    target_role: str
    extracted_skills: list[str] = []
    missing_skills: list[str] = []
    readiness_score: float = Field(0.0, ge=0, le=100)
    readiness_label: str = ""
    career_path: list[CareerPathMatch] = []
    experience_years: int = 0
    strengths: list[str] = []
    improvements: list[str] = []
    ats_suggestions: list[str] = []
    summary: str = ""
    score: float = Field(0.0, ge=0, le=100)


# ═══════════════════════════════════════════════════════════════
# Resume — Export
# ═══════════════════════════════════════════════════════════════

class ExperienceEntry(BaseModel):
    """A single work experience entry."""
    title: str = "Software Engineer"
    company: str = "Company"
    duration: str = "2022 – Present"
    points: list[str] = []


class EducationEntry(BaseModel):
    """A single education entry."""
    degree: str = "B.Tech Computer Science"
    institution: str = "University"
    year: Optional[str] = None


class ProjectEntry(BaseModel):
    """A single project entry."""
    name: str = "Project"
    description: str = ""
    tech: list[str] = []


class ResumeExportRequest(BaseModel):
    """Request body for resume export (Markdown / HTML / PDF)."""
    name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    linkedin: Optional[str] = Field(None, description="LinkedIn URL")
    github: Optional[str] = Field(None, description="GitHub URL")
    summary: str = Field("", description="Professional summary")
    skills: list[str] = Field([], description="Technical skills list")
    experience: list[ExperienceEntry] = Field([], description="Work experience")
    education: list[EducationEntry] = Field([], description="Education history")
    projects: list[ProjectEntry] = Field([], description="Notable projects")
    certifications: list[str] = Field([], description="Certifications")

    model_config = {"json_schema_extra": {
        "examples": [{
            "name": "Rishi Sharma",
            "email": "rishi@example.com",
            "phone": "+91 9876543210",
            "summary": "Full-stack developer with 2 years experience.",
            "skills": ["Python", "React", "Docker", "FastAPI"],
            "experience": [{"title": "SDE Intern", "company": "Startup Inc", "duration": "2024-2025", "points": ["Built REST APIs", "Reduced latency by 40%"]}],
            "education": [{"degree": "B.Tech CS", "institution": "IIT Hyderabad", "year": "2025"}],
            "projects": [{"name": "Career Guide AI", "description": "Multi-agent career platform", "tech": ["FastAPI", "React", "OpenAI"]}],
            "certifications": ["AWS Cloud Practitioner"]
        }]
    }}


class MarkdownExportResponse(BaseModel):
    """Response containing exported Markdown."""
    format: str = "markdown"
    content: str


# ═══════════════════════════════════════════════════════════════
# Roadmap
# ═══════════════════════════════════════════════════════════════

class RoadmapTask(BaseModel):
    """A single task within a roadmap week."""
    title: str
    description: str
    estimated_hours: float = 2.0
    priority: str = "medium"
    type: str = "learning"


class RoadmapResource(BaseModel):
    """A learning resource linked to a roadmap task."""
    title: str
    url: str
    type: str = "article"
    skill: str = ""


class RoadmapMiniProject(BaseModel):
    """A mini-project for the week."""
    title: str
    description: str
    skills_used: list[str] = []
    difficulty: str = "intermediate"


class RoadmapMilestone(BaseModel):
    """A milestone to achieve by end of a week."""
    title: str
    description: str
    deliverable: str = ""
    week: int = 0


class RoadmapWeek(BaseModel):
    """A single week in the career roadmap."""
    week_number: int
    theme: str
    phase: str = ""
    learning_objectives: list[str] = []
    tasks: list[RoadmapTask] = []
    resources: list[RoadmapResource] = []
    practice: list[str] = []
    mini_project: Optional[RoadmapMiniProject] = None
    milestone: Optional[RoadmapMilestone] = None
    estimated_hours: float = 0.0


class RoadmapRequest(BaseModel):
    """Request to generate a career roadmap."""
    current_role: str = Field(default="Student", description="User's current role")
    target_role: str = Field(default="Software Engineer", description="Desired target role")
    skill_gaps: list[str] = Field([], description="Skills the user needs to learn")
    hours_per_week: int = Field(default=10, ge=1, le=80, description="Available study hours per week")
    deadline_weeks: int = Field(default=10, ge=1, le=52, description="Total weeks for the roadmap")
    skills: list[str] = Field([], description="User's current skills")

    model_config = {"json_schema_extra": {
        "examples": [{
            "current_role": "Student",
            "target_role": "Data Scientist",
            "skill_gaps": ["Machine Learning", "Statistics", "Deep Learning"],
            "hours_per_week": 15,
            "deadline_weeks": 10,
            "skills": ["Python", "SQL"]
        }]
    }}


class RoadmapResponse(BaseModel):
    """Full roadmap response with week-by-week breakdown."""
    current_role: str
    target_role: str
    total_weeks: int
    hours_per_week: int
    total_estimated_hours: int = 0
    skill_gaps_addressed: list[str] = []
    weeks: list[RoadmapWeek] = []
    summary: str = ""


# ═══════════════════════════════════════════════════════════════
# Resources
# ═══════════════════════════════════════════════════════════════

class ResourceLink(BaseModel):
    """A single resource link (docs, youtube, course, etc.)."""
    title: str
    url: str
    channel: Optional[str] = None
    platform: Optional[str] = None


class ResourceMiniProject(BaseModel):
    """Mini project within a resource entry."""
    title: str
    description: str
    skills_practiced: list[str] = []
    estimated_hours: int = 8


class SkillResource(BaseModel):
    """Complete resource entry for one skill."""
    name: str
    category: str = "General"
    difficulty: str = "intermediate"
    estimated_hours: int = 40
    official_docs: ResourceLink = ResourceLink(title="", url="")
    youtube_playlist: ResourceLink = ResourceLink(title="", url="")
    free_course: ResourceLink = ResourceLink(title="", url="")
    practice_website: ResourceLink = ResourceLink(title="", url="")
    mini_project: ResourceMiniProject = ResourceMiniProject(title="", description="")


class ResourceListResponse(BaseModel):
    """Response listing all available skills."""
    skills: list[str]
    total: int


class ResourceSearchResponse(BaseModel):
    """Response from searching a single skill."""
    found: bool
    query: str
    skill: Optional[dict] = None
    message: Optional[str] = None
    suggestions: Optional[list[str]] = None
    available_skills: Optional[list[str]] = None


class ResourceStatsResponse(BaseModel):
    """Resource library statistics."""
    total_skills: int
    categories: list[str]
    total_categories: int
    difficulty_breakdown: dict
    total_estimated_hours: int
    average_hours_per_skill: float


# ═══════════════════════════════════════════════════════════════
# Career Intelligence Report
# ═══════════════════════════════════════════════════════════════

class CareerReportRequest(BaseModel):
    """Request to generate a Career Intelligence Report."""
    name: str = Field(..., description="Candidate full name")
    current_role: str = Field(..., description="Current job role or status")
    target_role: str = Field(..., description="Target career role")
    skills: list[str] = Field([], description="Current technical skills")
    experience_years: int = Field(0, ge=0, description="Years of professional experience")
    education: Optional[str] = Field(None, description="Highest education level")
    location: Optional[str] = Field(None, description="Current location")

    model_config = {"json_schema_extra": {
        "examples": [{
            "name": "Rishi Sharma",
            "current_role": "Student",
            "target_role": "Data Scientist",
            "skills": ["Python", "SQL", "Machine Learning"],
            "experience_years": 1,
            "education": "B.Tech Computer Science",
            "location": "Hyderabad"
        }]
    }}


class TargetRole(BaseModel):
    """A matched target role with score."""
    title: str
    match: int
    matched_skills: int = 0
    total_required: int = 0
    is_primary: bool = False


class SalaryEstimate(BaseModel):
    """Salary range estimate."""
    currency: str = "INR"
    min: int
    max: int
    median: int


class CareerReportResponse(BaseModel):
    """Full Career Intelligence Report response."""
    name: str
    current_role: str
    target_role: str
    generated_at: str = ""
    candidate_summary: str = ""
    readiness_score: float = Field(0.0, ge=0, le=100)
    readiness_label: str = ""
    strengths: list[str] = []
    weaknesses: list[str] = []
    skill_gaps: list[str] = []
    expected_salary: SalaryEstimate = SalaryEstimate(min=0, max=0, median=0)
    target_roles: list[TargetRole] = []
    roadmap_summary: str = ""
    mentor_advice: str = ""
    certifications: list[str] = []
    hiring_companies: list[str] = []
    overall_recommendation: str = ""
    next_steps: list[str] = []
    market_data: dict = {}


# ═══════════════════════════════════════════════════════════════
# Job Search (kept for compatibility)
# ═══════════════════════════════════════════════════════════════

class JobSearchRequest(BaseModel):
    """Job search query."""
    query: str
    location: Optional[str] = None
    experience_level: Optional[str] = None
    remote: Optional[bool] = None


class CareerAnalysisRequest(BaseModel):
    """Career analysis request."""
    current_role: str
    target_role: str
    skills: list[str] = []
    experience_years: int = 0
    education: Optional[str] = None
    location: Optional[str] = None


class MentorQuestionRequest(BaseModel):
    """Request to ask the AI mentor a career question."""
    question: str
    career_context: Optional[dict] = None


class MentorQuestionResponse(BaseModel):
    """AI mentor answer response."""
    answer: str


# ═══════════════════════════════════════════════════════════════
# Skill Intelligence
# ═══════════════════════════════════════════════════════════════

class SkillNode(BaseModel):
    name: str
    is_gap: bool
    current_level: int
    target_level: int
    market_demand: int
    salary_impact: int
    time_required_hours: int
    category: str
    related_skills: list[str] = []

class SkillIntelligenceRequest(BaseModel):
    current_skills: list[str] = []
    skill_gaps: list[str] = []
    target_role: str = "Software Engineer"
    experience_years: int = 0

