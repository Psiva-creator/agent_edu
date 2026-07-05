"""
Shared pytest fixtures for Career Guide AI test suite.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app import app
from services.llm_service import LLMService, LLMResponse, LRUCache, RetryConfig
from services.resource_service import ResourceService
from services.report_service import ReportService
from agents.resume_agent import ResumeAgent
from agents.roadmap_agent import RoadmapAgent


# ─── App / Client ─────────────────────────────────────────────

@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


# ─── Mock LLM Service ────────────────────────────────────────

@pytest.fixture
def mock_llm():
    """LLM service with no API key (fallback mode)."""
    svc = LLMService()
    assert svc.is_available is False
    return svc


@pytest.fixture
def mock_llm_available():
    """LLM service mocked to appear available with controlled responses."""
    svc = LLMService()
    svc.client = MagicMock()  # Fake OpenAI client
    return svc


# ─── Services ─────────────────────────────────────────────────

@pytest.fixture
def resource_service():
    """Real resource service (loads resources.json)."""
    return ResourceService()


@pytest.fixture
def report_service(mock_llm):
    """Report service in fallback mode."""
    return ReportService(llm_service=mock_llm)


# ─── Agents ───────────────────────────────────────────────────

@pytest.fixture
def resume_agent(mock_llm):
    """Resume agent in fallback mode."""
    return ResumeAgent(llm_service=mock_llm)


@pytest.fixture
def roadmap_agent(mock_llm, resource_service):
    """Roadmap agent in fallback mode."""
    return RoadmapAgent(llm_service=mock_llm, resource_service=resource_service)


# ─── Sample Data ──────────────────────────────────────────────

@pytest.fixture
def sample_resume_text():
    return (
        "Rishi Sharma. B.Tech Computer Science from IIT Hyderabad. "
        "2 years experience as Python Developer at TechCorp. "
        "Skills: Python, SQL, FastAPI, Docker, Git, REST APIs, Machine Learning. "
        "Built a recommendation engine improving CTR by 25%. "
        "Developed microservices handling 10K RPS. "
        "Led a team of 3 engineers in a startup environment. "
        "Proficient in Agile methodology. "
        "Projects: Career Guide AI using React and Node.js."
    )


@pytest.fixture
def sample_export_data():
    return {
        "name": "Rishi Sharma",
        "email": "rishi@example.com",
        "phone": "+91 9876543210",
        "linkedin": "linkedin.com/in/rishi",
        "github": "github.com/rishi",
        "summary": "Full-stack developer with 2 years experience.",
        "skills": ["Python", "FastAPI", "Docker", "SQL"],
        "experience": [
            {"title": "SDE", "company": "TechCorp", "duration": "2023-2025",
             "points": ["Built REST APIs", "Reduced latency by 40%"]}
        ],
        "education": [
            {"degree": "B.Tech CS", "institution": "IIT Hyderabad", "year": "2025"}
        ],
        "projects": [
            {"name": "Career Guide AI", "description": "Multi-agent platform",
             "tech": ["FastAPI", "React"]}
        ],
        "certifications": ["AWS Cloud Practitioner"],
    }


@pytest.fixture
def sample_report_data():
    return {
        "name": "Rishi Sharma",
        "current_role": "Student",
        "target_role": "Data Scientist",
        "skills": ["Python", "SQL", "Machine Learning"],
        "experience_years": 1,
        "education": "B.Tech CS",
        "location": "Hyderabad",
    }
