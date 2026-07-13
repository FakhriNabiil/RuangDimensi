"""Authentication service — hashing, JWT, register/login orchestration.

This module NEVER touches Flask request/response objects.  It receives
plain Python arguments and returns plain Python values or raises custom
exceptions from utils.exceptions.
"""

from datetime import datetime, timezone, timedelta

import bcrypt
import jwt

from config.settings import settings
from repositories import user_repo
from utils.exceptions import (
    ConflictError,
    UnauthorizedError,
    ValidationError,
)
from services.validators import RegisterInput, LoginInput
from pydantic import ValidationError as PydanticValidationError


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt (cost factor 12)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Check a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def generate_token(username: str) -> str:
    """Create a signed JWT with 24-hour expiry."""
    payload = {
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    """Decode and verify a JWT.

    Raises UnauthorizedError on any failure (expired, tampered, etc.).
    """
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("Token has expired")
    except jwt.InvalidTokenError:
        raise UnauthorizedError("Invalid token")


# ---------------------------------------------------------------------------
# High-level orchestration
# ---------------------------------------------------------------------------

def register_user(data: dict) -> dict:
    """Validate input, check uniqueness, hash password, persist user.

    Returns the created user data (without password hash).
    """
    # Validate
    try:
        validated = RegisterInput(**data)
    except PydanticValidationError as e:
        raise ValidationError(str(e.errors()[0]["msg"]))

    # Password must not equal username
    if validated.password.lower() == validated.username.lower():
        raise ValidationError("Password must not be the same as username")

    # Check duplicate
    if user_repo.get_user_by_username(validated.username):
        raise ConflictError(f"Username '{validated.username}' already exists")

    now = datetime.now(timezone.utc).isoformat()
    user_item = {
        "Username": validated.username,
        "Email": validated.email,
        "PasswordHash": hash_password(validated.password),
        "CreatedAt": now,
    }
    user_repo.create_user(user_item)

    return {"username": validated.username, "email": validated.email}


def login_user(data: dict) -> dict:
    """Verify credentials and return a JWT + username.

    Returns {"token": "...", "username": "..."}.
    """
    try:
        validated = LoginInput(**data)
    except PydanticValidationError as e:
        raise ValidationError(str(e.errors()[0]["msg"]))

    user = user_repo.get_user_by_username(validated.username)
    if not user or not verify_password(validated.password, user["PasswordHash"]):
        raise UnauthorizedError("Invalid username or password")

    token = generate_token(validated.username)
    return {"token": token, "username": validated.username}
