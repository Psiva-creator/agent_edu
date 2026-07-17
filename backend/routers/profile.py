import re
import os
import secrets
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Request, Security
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
