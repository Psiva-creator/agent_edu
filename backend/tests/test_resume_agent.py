"""
Tests: Resume Agent
====================
Covers: analysis, skill extraction, readiness scoring, career path,
        ATS suggestions, markdown/html/pdf export, edge cases.
"""
import pytest
from agents.resume_agent import ResumeAgent


class TestResumeAnalysis:
    @pytest.mark.asyncio
    async def test_analyze_returns_skills(self, resume_agent, sample_resume_text):
        result = await resume_agent.analyze_resume(sample_resume_text, "Backend Developer")
        assert "extracted_skills" in result
        assert len(result["extracted_skills"]) > 0

    @pytest.mark.asyncio
    async def test_analyze_returns_missing_skills(self, resume_agent, sample_resume_text):
        result = await resume_agent.analyze_resume(sample_resume_text, "Backend Developer")
        assert "missing_skills" in result

    @pytest.mark.asyncio
    async def test_analyze_returns_readiness_score(self, resume_agent, sample_resume_text):
        result = await resume_agent.analyze_resume(sample_resume_text, "Backend Developer")
        assert "readiness_score" in result
        assert 0 <= result["readiness_score"] <= 100

    @pytest.mark.asyncio
    async def test_analyze_returns_career_path(self, resume_agent, sample_resume_text):
        result = await resume_agent.analyze_resume(sample_resume_text, "Backend Developer")
        assert "career_path" in result
        assert len(result["career_path"]) > 0

    @pytest.mark.asyncio
    async def test_analyze_returns_ats_suggestions(self, resume_agent, sample_resume_text):
        result = await resume_agent.analyze_resume(sample_resume_text, "Backend Developer")
        assert "ats_suggestions" in result

    @pytest.mark.asyncio
    async def test_analyze_returns_summary(self, resume_agent, sample_resume_text):
        result = await resume_agent.analyze_resume(sample_resume_text, "Backend Developer")
        assert "summary" in result
        assert len(result["summary"]) > 0

    @pytest.mark.asyncio
    async def test_analyze_different_roles(self, resume_agent, sample_resume_text):
        for role in ["Data Scientist", "Frontend Developer", "DevOps Engineer"]:
            result = await resume_agent.analyze_resume(sample_resume_text, role)
            assert result.get("target_role") == role


class TestResumeEdgeCases:
    @pytest.mark.asyncio
    async def test_empty_resume(self, resume_agent):
        result = await resume_agent.analyze_resume("", "Backend Developer")
        assert "error" in result

    @pytest.mark.asyncio
    async def test_whitespace_resume(self, resume_agent):
        result = await resume_agent.analyze_resume("   ", "Backend Developer")
        assert "error" in result

    @pytest.mark.asyncio
    async def test_minimal_resume(self, resume_agent):
        result = await resume_agent.analyze_resume(
            "John Doe. Student. Knows Python. Looking for a job.",
            "Software Engineer",
        )
        assert "extracted_skills" in result
        assert "Python" in result["extracted_skills"]

    @pytest.mark.asyncio
    async def test_no_skills_resume(self, resume_agent):
        result = await resume_agent.analyze_resume(
            "This is a resume with no recognizable technical skills mentioned at all. "
            "I enjoy hiking and reading novels. I have a degree in art history.",
            "Software Engineer",
        )
        assert "readiness_score" in result
        assert result["readiness_score"] <= 30  # Should be low

    @pytest.mark.asyncio
    async def test_highly_skilled_resume(self, resume_agent):
        text = (
            "Senior engineer with 8 years experience. "
            "Expert in Python, JavaScript, React, Node.js, Docker, Kubernetes, "
            "AWS, SQL, Git, CI/CD, Machine Learning, TensorFlow, REST API, "
            "Microservices, Linux, Redis, MongoDB, GraphQL, System Design, Agile. "
            "Led teams, delivered projects, increased revenue. "
            "Education: MS Computer Science from Stanford."
        )
        result = await resume_agent.analyze_resume(text, "Software Engineer")
        assert result["readiness_score"] >= 60

    @pytest.mark.asyncio
    async def test_unknown_target_role(self, resume_agent, sample_resume_text):
        result = await resume_agent.analyze_resume(sample_resume_text, "Space Cowboy")
        assert "extracted_skills" in result  # Should still work


class TestResumeSkillExtraction:
    @pytest.mark.asyncio
    async def test_extracts_python(self, resume_agent):
        result = await resume_agent.analyze_resume(
            "I have 3 years of Python experience building web applications.",
            "Backend Developer",
        )
        skills = [s.lower() for s in result.get("extracted_skills", [])]
        assert "python" in skills

    @pytest.mark.asyncio
    async def test_extracts_multiple_skills(self, resume_agent):
        result = await resume_agent.analyze_resume(
            "Experienced with Python, Docker, SQL, React, and AWS. "
            "Used Git for version control and built REST APIs.",
            "Full Stack Developer",
        )
        skills = [s.lower() for s in result.get("extracted_skills", [])]
        assert "python" in skills
        assert "docker" in skills
        assert "sql" in skills


class TestResumeExportMarkdown:
    def test_markdown_contains_name(self, resume_agent, sample_export_data):
        md = resume_agent.generate_markdown(sample_export_data)
        assert "Rishi Sharma" in md

    def test_markdown_contains_skills(self, resume_agent, sample_export_data):
        md = resume_agent.generate_markdown(sample_export_data)
        assert "Python" in md

    def test_markdown_contains_sections(self, resume_agent, sample_export_data):
        md = resume_agent.generate_markdown(sample_export_data)
        assert "#" in md  # Has headings

    def test_markdown_empty_data(self, resume_agent):
        md = resume_agent.generate_markdown({"name": "Test", "email": "t@t.com"})
        assert "Test" in md


class TestResumeExportHTML:
    def test_html_is_valid(self, resume_agent, sample_export_data):
        html = resume_agent.render_html(sample_export_data)
        assert "<html" in html.lower() or "<div" in html.lower()

    def test_html_contains_name(self, resume_agent, sample_export_data):
        html = resume_agent.render_html(sample_export_data)
        assert "Rishi Sharma" in html

    def test_html_contains_styles(self, resume_agent, sample_export_data):
        html = resume_agent.render_html(sample_export_data)
        assert "<style" in html.lower() or "style=" in html.lower()


class TestResumeExportPDF:
    def test_pdf_returns_bytes(self, resume_agent, sample_export_data):
        pdf = resume_agent.render_pdf(sample_export_data)
        assert isinstance(pdf, bytes)
        assert len(pdf) > 0

    def test_pdf_starts_with_marker(self, resume_agent, sample_export_data):
        pdf = resume_agent.render_pdf(sample_export_data)
        assert pdf[:5] == b"%PDF-"

    def test_pdf_empty_data(self, resume_agent):
        pdf = resume_agent.render_pdf({"name": "Min", "email": "m@m.com"})
        assert isinstance(pdf, bytes)
