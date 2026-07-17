import sqlite3
import os
from typing import Dict, Any, Optional
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "app.db")

def init_db():
    """Initialize SQLite database tables."""
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Profiles table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            education TEXT,
            graduationYear TEXT,
            target_role TEXT,
            avatarUrl TEXT,
            country_code TEXT,
            phone_number TEXT,
            phone_verified INTEGER DEFAULT 0,
            phone_verified_at TEXT
        )
    """)
    
    # OTP Verifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS otp_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT,
            phoneNumber TEXT,
            otpHash TEXT,
            expiresAt TEXT,
            attemptCount INTEGER DEFAULT 0,
            usedAt TEXT,
            createdAt TEXT
        )
    """)
    
    conn.commit()
    conn.close()

def get_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve user profile from database."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def save_profile(user_id: str, data: Dict[str, Any]):
    """Insert or update user profile."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Check if profile exists
    cursor.execute("SELECT 1 FROM profiles WHERE user_id = ?", (user_id,))
    exists = cursor.fetchone()
    
    if exists:
        # Update
        cursor.execute("""
            UPDATE profiles SET
                name = ?,
                email = ?,
                education = ?,
                graduationYear = ?,
                target_role = ?,
                avatarUrl = ?,
                country_code = ?,
                phone_number = ?,
                phone_verified = ?,
                phone_verified_at = ?
            WHERE user_id = ?
        """, (
            data.get("name"),
            data.get("email"),
            data.get("education"),
            data.get("graduationYear"),
            data.get("target_role"),
            data.get("avatarUrl"),
            data.get("country_code"),
            data.get("phone_number"),
            data.get("phone_verified", 0),
            data.get("phone_verified_at"),
            user_id
        ))
    else:
        # Insert
        cursor.execute("""
            INSERT INTO profiles (
                user_id, name, email, education, graduationYear, target_role,
                avatarUrl, country_code, phone_number, phone_verified, phone_verified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            data.get("name"),
            data.get("email"),
            data.get("education"),
            data.get("graduationYear"),
            data.get("target_role"),
            data.get("avatarUrl"),
            data.get("country_code"),
            data.get("phone_number"),
            data.get("phone_verified", 0),
            data.get("phone_verified_at")
        ))
    
    conn.commit()
    conn.close()

def invalidate_previous_otps(user_id: str, phone_number: str):
    """Mark all unused, active OTPs for this user & phone number as used/expired."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    now_str = datetime.utcnow().isoformat()
    cursor.execute("""
        UPDATE otp_verifications
        SET usedAt = ?
        WHERE userId = ? AND phoneNumber = ? AND usedAt IS NULL
    """, (now_str, user_id, phone_number))
    conn.commit()
    conn.close()

def save_otp_verification(user_id: str, phone_number: str, otp_hash: str, expires_at: datetime):
    """Insert a new OTP verification record."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    now_str = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO otp_verifications (
            userId, phoneNumber, otpHash, expiresAt, attemptCount, usedAt, createdAt
        ) VALUES (?, ?, ?, ?, 0, NULL, ?)
    """, (user_id, phone_number, otp_hash, expires_at.isoformat(), now_str))
    conn.commit()
    conn.close()

def get_active_otp_record(user_id: str, phone_number: str) -> Optional[Dict[str, Any]]:
    """Retrieve the latest active OTP record for the user and phone number."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM otp_verifications
        WHERE userId = ? AND phoneNumber = ? AND usedAt IS NULL
        ORDER BY id DESC LIMIT 1
    """, (user_id, phone_number))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def increment_otp_attempts(record_id: int):
    """Increment attempt count for a verification attempt."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE otp_verifications
        SET attemptCount = attemptCount + 1
        WHERE id = ?
    """, (record_id,))
    conn.commit()
    conn.close()

def mark_otp_as_used(record_id: int):
    """Mark OTP verification record as used."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    now_str = datetime.utcnow().isoformat()
    cursor.execute("""
        UPDATE otp_verifications
        SET usedAt = ?
        WHERE id = ?
    """, (now_str, record_id))
    conn.commit()
    conn.close()

def update_profile_verification(user_id: str, phone_number: str, verified: bool):
    """Update profile phone verified fields."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    now_str = datetime.utcnow().isoformat() if verified else None
    verified_int = 1 if verified else 0
    cursor.execute("""
        UPDATE profiles
        SET phone_verified = ?, phone_verified_at = ?
        WHERE user_id = ? AND phone_number = ?
    """, (verified_int, now_str, user_id, phone_number))
    conn.commit()
    conn.close()

def is_phone_number_verified_by_other(user_id: str, phone_number: str) -> bool:
    """Check if another user has already verified this phone number."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 1 FROM profiles
        WHERE phone_number = ? AND phone_verified = 1 AND user_id != ?
    """, (phone_number, user_id))
    row = cursor.fetchone()
    conn.close()
    return row is not None
