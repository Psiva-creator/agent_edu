"""
Job Matching Agent
==================
Matches user profiles with relevant job opportunities based on
skills, experience, and preferences. Generates recommended job
titles with match percentages, salary ranges, hiring companies,
required skills, experience levels, and remote availability.

Features:
    - Multi-role job matching against user skill profile
    - Match percentage calculation based on skill overlap
    - Salary range estimates (INR) per role
    - Hiring company recommendations per role
    - Required skills listing per role
    - Experience level classification (Entry/Mid/Senior/Lead)
    - Remote work availability estimation
    - OpenAI GPT-4 powered generation (when available)
    - Deterministic fallback analysis (no API key required)
    - Reuses ResumeAgent outputs and SkillGapAgent analysis

Supports:
    - Dict profile input (from ResumeAgent or manual)
    - Raw resume text input
    - Preferences filtering (location, remote, experience_level)
"""

import logging
import httpx
from typing import Optional, Union, List, Dict, Any

from services.llm_service import LLMService
from config import get_settings

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# Reference Data — Roles, Skills, Salaries, Companies
# ═══════════════════════════════════════════════════════════════

# ─── Role → Required Skills ──────────────────────────────────

ROLE_SKILLS_MAP: dict[str, list[str]] = {
    "software engineer": [
        "Python", "JavaScript", "Git", "SQL", "Data Structures",
        "Algorithms", "REST API", "Docker", "Testing",
    ],
    "frontend developer": [
        "JavaScript", "HTML", "CSS", "React", "TypeScript",
        "Git", "Responsive Design", "Testing", "Figma",
    ],
    "backend developer": [
        "Python", "SQL", "REST API", "Docker", "Git",
        "Database Design", "Authentication", "Testing", "Linux",
    ],
    "data scientist": [
        "Python", "SQL", "Machine Learning", "Statistics",
        "Pandas", "NumPy", "Data Visualization", "Deep Learning",
    ],
    "ml engineer": [
        "Python", "PyTorch", "TensorFlow", "Docker", "AWS",
        "Machine Learning", "MLOps", "Git", "SQL",
    ],
    "devops engineer": [
        "Docker", "Kubernetes", "AWS", "Linux", "CI/CD",
        "Terraform", "Git", "Python", "Monitoring",
    ],
    "full stack developer": [
        "JavaScript", "React", "Node.js", "SQL", "Git",
        "Docker", "HTML", "CSS", "REST API", "Testing",
    ],
    "data engineer": [
        "Python", "SQL", "Spark", "Kafka", "Airflow",
        "Docker", "AWS", "Data Modeling", "Git", "ETL",
    ],
    "cloud architect": [
        "AWS", "Azure", "GCP", "Terraform", "Docker",
        "Kubernetes", "Networking", "Security", "Linux", "CI/CD",
    ],
    "product manager": [
        "Agile", "Scrum", "Data Analysis", "SQL", "Figma",
        "A/B Testing", "Communication", "Roadmapping", "Jira",
    ],
    "mobile developer": [
        "React Native", "Flutter", "Swift", "Kotlin", "Git",
        "REST API", "Firebase", "UI/UX", "Testing",
    ],
    "cybersecurity analyst": [
        "Networking", "Linux", "Python", "Security",
        "Penetration Testing", "SIEM", "Firewalls", "Compliance",
    ],
    "qa engineer": [
        "Testing", "Selenium", "Python", "JavaScript", "Git",
        "CI/CD", "API Testing", "Agile", "SQL",
    ],
}

# ─── Role → Salary Range (INR / year) ────────────────────────

SALARY_MAP: dict[str, dict[str, int]] = {
    "software engineer":    {"min": 500000,  "max": 2500000, "median": 1200000},
    "frontend developer":   {"min": 400000,  "max": 1800000, "median": 900000},
    "backend developer":    {"min": 500000,  "max": 2000000, "median": 1000000},
    "full stack developer": {"min": 500000,  "max": 2200000, "median": 1100000},
    "devops engineer":      {"min": 600000,  "max": 2500000, "median": 1300000},
    "data scientist":       {"min": 600000,  "max": 2500000, "median": 1200000},
    "ml engineer":          {"min": 700000,  "max": 3000000, "median": 1500000},
    "data engineer":        {"min": 600000,  "max": 2800000, "median": 1400000},
    "cloud architect":      {"min": 1200000, "max": 4000000, "median": 2200000},
    "product manager":      {"min": 800000,  "max": 3000000, "median": 1600000},
    "mobile developer":     {"min": 450000,  "max": 2000000, "median": 1000000},
    "cybersecurity analyst": {"min": 500000, "max": 2200000, "median": 1100000},
    "qa engineer":          {"min": 400000,  "max": 1600000, "median": 800000},
}

# ─── Role → Hiring Companies ─────────────────────────────────

HIRING_COMPANIES_MAP: dict[str, list[str]] = {
    "software engineer":    ["Google", "Microsoft", "Amazon", "Flipkart", "Atlassian", "Razorpay", "PhonePe", "Groww"],
    "frontend developer":   ["Google", "Meta", "Razorpay", "Swiggy", "Zomato", "Paytm", "Atlassian", "Freshworks"],
    "backend developer":    ["Amazon", "Microsoft", "Flipkart", "Zerodha", "PhonePe", "Ola", "Juspay", "Groww"],
    "full stack developer": ["Google", "Amazon", "Razorpay", "Flipkart", "Zomato", "ShareChat", "Meesho", "Groww"],
    "devops engineer":      ["Amazon", "Microsoft", "Infosys", "Wipro", "TCS", "Razorpay", "Juspay", "Hasura"],
    "data scientist":       ["Google", "Amazon", "Microsoft", "Flipkart", "Swiggy", "PhonePe", "Fractal Analytics", "Tiger Analytics"],
    "ml engineer":          ["Google", "Amazon", "Microsoft", "NVIDIA", "Flipkart", "Ola", "Fractal Analytics", "PhonePe"],
    "data engineer":        ["Amazon", "Google", "Flipkart", "Walmart", "Swiggy", "PhonePe", "Razorpay", "Groww"],
    "cloud architect":      ["Amazon", "Microsoft", "Google", "Infosys", "TCS", "Wipro", "Accenture", "HCL"],
    "product manager":      ["Google", "Amazon", "Flipkart", "Razorpay", "Swiggy", "PhonePe", "Meesho", "CRED"],
    "mobile developer":     ["Google", "Meta", "Flipkart", "Swiggy", "PhonePe", "Ola", "Paytm", "Dream11"],
    "cybersecurity analyst": ["Microsoft", "Amazon", "Infosys", "TCS", "Wipro", "Palo Alto Networks", "CrowdStrike", "IBM"],
    "qa engineer":          ["Amazon", "Microsoft", "Flipkart", "Infosys", "TCS", "Wipro", "Accenture", "Cognizant"],
}

# ─── Role → Remote Work Likelihood ───────────────────────────

REMOTE_LIKELIHOOD: dict[str, str] = {
    "software engineer":    "high",
    "frontend developer":   "high",
    "backend developer":    "high",
    "full stack developer": "high",
    "devops engineer":      "high",
    "data scientist":       "high",
    "ml engineer":          "high",
    "data engineer":        "high",
    "cloud architect":      "high",
    "product manager":      "medium",
    "mobile developer":     "high",
    "cybersecurity analyst": "medium",
    "qa engineer":          "medium",
}

# ─── Experience Level Thresholds ─────────────────────────────

EXPERIENCE_LEVELS = [
    (0, 1,  "entry",  "Entry Level / Fresher"),
    (2, 4,  "mid",    "Mid Level"),
    (5, 8,  "senior", "Senior Level"),
    (9, 99, "lead",   "Lead / Staff"),
]


# ═══════════════════════════════════════════════════════════════
# Job Agent
# ═══════════════════════════════════════════════════════════════

class JobAgent:
    """
    Agent responsible for job matching and opportunity discovery.

    Usage:
        agent = JobAgent()
        result = await agent.find_jobs(
            profile={"skills": ["Python", "SQL"], "target_role": "Backend Developer"},
            preferences={"remote": True}
        )
    """

    def __init__(
        self,
        llm_service: Optional[LLMService] = None,
    ):
        """
        Initialize the JobAgent.

        Args:
            llm_service: Injected LLM service (or creates its own).
        """
        self.llm = llm_service or LLMService()

    # ═══════════════════════════════════════════════════════════
    # PUBLIC API
    # ═══════════════════════════════════════════════════════════

    async def find_jobs(
        self,
        profile: Union[Dict[str, Any], str],
        preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Find matching job opportunities based on user profile.

        Args:
            profile:     User profile dict (from ResumeAgent, SkillGapAgent,
                         or manual input) with keys like 'skills',
                         'target_role', 'experience_years', 'current_role'.
                         Also accepts raw resume text as a string.
            preferences: Optional filtering preferences:
                         - location (str): preferred job location
                         - remote (bool): prefer remote jobs
                         - experience_level (str): entry/mid/senior/lead

        Returns:
            Structured JSON dict with job matches.
        """
        preferences = preferences or {}

        # ── 1. Normalize profile ──────────────────────────────
        parsed = await self._parse_profile(profile)
        skills = parsed["skills"]
        target_role = parsed["target_role"]
        experience_years = parsed["experience_years"]
        current_role = parsed["current_role"]

        logger.info(
            f"JobAgent: finding jobs for target_role={target_role}, "
            f"skills={len(skills)}, experience={experience_years}yr"
        )
        
        # ── 2. Real-Time Job Search via SerpApi (Google Jobs) ────
        settings = get_settings()
        if settings.SERPAPI_API_KEY:
            logger.info("SerpApi key found. Fetching real-time Google Jobs data...")
            try:
                serpapi_results = await self._search_serpapi_jobs(
                    query=target_role, 
                    location=preferences.get("location", "")
                )
                if serpapi_results and serpapi_results.get("matches"):
                    logger.info("Successfully fetched real-time jobs from SerpApi.")
                    # Attach profile info to maintain API contract
                    serpapi_results.update({
                        "target_role": target_role,
                        "current_role": current_role,
                        "experience_years": experience_years,
                        "experience_level": self._classify_experience(experience_years),
                        "source": "api"
                    })
                    return serpapi_results
            except Exception as e:
                error_msg = str(e).lower()
                reason = "unknown_error"
                if "quota" in error_msg or "429" in error_msg:
                    reason = "quota_exhausted"
                elif "auth" in error_msg or "401" in error_msg or "403" in error_msg:
                    reason = "auth_error"
                elif "timeout" in error_msg:
                    reason = "timeout"
                    
                logger.warning(
                    f"[Fallback] JobAgent using fallback due to API error. Reason: {reason}. Details: {e}",
                    extra={"agent": "JobAgent", "source": "fallback", "reason": reason}
                )

        # ── 3. Deterministic fallback ─────────────────────────
        logger.warning(
            "[Fallback] JobAgent using fallback because API/LLM is unavailable.",
            extra={"agent": "JobAgent", "source": "fallback", "reason": "api_unavailable"}
        )
        return self._find_fallback(
            skills, target_role, experience_years,
            current_role, preferences,
        )

    # ═══════════════════════════════════════════════════════════
    # PROFILE PARSING
    # ═══════════════════════════════════════════════════════════

    async def _parse_profile(
        self, profile: Union[Dict[str, Any], str],
    ) -> Dict[str, Any]:
        """
        Normalize different profile input formats into a
        standard dict with skills, target_role, experience_years,
        and current_role.

        Supports:
            - ResumeAgent output dict (extracted_skills, target_role, ...)
            - SkillGapAgent output dict (current_skills, target_role, ...)
            - Manual dict (skills, target_role, ...)
            - Raw resume text (string) — delegates to ResumeAgent
        """
        # Default structure
        result = {
            "skills": [],
            "target_role": "Software Engineer",
            "experience_years": 0,
            "current_role": "Student",
        }

        # ── Raw resume text ───────────────────────────────────
        if isinstance(profile, str):
            stripped = profile.strip()
            if not stripped:
                return result

            # Simple regex search for target role in text
            import re
            target_role = "Software Engineer"
            match = re.search(r'(?:target|preferred|desired)\s*role\s*[:\-]?\s*([a-zA-Z\s]+)', stripped, re.IGNORECASE)
            if match:
                # Strip and clean up trailing dots or spaces
                target_role = match.group(1).strip().rstrip('.')

            # Use ResumeAgent for extraction
            from agents.resume_agent import ResumeAgent
            resume_agent = ResumeAgent(llm_service=self.llm)
            resume_data = await resume_agent.analyze_resume(stripped, target_role=target_role)
            if isinstance(resume_data, dict):
                result["skills"] = resume_data.get("extracted_skills", [])
                result["target_role"] = resume_data.get("target_role", target_role)
                result["experience_years"] = resume_data.get("experience_years", 0)
            return result

        # ── Dict input ────────────────────────────────────────
        if isinstance(profile, dict):
            # Extract skills from various possible key names
            for key in ["skills", "extracted_skills", "current_skills"]:
                if key in profile and isinstance(profile[key], list):
                    result["skills"] = [str(s).strip() for s in profile[key] if s]
                    break

            result["target_role"] = str(
                profile.get("target_role", "Software Engineer")
            ).strip()
            result["experience_years"] = int(
                profile.get("experience_years", 0)
            )
            result["current_role"] = str(
                profile.get("current_role", "Student")
            ).strip()

        return result

    # ═══════════════════════════════════════════════════════════
    # SERPAPI INTEGRATION
    # ═══════════════════════════════════════════════════════════

    async def _search_serpapi_jobs(self, query: str, location: str) -> Dict[str, Any]:
        """Fetch live job postings from SerpApi's Google Jobs engine."""
        settings = get_settings()
        api_key = settings.SERPAPI_API_KEY
        
        if not api_key:
            return {}
            
        # Append linkedin to force google to prioritize linkedin jobs
        params = {
            "engine": "google_jobs",
            "q": f"{query} linkedin",
            "api_key": api_key,
            "hl": "en",
        }
        
        if location:
            params["location"] = location
            
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get("https://serpapi.com/search.json", params=params)
            response.raise_for_status()
            data = response.json()
            
        jobs_results = data.get("jobs_results", [])
        matches = []
        
        # Increase the limit to return more jobs (up to 20)
        for job in jobs_results[:20]:
            # Extract salary if provided in the snippet
            salary_str = ""
            for ext in job.get("extensions", []):
                if "$" in ext or "₹" in ext or "Salary" in ext or "a year" in ext or "a month" in ext:
                    salary_str = ext
                    break
                    
            # Try to find an apply link, specifically prioritizing LinkedIn
            apply_url = ""
            
            # Check apply_options first for LinkedIn
            for option in job.get("apply_options", []):
                if option.get("title", "").lower() == "linkedin":
                    apply_url = option.get("link", "")
                    break
            
            # If no LinkedIn specific link, just take the first apply option
            if not apply_url and job.get("apply_options"):
                apply_url = job["apply_options"][0].get("link", "")
                
            # Fallback to related links
            if not apply_url:
                for link in job.get("related_links", []):
                    if link.get("link"):
                        apply_url = link["link"]
                        break
                    
            if not apply_url:
                # Fallback to search query
                company = job.get("company_name", "")
                apply_url = f"https://www.linkedin.com/jobs/search/?keywords={query.replace(' ', '%20')}%20{company.replace(' ', '%20')}"

            # Create a uniform structure matching what JobsPanel expects
            matches.append({
                "title": job.get("title", ""),
                "hiring_companies": [job.get("company_name", "Unknown")],
                "company_name": job.get("company_name", "Unknown"),
                "location": job.get("location", ""),
                "description": job.get("description", ""),
                "match_percentage": 95, # Assuming high match for a direct search query
                "salary_str": salary_str,
                "url": apply_url,
                "via": job.get("via", "")
            })
            
        return {
            "total_matches": len(matches),
            "matches": matches
        }

    # ═══════════════════════════════════════════════════════════
    # LLM GENERATION
    # ═══════════════════════════════════════════════════════════

    async def _find_with_llm(
        self,
        skills: List[str],
        target_role: str,
        experience_years: int,
        current_role: str,
        preferences: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate job matches using OpenAI GPT-4."""
        skills_str = ", ".join(skills) if skills else "None specified"
        pref_str = ", ".join(
            f"{k}={v}" for k, v in preferences.items() if v is not None
        ) or "None"

        prompt = f"""\
You are a career advisor and job market analyst. Based on the
candidate profile below, recommend 5–8 matching job roles.

Candidate Profile:
- Current Role: {current_role}
- Target Role: {target_role}
- Skills: {skills_str}
- Experience: {experience_years} years
- Preferences: {pref_str}

Return a JSON object with this exact schema:
{{
  "target_role": "{target_role}",
  "current_role": "{current_role}",
  "experience_years": {experience_years},
  "experience_level": "<entry|mid|senior|lead>",
  "total_matches": <int>,
  "matches": [
    {{
      "title": "<job title>",
      "match_percentage": <int 0-100>,
      "salary_range": {{
        "currency": "INR",
        "min": <int>,
        "max": <int>,
        "median": <int>
      }},
      "hiring_companies": ["<company1>", "<company2>", ...],
      "required_skills": ["<skill1>", "<skill2>", ...],
      "experience_level": "<entry|mid|senior|lead>",
      "remote_availability": "<high|medium|low>",
      "match_reason": "<brief explanation of why this role matches>"
    }}
  ]
}}

Rank matches by match_percentage descending. Be realistic with
salary ranges (Indian market). Return ONLY the JSON object.
"""

        system_message = (
            "You are a career job-matching advisor. "
            "Return ONLY valid JSON matching the requested schema."
        )

        data = await self.llm.generate_json(prompt, system_message=system_message)

        if not data or not isinstance(data, dict):
            return {}

        # Validate and normalize the LLM output
        matches = data.get("matches", [])
        if not matches or not isinstance(matches, list):
            return {}

        validated_matches = []
        for m in matches:
            if not isinstance(m, dict) or "title" not in m:
                continue
            validated_matches.append({
                "title": str(m.get("title", "")),
                "match_percentage": max(0, min(100, int(m.get("match_percentage", 0)))),
                "salary_range": self._validate_salary(m.get("salary_range", {})),
                "hiring_companies": [str(c) for c in m.get("hiring_companies", [])],
                "required_skills": [str(s) for s in m.get("required_skills", [])],
                "experience_level": str(m.get("experience_level", "mid")),
                "remote_availability": str(m.get("remote_availability", "medium")),
                "match_reason": str(m.get("match_reason", "")),
            })

        # Sort by match_percentage descending
        validated_matches.sort(key=lambda x: x["match_percentage"], reverse=True)

        return {
            "target_role": target_role,
            "current_role": current_role,
            "experience_years": experience_years,
            "experience_level": self._classify_experience(experience_years),
            "total_matches": len(validated_matches),
            "matches": validated_matches,
            "source": "ai",
        }

    # ═══════════════════════════════════════════════════════════
    # DETERMINISTIC FALLBACK
    # ═══════════════════════════════════════════════════════════

    def _find_fallback(
        self,
        skills: List[str],
        target_role: str,
        experience_years: int,
        current_role: str,
        preferences: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate job matches deterministically without LLM.

        Strategy:
            1. Score every known role by skill overlap with the user.
            2. Apply preference filters (remote, experience_level).
            3. Return top matches sorted by match_percentage.
        """
        user_skills_normalized = {s.lower().strip() for s in skills}
        experience_level = self._classify_experience(experience_years)
        pref_remote = preferences.get("remote")
        pref_exp = preferences.get("experience_level", "").lower()

        scored_roles: List[Dict[str, Any]] = []

        for role_key, required_skills in ROLE_SKILLS_MAP.items():
            required_normalized = {s.lower() for s in required_skills}

            # ── Skill overlap (core match signal) ─────────────
            matched = user_skills_normalized & required_normalized
            if not required_normalized:
                continue

            base_pct = (len(matched) / len(required_normalized)) * 100

            # ── Bonus: target role affinity ────────────────────
            role_title = role_key.replace("_", " ")
            target_lower = target_role.lower().strip()
            if target_lower in role_title or role_title in target_lower:
                base_pct = min(100, base_pct + 15)  # boost primary target
            elif self._roles_related(target_lower, role_title):
                base_pct = min(100, base_pct + 5)   # small boost for related

            match_pct = round(min(100, max(0, base_pct)))

            # ── Skip zero matches unless it's the target role ─
            if match_pct == 0 and target_lower not in role_title:
                continue

            # ── Remote filter ─────────────────────────────────
            remote_avail = REMOTE_LIKELIHOOD.get(role_key, "medium")
            if pref_remote is True and remote_avail == "low":
                continue

            # ── Experience level filter ───────────────────────
            if pref_exp and pref_exp != experience_level:
                continue

            # ── Salary range ──────────────────────────────────
            salary = SALARY_MAP.get(role_key, {"min": 400000, "max": 2000000, "median": 1000000})

            # Adjust salary by experience
            exp_multiplier = self._salary_experience_multiplier(experience_years)
            adjusted_salary = {
                "currency": "INR",
                "min": round(salary["min"] * exp_multiplier),
                "max": round(salary["max"] * exp_multiplier),
                "median": round(salary["median"] * exp_multiplier),
            }

            # ── Hiring companies ──────────────────────────────
            companies = HIRING_COMPANIES_MAP.get(role_key, [])

            # ── Match reason ──────────────────────────────────
            if matched:
                matched_display = sorted(matched, key=lambda s: s)[:5]
                reason = (
                    f"Your skills in {', '.join(s.title() for s in matched_display)} "
                    f"align with {role_key.title()} requirements."
                )
            else:
                reason = (
                    f"{role_key.title()} is a natural career progression "
                    f"from {current_role}."
                )

            scored_roles.append({
                "title": role_key.title(),
                "match_percentage": match_pct,
                "salary_range": adjusted_salary,
                "hiring_companies": companies[:8],
                "required_skills": required_skills,
                "experience_level": experience_level,
                "remote_availability": remote_avail,
                "match_reason": reason,
            })

        # ── Sort by match_percentage descending ───────────────
        scored_roles.sort(key=lambda x: x["match_percentage"], reverse=True)

        # ── Ensure the target role appears (even at 0 match) ──
        target_present = any(
            target_role.lower().strip() in r["title"].lower()
            for r in scored_roles
        )
        if not target_present:
            scored_roles.insert(0, self._build_target_entry(
                target_role, skills, experience_years, experience_level,
            ))

        # ── Cap at 8 matches ─────────────────────────────────
        top_matches = scored_roles[:8]

        return {
            "target_role": target_role,
            "current_role": current_role,
            "experience_years": experience_years,
            "experience_level": experience_level,
            "total_matches": len(top_matches),
            "matches": top_matches,
            "source": "fallback",
        }

    # ═══════════════════════════════════════════════════════════
    # HELPER METHODS
    # ═══════════════════════════════════════════════════════════

    def _build_target_entry(
        self,
        target_role: str,
        skills: List[str],
        experience_years: int,
        experience_level: str,
    ) -> Dict[str, Any]:
        """Build a job match entry for the explicit target role."""
        role_key = target_role.lower().strip()
        required = ROLE_SKILLS_MAP.get(
            role_key,
            ["Python", "Git", "SQL", "REST API", "Docker"],
        )
        required_normalized = {s.lower() for s in required}
        user_normalized = {s.lower().strip() for s in skills}
        matched = user_normalized & required_normalized
        match_pct = round((len(matched) / max(len(required_normalized), 1)) * 100)

        salary = SALARY_MAP.get(role_key, {"min": 500000, "max": 2000000, "median": 1000000})
        exp_mult = self._salary_experience_multiplier(experience_years)

        return {
            "title": target_role.title(),
            "match_percentage": match_pct,
            "salary_range": {
                "currency": "INR",
                "min": round(salary["min"] * exp_mult),
                "max": round(salary["max"] * exp_mult),
                "median": round(salary["median"] * exp_mult),
            },
            "hiring_companies": HIRING_COMPANIES_MAP.get(role_key, [
                "Google", "Amazon", "Microsoft", "Flipkart",
            ])[:8],
            "required_skills": required if isinstance(required, list) else list(required),
            "experience_level": experience_level,
            "remote_availability": REMOTE_LIKELIHOOD.get(role_key, "medium"),
            "match_reason": f"This is your stated target role.",
        }

    @staticmethod
    def _classify_experience(years: int) -> str:
        """Classify experience years into a named level."""
        for lo, hi, level, _ in EXPERIENCE_LEVELS:
            if lo <= years <= hi:
                return level
        return "mid"

    @staticmethod
    def _classify_experience_label(years: int) -> str:
        """Return the human-readable experience level label."""
        for lo, hi, _, label in EXPERIENCE_LEVELS:
            if lo <= years <= hi:
                return label
        return "Mid Level"

    @staticmethod
    def _salary_experience_multiplier(years: int) -> float:
        """
        Return a salary multiplier based on experience.
        Base salaries in SALARY_MAP are calibrated for ~2 years exp.
        """
        if years <= 1:
            return 0.85
        elif years <= 3:
            return 1.0
        elif years <= 5:
            return 1.25
        elif years <= 8:
            return 1.55
        else:
            return 1.85

    @staticmethod
    def _validate_salary(raw: Any) -> Dict[str, Any]:
        """Validate and normalize a salary_range dict."""
        if not isinstance(raw, dict):
            return {"currency": "INR", "min": 0, "max": 0, "median": 0}
        return {
            "currency": str(raw.get("currency", "INR")),
            "min": int(raw.get("min", 0)),
            "max": int(raw.get("max", 0)),
            "median": int(raw.get("median", 0)),
        }

    @staticmethod
    def _roles_related(role_a: str, role_b: str) -> bool:
        """
        Check if two roles are in related domains.
        Used to give a small match boost to adjacent roles.
        """
        RELATED_GROUPS = [
            {"software engineer", "backend developer", "full stack developer", "frontend developer"},
            {"data scientist", "ml engineer", "data engineer"},
            {"devops engineer", "cloud architect"},
            {"frontend developer", "mobile developer", "full stack developer"},
        ]
        for group in RELATED_GROUPS:
            if role_a in group and role_b in group:
                return True
        return False
