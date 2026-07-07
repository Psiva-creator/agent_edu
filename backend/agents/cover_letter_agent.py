import logging
import io
from services.llm_service import LLMService
from prompts.templates import COVER_LETTER_PROMPT
from docx import Document
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)

class CoverLetterAgent:
    def __init__(self):
        self.llm = LLMService()

    async def generate_cover_letter(self, data: dict) -> dict:
        """
        Generate a personalized cover letter using the LLM.
        """
        if not self.llm.is_available:
            return self._generate_fallback(data)

        prompt = COVER_LETTER_PROMPT.format(
            tone=data.get("tone", "Formal"),
            target_role=data.get("target_role", "Role"),
            resume_text=data.get("resume_text", "")[:3000],
            skills=", ".join(data.get("skills", [])),
            experience_years=data.get("experience_years", 0),
            projects=str(data.get("projects", [])),
            job_description=data.get("job_description") or "Not provided"
        )

        try:
            result = await self.llm.generate_json(prompt)
            if isinstance(result, dict) and "paragraphs" in result:
                return result
        except Exception as e:
            logger.error(f"Failed to generate cover letter: {e}")
            
        return self._generate_fallback(data)
        
    def _generate_fallback(self, data: dict) -> dict:
        role = data.get("target_role", "the open position")
        tone = data.get("tone", "Formal")
        return {
            "paragraphs": [
                {
                    "text": f"Dear Hiring Team,\n\nI am writing to express my strong interest in the {role} position. With my background and passion for delivering results, I am confident in my ability to contribute effectively to your team.",
                    "explanation": "Standard opening to state intent clearly."
                },
                {
                    "text": "Throughout my career, I have developed a robust skill set that aligns with the requirements of this role. My experience in leading projects and driving impact has prepared me to tackle the challenges your team is facing.",
                    "explanation": "Highlights general experience and project impact."
                },
                {
                    "text": "I am excited about the opportunity to bring my unique blend of skills to your organization. I look forward to discussing how my background, skills, and certifications can be an asset to your team. Thank you for your time and consideration.",
                    "explanation": "Professional closing paragraph with a call to action."
                }
            ]
        }

    def generate_pdf(self, name: str, paragraphs: list[str]) -> bytes:
        """
        Convert the cover letter paragraphs to a PDF file using xhtml2pdf.
        """
        html_content = f"""
        <html>
        <head>
            <style>
                @page {{ size: a4 portrait; margin: 2cm; }}
                body {{ font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; color: #333333; line-height: 1.6; }}
                h1 {{ font-size: 16pt; margin-bottom: 20px; color: #111111; border-bottom: 1px solid #eeeeee; padding-bottom: 10px; }}
                p {{ margin-bottom: 15px; }}
            </style>
        </head>
        <body>
            <h1>{name} - Cover Letter</h1>
            {"".join(f"<p>{p}</p>" for p in paragraphs)}
        </body>
        </html>
        """
        
        pdf_bytes = io.BytesIO()
        pisa_status = pisa.CreatePDF(io.StringIO(html_content), dest=pdf_bytes)
        
        if pisa_status.err:
            logger.error(f"PDF generation error: {pisa_status.err}")
            return b""
            
        return pdf_bytes.getvalue()

    def generate_docx(self, name: str, paragraphs: list[str]) -> bytes:
        """
        Convert the cover letter paragraphs to a DOCX file using python-docx.
        """
        document = Document()
        
        # Add heading
        heading = document.add_heading(f"{name} - Cover Letter", level=1)
        
        # Add paragraphs
        for para in paragraphs:
            document.add_paragraph(para)
            
        # Save to bytes
        docx_bytes = io.BytesIO()
        document.save(docx_bytes)
        return docx_bytes.getvalue()
