"""
Tests: Report Service
======================
Covers: report generation (all 12 sections), readiness scoring,
        salary estimates, target roles, HTML/PDF export, edge cases.
"""
import pytest
from services.report_service import ReportService


class TestReportGeneration:
    @pytest.mark.asyncio
    async def test_generates_report(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        assert report is not None
        assert report["name"] == "Rishi Sharma"

    @pytest.mark.asyncio
    async def test_has_all_12_sections(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        required = [
            "candidate_summary", "readiness_score", "readiness_label",
            "strengths", "weaknesses", "skill_gaps", "expected_salary",
            "target_roles", "roadmap_summary", "mentor_advice",
            "certifications", "hiring_companies", "overall_recommendation",
        ]
        for key in required:
            assert key in report, f"Missing section: {key}"

    @pytest.mark.asyncio
    async def test_readiness_score_range(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        assert 0 <= report["readiness_score"] <= 100

    @pytest.mark.asyncio
    async def test_readiness_label_valid(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        valid_labels = ["Beginner", "Developing", "Competent", "Proficient", "Expert"]
        assert report["readiness_label"] in valid_labels

    @pytest.mark.asyncio
    async def test_salary_estimate(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        salary = report["expected_salary"]
        assert salary["min"] > 0
        assert salary["max"] > salary["min"]
        assert salary["min"] <= salary["median"] <= salary["max"]

    @pytest.mark.asyncio
    async def test_target_roles_ranked(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        roles = report["target_roles"]
        assert len(roles) > 0
        # Should be sorted by match % descending
        matches = [r["match"] for r in roles]
        assert matches == sorted(matches, reverse=True)

    @pytest.mark.asyncio
    async def test_strengths_not_empty(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        assert len(report["strengths"]) > 0

    @pytest.mark.asyncio
    async def test_certifications_present(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        assert len(report["certifications"]) > 0

    @pytest.mark.asyncio
    async def test_hiring_companies_present(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        assert len(report["hiring_companies"]) > 0

    @pytest.mark.asyncio
    async def test_next_steps_generated(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        assert len(report.get("next_steps", [])) > 0


class TestReportEdgeCases:
    @pytest.mark.asyncio
    async def test_no_skills(self, report_service):
        data = {
            "name": "Empty User", "current_role": "Student",
            "target_role": "Software Engineer", "skills": [],
            "experience_years": 0, "education": None, "location": None,
        }
        report = await report_service.generate_report(data)
        assert report["readiness_score"] <= 30  # Low readiness
        assert len(report["skill_gaps"]) > 0

    @pytest.mark.asyncio
    async def test_experienced_user(self, report_service):
        data = {
            "name": "Expert Dev", "current_role": "Senior Engineer",
            "target_role": "Backend Developer",
            "skills": ["Python", "FastAPI", "SQL", "Docker", "System Design", "Testing"],
            "experience_years": 8, "education": "MS CS", "location": "Bangalore",
        }
        report = await report_service.generate_report(data)
        assert report["readiness_score"] >= 70

    @pytest.mark.asyncio
    async def test_unknown_target_role(self, report_service):
        data = {
            "name": "User", "current_role": "Student",
            "target_role": "Blockchain Artisan",
            "skills": ["Python"], "experience_years": 0,
        }
        report = await report_service.generate_report(data)
        assert report is not None  # Should still work with defaults


class TestReportScoreLabels:
    def test_beginner_label(self, report_service):
        assert report_service._score_to_label(20) == "Beginner"

    def test_developing_label(self, report_service):
        assert report_service._score_to_label(40) == "Developing"

    def test_competent_label(self, report_service):
        assert report_service._score_to_label(60) == "Competent"

    def test_proficient_label(self, report_service):
        assert report_service._score_to_label(75) == "Proficient"

    def test_expert_label(self, report_service):
        assert report_service._score_to_label(90) == "Expert"


class TestReportHTML:
    @pytest.mark.asyncio
    async def test_render_html(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        html = report_service.render_html(report)
        assert "<html" in html.lower()
        assert "Rishi Sharma" in html

    @pytest.mark.asyncio
    async def test_report_html_included(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        assert "report_html" in report
        assert len(report["report_html"]) > 100


class TestReportPDF:
    @pytest.mark.asyncio
    async def test_render_pdf(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        pdf = report_service.render_pdf(report)
        assert isinstance(pdf, bytes)
        assert len(pdf) > 0

    @pytest.mark.asyncio
    async def test_pdf_is_valid(self, report_service, sample_report_data):
        report = await report_service.generate_report(sample_report_data)
        pdf = report_service.render_pdf(report)
        assert pdf[:5] == b"%PDF-"
