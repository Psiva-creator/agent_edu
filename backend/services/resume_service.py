import re
from typing import List, Dict, Any, Optional
from database.resume_db import ResumeDB
from agents.resume_agent import ResumeAgent
from services.llm_service import LLMService
from services.resume_extraction import ResumeExtractionService

class ResumeService:
    def __init__(self, llm_service: LLMService):
        self.db = ResumeDB()
        self.agent = ResumeAgent(llm_service=llm_service)
        self.extractor = ResumeExtractionService(llm_service=llm_service)

    async def handle_upload(self, filename: str, content_bytes: bytes) -> Dict[str, Any]:
        # Call layered ResumeExtractionService (supports OCR fallbacks for scanned / image PDFs)
        extraction_res = await self.extractor.extract(content_bytes, filename)
        text = extraction_res.text.strip()
        if not text:
            raise ValueError(extraction_res.warning or "No text could be extracted from this resume.")

        # Run pre-analysis using ResumeAgent to fetch ATS score and domain
        analysis = await self.agent.analyze_resume(text, "Software Engineer")
        ats_score = int(analysis.get("score", 70))
        
        career_paths = analysis.get("career_path", [])
        career_domain = career_paths[0].get("role", "Software Engineer") if career_paths else "Software Engineer"

        # Save to database
        version_data = self.db.add_resume(
            name=filename,
            size=len(content_bytes),
            text=text,
            ats_score=ats_score,
            career_domain=career_domain,
            file_bytes=content_bytes
        )
        
        # Extract profile fields
        profile_suggestion = self.extract_profile_info(text)

        return {
            "resume": version_data,
            "analysis": analysis,
            "profile_suggestion": profile_suggestion
        }

    def list_versions(self) -> List[Dict[str, Any]]:
        return self.db.list_resumes()

    def get_active(self) -> Optional[Dict[str, Any]]:
        return self.db.get_active_resume()

    def set_active(self, resume_id: str) -> Optional[Dict[str, Any]]:
        return self.db.set_active(resume_id)

    def rename(self, resume_id: str, new_name: str) -> Optional[Dict[str, Any]]:
        return self.db.rename_resume(resume_id, new_name)

    def delete(self, resume_id: str) -> bool:
        return self.db.delete_resume(resume_id)

    def get_file_path(self, resume_id: str) -> Optional[str]:
        resume = self.db.get_resume(resume_id)
        if resume and "file_path" in resume:
            return resume["file_path"]
        return None

    def extract_profile_info(self, text: str) -> Dict[str, Any]:
        """
        Smart profile parser using regex heuristics to extract details.
        """
        text_lines = [line.strip() for line in text.split("\n") if line.strip()]
        text_lower = text.lower()

        # Name Heuristic (usually first line of a resume)
        name = "Candidate"
        if text_lines:
            first_line = text_lines[0]
            # Verify if first line is a valid name format (no symbols, short length)
            if len(first_line) < 30 and not any(c in first_line for c in ["@", "|", "/", "\\", ":"]):
                name = first_line

        # Email Regex
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        email = email_match.group(0) if email_match else ""

        # Phone Regex
        phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        phone = phone_match.group(0) if phone_match else ""

        # Location Heuristic
        location = ""
        loc_patterns = [
            r'(?:san francisco|new york|chicago|seattle|austin|boston|hyderabad|bangalore|mumbai|delhi|london|berlin|toronto),\s*[a-zA-Z\s]{2,}'
        ]
        for pattern in loc_patterns:
            loc_match = re.search(pattern, text, re.IGNORECASE)
            if loc_match:
                location = loc_match.group(0)
                break

        # Education
        education = ""
        edu_keywords = ["b.s.", "b.tech", "b.e.", "m.s.", "m.tech", "bachelor", "master", "ph.d.", "degree"]
        for line in text_lines[:15]:  # Education usually near top
            line_lower = line.lower()
            if any(k in line_lower for k in edu_keywords):
                education = line
                break

        # Experience (years estimation)
        experience_years = 0
        exp_match = re.search(r'(\d+)\+?\s*years?\s+of\s+experience', text_lower)
        if exp_match:
            experience_years = int(exp_match.group(1))
        else:
            # Estimate based on date ranges (e.g. 2018 - 2022)
            years = re.findall(r'\b(20\d{2})\b', text)
            if len(years) >= 2:
                years_int = sorted([int(y) for y in years])
                diff = years_int[-1] - years_int[0]
                if 0 < diff < 20:
                    experience_years = diff

        # Skills list extraction
        skills = []
        known_skills = [
            "python", "javascript", "react", "node.js", "django", "express", "sql", "postgresql",
            "mongodb", "aws", "docker", "kubernetes", "typescript", "c++", "java", "html", "css",
            "git", "scikit-learn", "tensorflow", "pytorch", "pandas", "numpy", "machine learning"
        ]
        for skill in known_skills:
            if re.search(rf'\b{re.escape(skill)}\b', text_lower):
                # Capitalize nicely
                cap_skills = {
                    "python": "Python", "javascript": "JavaScript", "react": "React", "node.js": "Node.js",
                    "django": "Django", "express": "Express", "sql": "SQL", "postgresql": "PostgreSQL",
                    "mongodb": "MongoDB", "aws": "AWS", "docker": "Docker", "kubernetes": "Kubernetes",
                    "typescript": "TypeScript", "c++": "C++", "java": "Java", "html": "HTML", "css": "CSS",
                    "git": "Git", "scikit-learn": "Scikit-Learn", "tensorflow": "TensorFlow",
                    "pytorch": "PyTorch", "pandas": "Pandas", "numpy": "NumPy", "machine learning": "Machine Learning"
                }
                skills.append(cap_skills.get(skill, skill))

        # Projects list extraction
        projects = []
        for line in text_lines:
            # Lines matching typical project list bullet points
            if any(p in line.lower() for p in ["portfolio", "app", "system", "dashboard", "engine", "platform"]) and len(line) < 60:
                projects.append({"title": line, "tech": []})
                if len(projects) >= 3:
                    break

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "location": location,
            "education": education,
            "experience_years": experience_years,
            "skills": skills,
            "projects": projects
        }

    def _extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        text = ""
        # Strategy 1: pdfplumber
        try:
            import pdfplumber
            import io
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            if text.strip():
                return text.strip()
        except Exception:
            pass

        # Strategy 2: pypdf fallback
        try:
            from pypdf import PdfReader
            import io
            reader = PdfReader(io.BytesIO(pdf_bytes))
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            if text.strip():
                return text.strip()
        except Exception:
            pass

        return text.strip()
