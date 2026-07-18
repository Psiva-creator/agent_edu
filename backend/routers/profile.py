import re
import os
import secrets
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Request, Security, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from services import db_service
from services import sms_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/profile", tags=["profile"])

# ─── Auth Dependency ──────────────────────────────────────────

security_scheme = HTTPBearer(auto_error=False)

def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme)) -> Dict[str, Any]:
    """
    Authenticate user. Since Career Guide AI is client-side first,
    we inspect the Authorization Bearer header, or fallback to a custom header,
    defaulting to 'guest_user'.
    """
    user_id = "guest_user"
    
    # Check X-Mock-User-Id first for easy E2E browser tests
    mock_id = request.headers.get("x-mock-user-id")
    if mock_id:
        user_id = mock_id
    elif credentials and credentials.credentials:
        token = credentials.credentials
        if token.startswith("mock_token_"):
            user_id = token.replace("mock_token_", "")
        else:
            user_id = token

    return {
        "id": user_id,
        "email": "student@university.edu",
        "name": "Guest User"
    }

# ─── Models ───────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    phoneNumber: str

class VerifyOtpRequest(BaseModel):
    phoneNumber: str
    otp: str

class ProfileSaveRequest(BaseModel):
    name: str
    email: str
    education: Optional[str] = None
    graduationYear: Optional[str] = None
    target_role: Optional[str] = None
    avatarUrl: Optional[str] = None
    country_code: Optional[str] = None
    phone_number: Optional[str] = None
    phone_verified: Optional[bool] = False

# ─── Helpers ──────────────────────────────────────────────────

def normalize_phone(phone: str) -> str:
    """Normalize phone number to E.164 format."""
    # Strip spaces, dashes, parentheses
    cleaned = re.sub(r"[^0-9+]", "", phone)
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned
    # Basic E.164 verification: must contain a plus followed by 7 to 15 digits
    if not re.match(r"^\+[0-9]{7,15}$", cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid mobile number."
        )
    return cleaned

# ─── Endpoints ────────────────────────────────────────────────

@router.get("")
async def get_profile_data(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch stored user profile details."""
    profile = db_service.get_profile(current_user["id"])
    if not profile:
        # Return default placeholder
        return {
            "name": "",
            "email": current_user["email"],
            "education": "",
            "graduationYear": "",
            "target_role": "",
            "avatarUrl": "",
            "country_code": "+91",
            "phone_number": "",
            "phone_verified": False
        }
    
    # Map database 0/1 back to boolean for JSON response
    profile["phone_verified"] = bool(profile.get("phone_verified", 0))
    return profile

@router.post("")
async def save_profile_data(
    data: ProfileSaveRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Save user profile details, resetting phone verification if number changes."""
    user_id = current_user["id"]
    existing = db_service.get_profile(user_id)
    
    phone_verified = data.phone_verified
    phone_verified_at = existing.get("phone_verified_at") if existing else None
    
    # If user changed their verified phone number, remove the verified status
    if existing and existing.get("phone_verified") == 1:
        old_phone = existing.get("phone_number", "")
        new_phone = data.phone_number or ""
        # Compare normalized values
        if old_phone.replace(" ", "") != new_phone.replace(" ", ""):
            phone_verified = False
            phone_verified_at = None

    profile_dict = {
        "name": data.name,
        "email": data.email,
        "education": data.education,
        "graduationYear": data.graduationYear,
        "target_role": data.target_role,
        "avatarUrl": data.avatarUrl,
        "country_code": data.country_code,
        "phone_number": data.phone_number,
        "phone_verified": 1 if phone_verified else 0,
        "phone_verified_at": phone_verified_at
    }
    
    db_service.save_profile(user_id, profile_dict)
    return {"success": True, "message": "Profile updated successfully."}

@router.post("/mobile/send-otp")
async def send_otp(
    request: SendOtpRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Send verification OTP using sms_service."""
    phone = normalize_phone(request.phoneNumber)
    user_id = current_user["id"]
    
    # Check if number is already verified by someone else
    if db_service.is_phone_number_verified_by_other(user_id, phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mobile number is already verified by another account."
        )

    # Apply rate limiting: check if user requested OTP in last 30 seconds
    latest = db_service.get_active_otp_record(user_id, phone)
    if latest:
        created_at = datetime.fromisoformat(latest["createdAt"])
        if datetime.utcnow() - created_at < timedelta(seconds=30):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please wait before requesting another code."
            )
            
    # Check if Twilio Verify service is enabled
    verify_service_id = os.getenv("SMS_VERIFY_SERVICE_ID", "")
    provider = os.getenv("SMS_PROVIDER", "mock").lower()
    
    otp = "123456" # Default mock code
    
    if provider != "twilio" or not verify_service_id:
        # Manually generate secure random 6-digit OTP code for local/SMS hashing
        otp = "".join(secrets.choice("0123456789") for _ in range(6))
        
    otp_hash = hashlib.sha256(otp.encode("utf-8")).hexdigest()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Send via provider
    success = await sms_service.send_sms_otp(phone, otp)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We could not send the verification code. Please try again."
        )
        
    # Invalidate previous unused OTP records
    db_service.invalidate_previous_otps(user_id, phone)
    
    # Save new OTP record if we generated one
    if provider != "twilio" or not verify_service_id:
        db_service.save_otp_verification(user_id, phone, otp_hash, expires_at)
        
    return {
        "success": True,
        "message": "Verification code sent successfully.",
        "expiresIn": 300
    }

@router.post("/mobile/verify-otp")
async def verify_otp(
    request: VerifyOtpRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Verify phone OTP, marking profile as verified on success."""
    phone = normalize_phone(request.phoneNumber)
    otp = request.otp.strip()
    user_id = current_user["id"]
    
    # 1. Twilio Verify Check
    verify_service_id = os.getenv("SMS_VERIFY_SERVICE_ID", "")
    provider = os.getenv("SMS_PROVIDER", "mock").lower()
    
    if provider == "twilio" and verify_service_id:
        success = await sms_service.verify_sms_otp_service(phone, otp)
        if success:
            db_service.update_profile_verification(user_id, phone, True)
            return {
                "success": True,
                "message": "Mobile number verified successfully.",
                "mobileVerified": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The verification code is incorrect."
            )
            
    # 2. Local verification record check (Standard/Mock)
    record = db_service.get_active_otp_record(user_id, phone)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found for this number."
        )
        
    # Check limit attempts (max 5)
    if record["attemptCount"] >= 5:
        # Mark as used/expired to prevent brute-force
        db_service.mark_otp_as_used(record["id"])
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Request a new verification code."
        )
        
    # Increment attempts
    db_service.increment_otp_attempts(record["id"])
    
    # Check expiry
    expires_at = datetime.fromisoformat(record["expiresAt"])
    if datetime.utcnow() > expires_at:
        db_service.mark_otp_as_used(record["id"])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification code has expired. Request a new one."
        )
        
    # Verify hash match
    submitted_hash = hashlib.sha256(otp.encode("utf-8")).hexdigest()
    if submitted_hash != record["otpHash"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code is incorrect."
        )
        
    # Mark OTP record as used
    db_service.mark_otp_as_used(record["id"])
    
    # Save verification state to database
    db_service.update_profile_verification(user_id, phone, True)
    
    return {
        "success": True,
        "message": "Mobile number verified successfully.",
        "mobileVerified": True
    }

@router.get("/guidance")
async def get_career_guidance(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Generate AI career guidance based on the user's profile using the MentorAgent."""
    from agents.mentor_agent import MentorAgent
    
    profile_data = db_service.get_profile(current_user["id"]) or {}
    
    # Construct a profile dictionary compatible with MentorAgent
    agent_profile = {
        "name": profile_data.get("name") or current_user.get("name", "User"),
        "current_role": "Student" if not profile_data.get("education") else f"Student at {profile_data.get('education')}",
        "target_role": profile_data.get("target_role") or "Software Engineer",
        "skills": ["Python", "JavaScript", "React"], # Placeholder for extracted skills
        "experience_years": 0
    }
    
    agent = MentorAgent()
    try:
        guidance = await agent.get_guidance(profile=agent_profile)
        return guidance
    except Exception as e:
        logger.error(f"Error generating guidance: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate career guidance.")


# ─── Analysis Job Pipeline & Endpoints ──────────────────────────

async def run_analysis_pipeline(job_id: str, user_id: str, mode: str, resume_text: str, form: dict):
    try:
        from services import db_service
        from utils.dependencies import get_llm, get_resources, get_resume_agent, get_roadmap_agent, get_job_agent, get_mentor_agent
        from agents.skill_gap_agent import SkillGapAgent
        from agents.market_agent import MarketAgent
        from services.report_service import ReportService
        from datetime import datetime
        
        # 1. Update SQLite to processing, and starting step
        if mode == "upload":
            db_service.save_analysis_job(job_id, user_id, "processing", "resume_extracted")
        else:
            db_service.save_analysis_job(job_id, user_id, "processing", "career_intelligence_generated")
            
        name = form.get("name", "User")
        current_role = form.get("current_role", "Student")
        target_role = form.get("target_role", "Software Engineer")
        skills = form.get("skills", [])
        experience_years = int(form.get("experience_years", 0))
        education = form.get("education", "Not specified")
        location = form.get("location", "India")
        
        llm = get_llm()
        
        # Step: Resume Analyzed
        if mode == "upload":
            db_service.save_analysis_job(job_id, user_id, "processing", "resume_analyzed")
            resume_agent = get_resume_agent()
            resume_analysis = await resume_agent.analyze_resume(resume_text, target_role)
            extracted_skills = resume_analysis.get("extracted_skills", skills) or skills
        else:
            resume_analysis = {}
            extracted_skills = skills
            db_service.save_analysis_job(job_id, user_id, "processing", "resume_analyzed")
            
        # Step: Career Intelligence Generated
        db_service.save_analysis_job(job_id, user_id, "processing", "career_intelligence_generated")
        skill_gap_agent = SkillGapAgent(llm_service=llm)
        skill_gap_analysis = await skill_gap_agent.analyze_gaps(extracted_skills, target_role)
        missing_skills = skill_gap_analysis.get("missing_skills", [])
        
        # Step: Roadmap Created
        db_service.save_analysis_job(job_id, user_id, "processing", "roadmap_created")
        roadmap_agent = get_roadmap_agent()
        roadmap = await roadmap_agent.generate_roadmap(
            skill_gaps=missing_skills,
            hours_per_week=15,
            deadline_weeks=8,
            current_role=current_role,
            target_role=target_role
        )
        
        # Step: Jobs Matched
        db_service.save_analysis_job(job_id, user_id, "processing", "jobs_matched")
        job_agent = get_job_agent()
        merged_profile = {
            **resume_analysis,
            "name": name,
            "current_role": current_role,
            "target_role": target_role,
            "skills": extracted_skills,
            "experience_years": experience_years,
            "education": education,
            "location": location,
        }
        jobs = await job_agent.find_jobs(profile=merged_profile, preferences={"remote": True})
        
        # Step: Mentor Initialized
        db_service.save_analysis_job(job_id, user_id, "processing", "mentor_initialized")
        market_agent = MarketAgent(llm_service=llm)
        try:
            market_analysis = await market_agent.analyze_market(industry=target_role, location=location)
        except Exception:
            market_analysis = {}
            
        mentor_agent = get_mentor_agent()
        mentor_advice = await mentor_agent.get_guidance(
            profile=merged_profile,
            target_role=target_role,
            resume_analysis=resume_analysis,
            skill_gap_analysis=skill_gap_analysis,
            roadmap=roadmap,
            jobs=jobs
        )
        
        # Step: Career Memory Saved
        db_service.save_analysis_job(job_id, user_id, "processing", "career_memory_saved")
        
        report_service = ReportService(llm_service=llm)
        
        # Readiness score
        readiness_score = float(resume_analysis.get("readiness_score", 0.0))
        if readiness_score == 0.0:
            readiness_score = float(skill_gap_analysis.get("confidence_score", 0.85) * 100)
        readiness_label = report_service._score_to_label(int(readiness_score))
        
        candidate_summary = resume_analysis.get("summary", "")
        if not candidate_summary:
            candidate_summary = (
                f"{name} is a {current_role} targeting the {target_role} role. "
                f"They currently possess {len(extracted_skills)} technical skills and "
                f"have {experience_years} years of professional experience."
            )
            
        strengths = resume_analysis.get("strengths", [])
        if not strengths:
            strengths = report_service._analyze_strengths(extracted_skills, experience_years, [], target_role)
            
        weaknesses = resume_analysis.get("improvements", [])
        if not weaknesses:
            weaknesses = report_service._analyze_weaknesses(extracted_skills, experience_years, [], set())
            
        expected_salary = {
            "currency": "INR",
            "min": 0,
            "max": 0,
            "median": 0
        }
        if jobs and jobs.get("matches"):
            first_match = jobs["matches"][0]
            if "salary_range" in first_match:
                expected_salary = first_match["salary_range"]
        from services.report_service import SALARY_MAP, CERTIFICATIONS_MAP, HIRING_COMPANIES_MAP
        if expected_salary.get("median", 0) == 0:
            expected_salary = SALARY_MAP.get(target_role.lower(), {"min": 500000, "max": 2000000, "median": 1000000})
            expected_salary["currency"] = "INR"
            
        target_roles = []
        for match in jobs.get("matches", []):
            req_skills = match.get("required_skills", [])
            matched_len = len(set(extracted_skills) & set(req_skills))
            target_roles.append({
                "title": match.get("title", ""),
                "match": int(match.get("match_percentage", 0)),
                "matched_skills": matched_len,
                "total_required": len(req_skills),
                "is_primary": match.get("title", "").lower() == target_role.lower()
            })
        if not target_roles:
            target_roles = report_service._compute_target_roles({s.lower() for s in extracted_skills}, target_role)
            
        roadmap_summary = ""
        if roadmap and roadmap.get("weeks"):
            weeks = roadmap["weeks"]
            total_w = len(weeks)
            phase_themes = [w.get("theme", "") for w in weeks if w.get("theme")]
            unique_themes = []
            for t in phase_themes:
                if t not in unique_themes:
                    unique_themes.append(t)
            roadmap_summary = (
                f"Personalized {total_w}-week learning plan. "
                f"Focus areas: {', '.join(unique_themes[:3])}. "
                f"Total estimated effort: {roadmap.get('total_estimated_hours', total_w * 10)} hours."
            )
        if not roadmap_summary:
            timeline = max(8, 20 - experience_years * 2)
            roadmap_summary = (
                f"Phase 1: Build foundations. Phase 2: Hands-on projects. Phase 3: Portfolio and applications. Total: {timeline} weeks."
            )
            
        certifications = CERTIFICATIONS_MAP.get(target_role.lower(), [])
        if not certifications:
            certifications = ["AWS Certified Cloud Practitioner", "Google IT Support Certificate"]
            
        companies = []
        for match in jobs.get("matches", []):
            for c in match.get("hiring_companies", []):
                if c not in companies:
                    companies.append(c)
        if not companies:
            companies = HIRING_COMPANIES_MAP.get(target_role.lower(), [])
        hiring_companies = companies[:5]
        
        next_steps = mentor_advice.get("weekly_goals", [])[:3] + mentor_advice.get("monthly_goals", [])[:2]
        if not next_steps:
            next_steps = [
                f"Complete an online course in {missing_skills[0]}" if missing_skills else "Review your skills",
                "Build 2–3 portfolio projects showcasing your target skills"
            ]
            
        overall_recommendation = mentor_advice.get("learning_strategy", "")
        if not overall_recommendation:
            overall_recommendation = report_service._generate_recommendation(
                int(readiness_score), target_role, missing_skills, experience_years
            )
            
        report = {
            "name": name,
            "current_role": current_role,
            "target_role": target_role,
            "generated_at": datetime.now().strftime("%B %d, %Y at %I:%M %p"),
            "candidate_summary": candidate_summary,
            "readiness_score": readiness_score,
            "readiness_label": readiness_label,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "skill_gaps": missing_skills,
            "expected_salary": expected_salary,
            "target_roles": target_roles,
            "roadmap_summary": roadmap_summary,
            "mentor_advice": mentor_advice.get("personalized_advice", ""),
            "certifications": certifications,
            "hiring_companies": hiring_companies,
            "overall_recommendation": overall_recommendation,
            "next_steps": next_steps,
            "market_data": market_analysis,
            "resume_text": resume_text,
            "skills": extracted_skills,
            "experience_years": experience_years,
            "projects": form.get("projects", []),
            "source": "ai",
            "roadmap": roadmap,
            "jobs": jobs,
            "mentor_context": mentor_advice
        }
        
        # Save profile
        profile_dict = {
            "name": name,
            "email": form.get("email") or "student@university.edu",
            "education": education,
            "graduationYear": form.get("graduationYear") or "",
            "target_role": target_role,
            "avatarUrl": form.get("avatarUrl") or "",
            "country_code": form.get("country_code") or "+91",
            "phone_number": form.get("phone_number") or "",
            "phone_verified": 1 if form.get("phone_verified") else 0,
            "phone_verified_at": form.get("phone_verified_at")
        }
        db_service.save_profile(user_id, profile_dict)
        
        # Complete
        db_service.save_analysis_job(job_id, user_id, "completed", "career_memory_saved", result_dict=report)
        
    except Exception as e:
        import traceback
        error_msg = f"Pipeline failed: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        db_service.save_analysis_job(job_id, user_id, "failed", "career_memory_saved", error_message=error_msg)


class StartAnalysisRequest(BaseModel):
    mode: str
    resume_text: Optional[str] = ""
    form: Dict[str, Any]

class RetryAnalysisRequest(BaseModel):
    mode: str
    resume_text: Optional[str] = ""
    form: Dict[str, Any]

@router.post("/analyze/start")
async def start_analysis(
    request: StartAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["id"]
    if not user_id:
        raise HTTPException(status_code=401, detail="User is not authenticated.")
        
    # Check if there is an active job
    active_job = db_service.get_active_analysis_job_by_user(user_id)
    if active_job:
        return active_job
        
    # Create new job
    import uuid
    job_id = str(uuid.uuid4())
    db_service.save_analysis_job(
        job_id, 
        user_id, 
        "pending", 
        "resume_extracted" if request.mode == "upload" else "career_intelligence_generated"
    )
    
    background_tasks.add_task(
        run_analysis_pipeline,
        job_id,
        user_id,
        request.mode,
        request.resume_text,
        request.form
    )
    
    return db_service.get_analysis_job(job_id)

@router.post("/analyze/retry/{job_id}")
async def retry_analysis(
    job_id: str,
    request: RetryAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user["id"]
    if not user_id:
        raise HTTPException(status_code=401, detail="User is not authenticated.")
        
    job = db_service.get_analysis_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    if job["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized.")
        
    # Reset status to pending
    db_service.save_analysis_job(
        job_id, 
        user_id, 
        "pending", 
        "resume_extracted" if request.mode == "upload" else "career_intelligence_generated"
    )
    
    background_tasks.add_task(
        run_analysis_pipeline,
        job_id,
        user_id,
        request.mode,
        request.resume_text,
        request.form
    )
    
    return db_service.get_analysis_job(job_id)

@router.get("/analyze/active")
async def get_active_job(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    job = db_service.get_active_analysis_job_by_user(user_id)
    return job

@router.get("/analyze/latest")
async def get_latest_job(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    job = db_service.get_latest_job_by_user(user_id)
    return job

@router.get("/analyze/job/{job_id}")
async def get_job_by_id(job_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    job = db_service.get_analysis_job(job_id)
    if job and job["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    return job
