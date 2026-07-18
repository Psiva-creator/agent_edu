"""
Utility: Dependency Injection
FastAPI dependencies for injecting services into route handlers.
Uses singletons for services and fresh instances for agents.
"""

from config import get_settings, Settings
from services.llm_service import LLMService
from services.resource_service import ResourceService
from services.report_service import ReportService
from agents.roadmap_agent import RoadmapAgent
from agents.resume_agent import ResumeAgent


# ─── Settings ─────────────────────────────────────────────────

def get_config() -> Settings:
    """Inject application settings."""
    return get_settings()


# ─── Services (singletons) ───────────────────────────────────

_llm_service: LLMService | None = None
_resource_service: ResourceService | None = None
_report_service: ReportService | None = None


def get_llm() -> LLMService:
    """Inject LLM service singleton."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


def get_resources() -> ResourceService:
    """Inject Resource service singleton."""
    global _resource_service
    if _resource_service is None:
        _resource_service = ResourceService()
    return _resource_service


def get_report() -> ReportService:
    """Inject Report service singleton."""
    global _report_service
    if _report_service is None:
        _report_service = ReportService(llm_service=get_llm())
    return _report_service


# ─── Agents (new per-request) ─────────────────────────────────

def get_roadmap_agent() -> RoadmapAgent:
    """Inject Roadmap agent with shared services."""
    return RoadmapAgent(
        llm_service=get_llm(),
        resource_service=get_resources(),
    )


def get_resume_agent() -> ResumeAgent:
    """Inject Resume agent."""
    return ResumeAgent()


def get_mentor_agent():
    """Inject Mentor agent with shared LLM service."""
    from agents.mentor_agent import MentorAgent
    return MentorAgent(llm_service=get_llm())

def get_job_agent():
    """Inject Job agent with shared LLM service."""
    from agents.job_agent import JobAgent
    return JobAgent(llm_service=get_llm())

def get_cover_letter_agent():
    """Inject Cover Letter agent with shared LLM service."""
    from agents.cover_letter_agent import CoverLetterAgent
    return CoverLetterAgent()
