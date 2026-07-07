"""
Router: Resume
===============
POST /resume/analyze          — Analyze resume text, extract skills, score readiness
POST /resume/export/markdown  — Export resume as Markdown
POST /resume/export/html      — Export resume as styled HTML (Jinja2)
POST /resume/export/pdf       — Export resume as downloadable PDF (xhtml2pdf)
"""

import asyncio
from fastapi import APIRouter, Depends, UploadFile, File, Form, Response, status
from fastapi.responses import HTMLResponse

from schemas.models import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    ResumeExportRequest,
    MarkdownExportResponse,
    ResumeRewriteRequest,
    ResumeRewriteResponse,
    ProjectEnhanceRequest,
    ProjectEnhanceResponse,
    ErrorResponse,
    ResumeUploadBase64Request,
)
import base64
from agents.resume_agent import ResumeAgent
from utils.dependencies import get_resume_agent

router = APIRouter(prefix="/resume", tags=["Resume"])


# ─── POST /resume/analyze ────────────────────────────────────

@router.post(
    "/analyze",
    response_model=ResumeAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze a resume",
    description=(
        "Submit resume text and target role. Returns extracted skills, "
        "missing skills, readiness score (0–100), career path matches, "
        "strengths, improvements, ATS suggestions, and a summary."
    ),
    responses={
        200: {"description": "Resume analyzed successfully"},
        400: {"model": ErrorResponse, "description": "Empty resume text"},
        422: {"description": "Validation error"},
    },
)
async def analyze_resume(
    data: ResumeAnalysisRequest,
    agent: ResumeAgent = Depends(get_resume_agent),
):
    result = await agent.analyze_resume(data.resume_text, data.target_role)

    if "error" in result:
        return Response(
            content=f'{{"error": "{result["error"]}", "status_code": 400}}',
            media_type="application/json",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    return result

import io
from pypdf import PdfReader


def _extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """
    Robust PDF text extraction.
    Strategy:
      1. Try pdfplumber (best for complex layouts, tables, columns)
      2. Fallback to pypdf (fast, good for simple text PDFs)
      3. Fallback to pdfminer.six high-level API
    Returns extracted text or empty string.
    """
    text = ""

    # ── Strategy 1: pdfplumber (best overall) ──
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        if text.strip():
            return text.strip()
    except Exception:
        pass  # fall through

    # ── Strategy 2: pypdf ──
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        if text.strip():
            return text.strip()
    except Exception:
        pass  # fall through

    # ── Strategy 3: pdfminer high-level ──
    try:
        from pdfminer.high_level import extract_text as pdfminer_extract
        text = pdfminer_extract(io.BytesIO(pdf_bytes))
        if text and text.strip():
            return text.strip()
    except Exception:
        pass

    return text.strip()


# ─── POST /resume/upload ─────────────────────────────────────
@router.post(
    "/upload",
    status_code=status.HTTP_200_OK,
    summary="Extract text from an uploaded resume (PDF/TXT)",
)
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename:
        return Response(content='{"error": "No file uploaded"}', status_code=400, media_type="application/json")
    
    try:
        content = await file.read()
        text = ""
        
        if file.filename.lower().endswith(".pdf"):
            text = _extract_text_from_pdf_bytes(content)
        else:
            # Assume text/plain
            text = content.decode("utf-8", errors="replace")
            
        return {"text": text.strip()}
    except Exception as e:
        return Response(content=f'{{"error": "Failed to parse file: {str(e)}"}}', status_code=400, media_type="application/json")


# ─── POST /resume/rewrite ────────────────────────────

@router.post(
    "/rewrite",
    response_model=ResumeRewriteResponse,
    status_code=status.HTTP_200_OK,
    summary="Rewrite weak resume bullets",
    description="Extracts and rewrites weak bullet points from the resume, providing ATS and impact improvements.",
)
async def rewrite_resume(
    data: ResumeRewriteRequest,
    agent: ResumeAgent = Depends(get_resume_agent),
):
    result = await agent.rewrite_resume_bullets(data.resume_text, data.target_role)
    return result

@router.post(
    "/upload/base64",
    status_code=status.HTTP_200_OK,
    summary="Extract text from a base64 encoded resume (PDF/TXT) to bypass Vercel form-data corruption",
)
async def upload_resume_base64(data: ResumeUploadBase64Request):
    try:
        content = base64.b64decode(data.content_base64)
        text = ""
        
        if data.filename.lower().endswith(".pdf"):
            text = _extract_text_from_pdf_bytes(content)
        else:
            text = content.decode("utf-8", errors="replace")
            
        return {"text": text.strip()}
    except Exception as e:
        return Response(content=f'{{"error": "Failed to parse base64 file: {str(e)}"}}', status_code=400, media_type="application/json")


# ─── POST /resume/enhance-project ────────────────────────────

@router.post(
    "/enhance-project",
    response_model=ProjectEnhanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Enhance a project description",
    description="Rewrite a project description to be professional, ATS-friendly, and impactful using action verbs.",
)
async def enhance_project(
    data: ProjectEnhanceRequest,
    agent: ResumeAgent = Depends(get_resume_agent),
):
    enhanced = await agent.enhance_project_description(data.description)
    return {"enhanced_description": enhanced}


# ─── POST /resume/export/markdown ────────────────────────────

@router.post(
    "/export/markdown",
    response_model=MarkdownExportResponse,
    status_code=status.HTTP_200_OK,
    summary="Export resume as Markdown",
    description="Generate a professional resume in Markdown format from structured data.",
    responses={
        200: {"description": "Markdown resume generated"},
        422: {"description": "Validation error"},
    },
)
async def export_markdown(
    data: ResumeExportRequest,
    agent: ResumeAgent = Depends(get_resume_agent),
):
    md = agent.generate_markdown(data.model_dump())
    return {"format": "markdown", "content": md}


# ─── POST /resume/export/html ────────────────────────────────

@router.post(
    "/export/html",
    response_class=HTMLResponse,
    status_code=status.HTTP_200_OK,
    summary="Export resume as HTML",
    description=(
        "Generate a professionally styled HTML resume using Jinja2 templates. "
        "Returns a full HTML document suitable for browser display or printing."
    ),
    responses={
        200: {"content": {"text/html": {}}, "description": "HTML resume generated"},
        422: {"description": "Validation error"},
    },
)
async def export_html(
    data: ResumeExportRequest,
    agent: ResumeAgent = Depends(get_resume_agent),
):
    html = agent.render_html(data.model_dump())
    return HTMLResponse(content=html, status_code=status.HTTP_200_OK)


# ─── POST /resume/export/pdf ─────────────────────────────────

@router.post(
    "/export/pdf",
    status_code=status.HTTP_200_OK,
    summary="Export resume as PDF",
    description=(
        "Generate a professional PDF resume using the Jinja2 → xhtml2pdf pipeline. "
        "Returns a downloadable PDF file."
    ),
    responses={
        200: {"content": {"application/pdf": {}}, "description": "PDF resume generated"},
        500: {"model": ErrorResponse, "description": "PDF generation failed"},
        422: {"description": "Validation error"},
    },
)
async def export_pdf(
    data: ResumeExportRequest,
    agent: ResumeAgent = Depends(get_resume_agent),
):
    pdf_bytes = await asyncio.to_thread(agent.render_pdf, data.model_dump())

    if not pdf_bytes:
        return Response(
            content='{"error": "PDF generation failed. Ensure xhtml2pdf is installed.", "status_code": 500}',
            media_type="application/json",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    filename = data.name.replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        status_code=status.HTTP_200_OK,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}_resume.pdf"'
        },
    )
