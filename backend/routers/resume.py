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
    ResumeExtractionResponse,
    ReparseRequest,
)
import base64
from agents.resume_agent import ResumeAgent
from utils.dependencies import get_resume_agent, get_llm
from services.resume_extraction import ResumeExtractionService
from services.llm_service import LLMService

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

# ─── POST /resume/upload ─────────────────────────────────────
@router.post(
    "/upload",
    response_model=ResumeExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract text from an uploaded resume (Multi-format)",
)
async def upload_resume(
    file: UploadFile = File(...),
    llm: LLMService = Depends(get_llm),
):
    if not file.filename:
        return Response(content='{"error": "No file uploaded"}', status_code=400, media_type="application/json")
    
    try:
        content = await file.read()
        extractor = ResumeExtractionService(llm_service=llm)
        result = await extractor.extract(content, file.filename)
        return result
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
    response_model=ResumeExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract text from a base64 encoded resume (Multi-format)",
)
async def upload_resume_base64(
    data: ResumeUploadBase64Request,
    llm: LLMService = Depends(get_llm),
):
    try:
        content = base64.b64decode(data.content_base64)
        extractor = ResumeExtractionService(llm_service=llm)
        result = await extractor.extract(content, data.filename)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"B64 ERROR: {e}")
        return Response(content=f'{{"error": "Failed to parse base64 file: {str(e)}"}}', status_code=400, media_type="application/json")


# ─── POST /resume/upload/reparse ─────────────────────────────

@router.post(
    "/upload/reparse",
    status_code=status.HTTP_200_OK,
    summary="Re-run structured extraction on user-edited text",
)
async def reparse_resume_text(
    data: ReparseRequest,
    llm: LLMService = Depends(get_llm),
):
    try:
        extractor = ResumeExtractionService(llm_service=llm)
        structured = await extractor.extract_structured(data.text)
        
        return {
            "text": data.text,
            "structured": structured,
        }
    except Exception as e:
        return Response(content=f'{{"error": "Failed to reparse text: {str(e)}"}}', status_code=400, media_type="application/json")


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
