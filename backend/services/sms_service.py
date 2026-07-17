import logging
import os
import httpx
from typing import Dict, Any

logger = logging.getLogger(__name__)

async def send_sms_otp(phone_number: str, otp: str) -> bool:
    """
    Sends an SMS OTP through Twilio Verify, Twilio SMS, or a mock console print in development.
    """
    provider = os.getenv("SMS_PROVIDER", "mock").lower()
    account_id = os.getenv("SMS_ACCOUNT_ID", "")
    auth_token = os.getenv("SMS_AUTH_TOKEN", "")
    sender_id = os.getenv("SMS_SENDER_ID", "")
    verify_service_id = os.getenv("SMS_VERIFY_SERVICE_ID", "")

    # Clean E.164 verification: e.g. +919876543210
    if not phone_number.startswith("+"):
        logger.warning(f"Phone number {phone_number} is not in E.164 format (missing + prefix).")

    # Fallback to console print if credentials are not configured or set to mock
    if provider == "mock" or not account_id or not auth_token:
        # Show a clear development-only message in the server console
        print("\n" + "═"*50)
        print("DEVELOPMENT MODE — SMS OTP CODE")
        print(f"To: {phone_number}")
        print(f"Code: {otp} (Enter this code to verify)")
        print(f"Expiry: 5 minutes")
        print("═"*50 + "\n")
        logger.info(f"[SMS MOCK] Simulated sending OTP {otp} to {phone_number}")
        return True

    # Real SMS / Verify Provider using HTTP Client (no extra packages needed)
    if provider == "twilio":
        # 1. Twilio Verify (Official verification service)
        if verify_service_id:
            url = f"https://verify.twilio.com/v2/Services/{verify_service_id}/Verifications"
            async with httpx.AsyncClient(timeout=10.0) as client:
                try:
                    res = await client.post(
                        url,
                        auth=(account_id, auth_token),
                        data={"To": phone_number, "Channel": "sms"}
                    )
                    if res.status_code in (200, 201):
                        logger.info(f"[Twilio Verify] Success initiating verification for {phone_number}")
                        return True
                    else:
                        logger.error(f"[Twilio Verify] Failed: {res.status_code} - {res.text}")
                        return False
                except Exception as e:
                    logger.error(f"[Twilio Verify] Exception: {e}")
                    return False
        
        # 2. Twilio SMS fallback
        else:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_id}/Messages.json"
            from_number = sender_id or "+1234567890"  # Twilio trial number or sender ID
            body = f"Your Career Guide AI verification code is: {otp}. It expires in 5 minutes."
            async with httpx.AsyncClient(timeout=10.0) as client:
                try:
                    res = await client.post(
                        url,
                        auth=(account_id, auth_token),
                        data={"To": phone_number, "From": from_number, "Body": body}
                    )
                    if res.status_code in (200, 201):
                        logger.info(f"[Twilio SMS] Success sending OTP message to {phone_number}")
                        return True
                    else:
                        logger.error(f"[Twilio SMS] Failed: {res.status_code} - {res.text}")
                        return False
                except Exception as e:
                    logger.error(f"[Twilio SMS] Exception: {e}")
                    return False

    logger.warning(f"Unknown SMS provider: {provider}. Falling back to mock console output.")
    return True

async def verify_sms_otp_service(phone_number: str, otp: str) -> bool:
    """
    Checks verification with Twilio Verify service if configured.
    Returns True if valid/approved, False otherwise.
    """
    provider = os.getenv("SMS_PROVIDER", "mock").lower()
    account_id = os.getenv("SMS_ACCOUNT_ID", "")
    auth_token = os.getenv("SMS_AUTH_TOKEN", "")
    verify_service_id = os.getenv("SMS_VERIFY_SERVICE_ID", "")

    # For Twilio Verify, we ask Twilio's API to check
    if provider == "twilio" and account_id and auth_token and verify_service_id:
        url = f"https://verify.twilio.com/v2/Services/{verify_service_id}/VerificationCheck"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.post(
                    url,
                    auth=(account_id, auth_token),
                    data={"To": phone_number, "Code": otp}
                )
                if res.status_code == 200:
                    data = res.json()
                    status = data.get("status")
                    if status == "approved":
                        logger.info(f"[Twilio VerifyCheck] Approved phone {phone_number}")
                        return True
                logger.warning(f"[Twilio VerifyCheck] Rejected or error: {res.status_code} - {res.text}")
                return False
            except Exception as e:
                logger.error(f"[Twilio VerifyCheck] Exception: {e}")
                return False

    # For standard/mock modes, caller checks OTP hash locally
    return False
