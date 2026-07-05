"""
Tests: API Endpoints
=====================
Integration tests for all FastAPI routes.
Covers: status codes, response shapes, validation errors,
        edge cases, invalid inputs.
"""
import pytest
from fastapi.testclient import TestClient
from app import app


@pytest.fixture
def client():
    return TestClient(app)


# ═══════════════════════════════════════════════════════════════
# SYSTEM ENDPOINTS
# ═══════════════════════════════════════════════════════════════

class TestSystemEndpoints:
    def test_root(self, client):
        r = client.get("/")
        assert r.status_code == 200
        data = r.json()
        assert "name" in data
        assert "endpoints" in data

    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"

    def test_docs_page(self, client):
        r = client.get("/docs")
        assert r.status_code == 200

    def test_openapi_schema(self, client):
        r = client.get("/openapi.json")
        assert r.status_code == 200
        assert "paths" in r.json()


# ═══════════════════════════════════════════════════════════════
# RESUME ENDPOINTS
# ═══════════════════════════════════════════════════════════════

class TestResumeEndpoints:
    def test_analyze_success(self, client, sample_resume_text):
        r = client.post("/api/v1/resume/analyze", json={
            "resume_text": sample_resume_text,
            "target_role": "Backend Developer",
        })
        assert r.status_code == 200
        data = r.json()
        assert "extracted_skills" in data

    def test_analyze_validation_error(self, client):
        r = client.post("/api/v1/resume/analyze", json={
            "resume_text": "short",  # Too short (min 50 chars)
            "target_role": "Developer",
        })
        assert r.status_code == 422  # Pydantic validation

    def test_analyze_missing_body(self, client):
        r = client.post("/api/v1/resume/analyze")
        assert r.status_code == 422

    def test_export_markdown(self, client, sample_export_data):
        r = client.post("/api/v1/resume/export/markdown", json=sample_export_data)
        assert r.status_code == 200
        data = r.json()
        assert data["format"] == "markdown"
        assert len(data["content"]) > 0

    def test_export_html(self, client, sample_export_data):
        r = client.post("/api/v1/resume/export/html", json=sample_export_data)
        assert r.status_code == 200
        assert "text/html" in r.headers["content-type"]

    def test_export_pdf(self, client, sample_export_data):
        r = client.post("/api/v1/resume/export/pdf", json=sample_export_data)
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"

    def test_export_missing_name(self, client):
        r = client.post("/api/v1/resume/export/markdown", json={
            "email": "test@test.com"
        })
        assert r.status_code == 422  # name is required

    def test_export_missing_email(self, client):
        r = client.post("/api/v1/resume/export/markdown", json={
            "name": "Test User"
        })
        assert r.status_code == 422  # email is required


# ═══════════════════════════════════════════════════════════════
# ROADMAP ENDPOINTS
# ═══════════════════════════════════════════════════════════════

class TestRoadmapEndpoints:
    def test_generate_roadmap(self, client):
        r = client.post("/api/v1/roadmap", json={
            "current_role": "Student",
            "target_role": "Data Scientist",
            "skill_gaps": ["Machine Learning", "Statistics"],
            "hours_per_week": 15,
            "deadline_weeks": 10,
        })
        assert r.status_code == 201
        data = r.json()
        assert "weeks" in data
        assert len(data["weeks"]) == 10

    def test_roadmap_defaults(self, client):
        r = client.post("/api/v1/roadmap", json={})
        assert r.status_code == 201
        data = r.json()
        assert "weeks" in data

    def test_roadmap_invalid_hours(self, client):
        r = client.post("/api/v1/roadmap", json={
            "hours_per_week": -5,  # Below Field(ge=1)
        })
        assert r.status_code == 422

    def test_roadmap_invalid_weeks(self, client):
        r = client.post("/api/v1/roadmap", json={
            "deadline_weeks": 100,  # Above Field(le=52)
        })
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════
# RESOURCES ENDPOINTS
# ═══════════════════════════════════════════════════════════════

class TestResourceEndpoints:
    def test_list_all(self, client):
        r = client.get("/api/v1/resources")
        assert r.status_code == 200
        data = r.json()
        assert data["total"] >= 15
        assert len(data["skills"]) >= 15

    def test_get_skill_found(self, client):
        r = client.get("/api/v1/resources/python")
        assert r.status_code == 200
        assert r.json()["found"] is True

    def test_get_skill_not_found(self, client):
        r = client.get("/api/v1/resources/nonexistent_xyz_123")
        assert r.status_code == 200
        assert r.json()["found"] is False

    def test_get_skill_case_insensitive(self, client):
        r = client.get("/api/v1/resources/PYTHON")
        assert r.status_code == 200
        assert r.json()["found"] is True

    def test_stats(self, client):
        r = client.get("/api/v1/resources/meta/stats")
        assert r.status_code == 200
        data = r.json()
        assert "total_skills" in data
        assert "difficulty_breakdown" in data

    def test_categories(self, client):
        r = client.get("/api/v1/resources/meta/categories")
        assert r.status_code == 200
        assert len(r.json()["categories"]) > 0

    def test_multi_skill(self, client):
        r = client.get("/api/v1/resources/meta/multi", params={"skills": "Python,SQL"})
        assert r.status_code == 200
        assert r.json()["count"] == 2

    def test_recommend(self, client):
        r = client.get("/api/v1/resources/meta/recommend", params={
            "known": "Python", "limit": "3"
        })
        assert r.status_code == 200
        assert len(r.json()["recommendations"]) <= 3


# ═══════════════════════════════════════════════════════════════
# REPORT ENDPOINTS
# ═══════════════════════════════════════════════════════════════

class TestReportEndpoints:
    def test_generate_report(self, client, sample_report_data):
        r = client.post("/api/v1/report", json=sample_report_data)
        assert r.status_code == 201
        data = r.json()
        assert "readiness_score" in data
        assert "strengths" in data
        assert "skill_gaps" in data

    def test_report_html_after_generate(self, client, sample_report_data):
        client.post("/api/v1/report", json=sample_report_data)
        r = client.get("/api/v1/report/html")
        assert r.status_code == 200
        assert "text/html" in r.headers["content-type"]

    def test_report_pdf_after_generate(self, client, sample_report_data):
        client.post("/api/v1/report", json=sample_report_data)
        r = client.get("/api/v1/report/pdf")
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"

    def test_report_missing_name(self, client):
        r = client.post("/api/v1/report", json={
            "current_role": "Student",
            "target_role": "Engineer",
        })
        assert r.status_code == 422  # name is required

    def test_report_missing_roles(self, client):
        r = client.post("/api/v1/report", json={"name": "Test"})
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════
# EDGE CASES — INVALID METHODS & PATHS
# ═══════════════════════════════════════════════════════════════

class TestEdgeCases:
    def test_wrong_method_on_roadmap(self, client):
        r = client.get("/api/v1/roadmap")  # Should be POST
        assert r.status_code == 405

    def test_wrong_method_on_resume(self, client):
        r = client.get("/api/v1/resume/analyze")  # Should be POST
        assert r.status_code == 405

    def test_nonexistent_endpoint(self, client):
        r = client.get("/api/v1/this/does/not/exist")
        assert r.status_code == 404

    def test_empty_body_on_post(self, client):
        r = client.post("/api/v1/resume/analyze",
                        content="", headers={"content-type": "application/json"})
        assert r.status_code == 422

    def test_invalid_json_body(self, client):
        r = client.post("/api/v1/roadmap",
                        content="NOT JSON", headers={"content-type": "application/json"})
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════
# MENTOR ENDPOINTS
# ═══════════════════════════════════════════════════════════════

class TestMentorEndpoints:
    def test_ask_mentor_success(self, client):
        r = client.post("/api/v1/mentor", json={
            "question": "How do I build a portfolio project?",
            "career_context": {
                "name": "Alice",
                "current_role": "Student",
                "target_role": "Software Engineer",
                "skills": ["Python", "Git"],
                "experience_years": 0,
                "location": "India"
            }
        })
        assert r.status_code == 200
        data = r.json()
        assert "answer" in data
        assert len(data["answer"]) > 0

    def test_ask_mentor_validation_error(self, client):
        r = client.post("/api/v1/mentor", json={})
        assert r.status_code == 422  # question is required

