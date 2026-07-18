import logging
from typing import Dict, Any, Optional
from utils.dependencies import get_resume_service

logger = logging.getLogger(__name__)

class ContextBuilder:
    def __init__(self):
        self.resume_service = get_resume_service()

    def build_context(self, frontend_context: Optional[dict] = None) -> dict:
        """
        Gathers active resume, ATS analyses, profile fields, and roadmap completion 
        metrics to create a unified state payload.
        """
        context = {}
        if frontend_context:
            context.update(frontend_context)

        # Retrieve backend single source of truth (Active Resume)
        active_resume = self.resume_service.get_active()
        if active_resume:
            context["active_resume"] = {
                "id": active_resume.get("id"),
                "name": active_resume.get("name"),
                "ats_score": active_resume.get("ats_score"),
                "career_domain": active_resume.get("career_domain"),
                "text": active_resume.get("text")
            }
            # Automatically override missing profile metrics from the active resume
            if not context.get("target_role") or context.get("target_role") == "Software Engineer":
                context["target_role"] = active_resume.get("career_domain", "Software Engineer")
            if not context.get("ats_score") or context.get("ats_score") == 0:
                context["ats_score"] = active_resume.get("ats_score", 0)
        else:
            context["active_resume"] = None

        return context

    def format_for_llm(self, context: dict) -> str:
        """
        Formats the context dictionary into a clean markdown block for LLM prompts.
        """
        name = context.get("name") or "Candidate"
        current_role = context.get("current_role") or "Candidate"
        target_role = context.get("target_role") or "Software Engineer"
        experience_years = context.get("experience_years") or 0
        education = context.get("education") or "Not specified"
        
        skills = context.get("skills") or []
        skills_str = ", ".join(skills) if skills else "None listed"

        certifications = context.get("certifications") or []
        certs_str = ", ".join(certifications) if certifications else "None listed"

        projects = context.get("projects") or []
        if isinstance(projects, list):
            proj_names = [p.get("name", p.get("title", "")) if isinstance(p, dict) else str(p) for p in projects]
            proj_str = ", ".join(proj_names)
        else:
            proj_str = "None listed"

        ats_score = context.get("ats_score") or "Not analyzed"
        completed_tasks_count = context.get("completed_tasks_count") or 0
        
        active_res = context.get("active_resume")
        resume_info = "No active resume uploaded."
        if active_res:
            resume_info = f"File: {active_res['name']} (ATS Score: {active_res['ats_score']})"

        formatted = (
            f"=== CANDIDATE PROFILE ===\n"
            f"Name: {name}\n"
            f"Current Role: {current_role}\n"
            f"Target Role: {target_role}\n"
            f"Experience: {experience_years} years\n"
            f"Education: {education}\n"
            f"Skills: {skills_str}\n"
            f"Certifications: {certs_str}\n"
            f"Projects: {proj_str}\n"
            f"ATS Score: {ats_score}\n"
            f"Roadmap Progress: {completed_tasks_count} tasks completed\n"
            f"Active Resume Source: {resume_info}\n"
        )
        
        if active_res and active_res.get("text"):
            formatted += f"\n=== ACTIVE RESUME RAW CONTENT ===\n{active_res['text'][:2500]}\n"

        return formatted
