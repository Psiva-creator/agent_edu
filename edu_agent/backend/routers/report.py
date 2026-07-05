"""
Router: Career Intelligence Report
====================================
POST /report       — Generate a full career intelligence report (JSON)
GET  /report/html  — Preview the last generated report as styled HTML
GET  /report/pdf   — Download the last generated report as PDF
"""

import asyncio
from fastapi import APIRouter, Depends, Response, status
from fastapi.responses import HTMLResponse

from schemas.models import CareerReportRequest, CareerReportResponse, ErrorResponse
from services.report_service import ReportService
from utils.dependencies import get_report

router = APIRouter(prefix="/report", tags=["Report"])

# ─── In-memory cache for the last generated report ───────────
# Allows GET /report/html and GET /report/pdf after POST /report
_last_report: dict | None = None


# ─── POST /report ────────────────────────────────────────────

@router.post(
    "",
    response_model=CareerReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a Career Intelligence Report",
    description=(
        "Generate a comprehensive one-page Career Intelligence Report "
        "with 12 sections: candidate summary, readiness score, strengths, "
        "weaknesses, skill gaps, salary estimate, target roles, roadmap "
        "summary, mentor advice, certifications, hiring companies, and "
        "overall recommendation. The report is cached for subsequent "
        "HTML/PDF retrieval via GET endpoints."
    ),
    responses={
        201: {"description": "Report generated successfully"},
        422: {"description": "Validation error"},
    },
)
async def generate_report(
    data: CareerReportRequest,
    svc: ReportService = Depends(get_report),
):
    global _last_report
    report = await svc.generate_report(data.model_dump())
    _last_report = report

    # Return JSON without bulky HTML blob
    return {k: v for k, v in report.items() if k != "report_html"}


# ─── GET /report/html ────────────────────────────────────────

@router.get(
    "/html",
    response_class=HTMLResponse,
    status_code=status.HTTP_200_OK,
    summary="Preview report as HTML",
    description=(
        "Returns the last generated Career Intelligence Report as a "
        "professionally styled HTML page rendered via Jinja2 template. "
        "Must call POST /report first to generate a report."
    ),
    responses={
        200: {"content": {"text/html": {}}, "description": "HTML report rendered"},
        404: {"model": ErrorResponse, "description": "No report generated yet"},
    },
)
async def get_report_html(
    svc: ReportService = Depends(get_report),
):
    global _last_report
    if _last_report is None:
        # Gracefully generate a default report for demo resilience
        default_data = {
            "name": "Jane Doe",
            "current_role": "CS Student",
            "target_role": "Backend Engineer",
            "skills": ["Python", "SQL", "Git"],
            "experience_years": 0,
            "education": "B.Tech in Computer Science",
            "location": "India",
        }
        _last_report = await svc.generate_report(default_data)

    html = _last_report.get("report_html", "")
    if not html:
        html = svc.render_html(_last_report)

    return HTMLResponse(content=html, status_code=status.HTTP_200_OK)


# ─── GET /report/pdf ─────────────────────────────────────────

@router.get(
    "/pdf",
    status_code=status.HTTP_200_OK,
    summary="Download report as PDF",
    description=(
        "Downloads the last generated Career Intelligence Report as a "
        "professional PDF document using xhtml2pdf. "
        "Must call POST /report first to generate a report."
    ),
    responses={
        200: {"content": {"application/pdf": {}}, "description": "PDF report downloaded"},
        404: {"model": ErrorResponse, "description": "No report generated yet"},
        500: {"model": ErrorResponse, "description": "PDF generation failed"},
    },
)
async def get_report_pdf(
    svc: ReportService = Depends(get_report),
):
    global _last_report
    if _last_report is None:
        # Gracefully generate a default report for demo resilience
        default_data = {
            "name": "Jane Doe",
            "current_role": "CS Student",
            "target_role": "Backend Engineer",
            "skills": ["Python", "SQL", "Git"],
            "experience_years": 0,
            "education": "B.Tech in Computer Science",
            "location": "India",
        }
        _last_report = await svc.generate_report(default_data)

    pdf_bytes = await asyncio.to_thread(svc.render_pdf, _last_report)

    if not pdf_bytes:
        return Response(
            content='{"error": "PDF generation failed. Ensure xhtml2pdf is installed.", "status_code": 500}',
            media_type="application/json",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    name = _last_report.get("name", "career").replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        status_code=status.HTTP_200_OK,
        headers={
            "Content-Disposition": f'attachment; filename="{name}_career_report.pdf"'
        },
    )
