import asyncio
from fastapi import APIRouter, Depends, Response, status
from schemas.models import CoverLetterRequest, CoverLetterResponse, CoverLetterExportRequest
from agents.cover_letter_agent import CoverLetterAgent
from utils.dependencies import get_cover_letter_agent

router = APIRouter(prefix="/cover-letter", tags=["Cover Letter"])

@router.post(
    "/generate",
    response_model=CoverLetterResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Cover Letter",
    description="Generates a personalized cover letter based on user memory and tone.",
)
async def generate_cover_letter(
    data: CoverLetterRequest,
    agent: CoverLetterAgent = Depends(get_cover_letter_agent)
):
    result = await agent.generate_cover_letter(data.model_dump())
    return result

@router.post(
    "/export/pdf",
    status_code=status.HTTP_200_OK,
    summary="Export Cover Letter as PDF",
)
async def export_pdf(
    data: CoverLetterExportRequest,
    agent: CoverLetterAgent = Depends(get_cover_letter_agent)
):
    pdf_bytes = await asyncio.to_thread(agent.generate_pdf, data.name, data.paragraphs)
    
    if not pdf_bytes:
        return Response(
            content='{"error": "PDF generation failed."}',
            media_type="application/json",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    filename = data.name.replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        status_code=status.HTTP_200_OK,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}_cover_letter.pdf"'
        },
    )

@router.post(
    "/export/docx",
    status_code=status.HTTP_200_OK,
    summary="Export Cover Letter as DOCX",
)
async def export_docx(
    data: CoverLetterExportRequest,
    agent: CoverLetterAgent = Depends(get_cover_letter_agent)
):
    docx_bytes = await asyncio.to_thread(agent.generate_docx, data.name, data.paragraphs)
    
    filename = data.name.replace(" ", "_")
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        status_code=status.HTTP_200_OK,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}_cover_letter.docx"'
        },
    )
