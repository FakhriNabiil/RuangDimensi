"""Pydantic validation schemas for API inputs.

The service layer calls these before any write operation.
"""

from enum import Enum
from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class AssetCategory(str, Enum):
    """Allowed asset categories."""
    ENVIRONMENT = "Environment"
    CHARACTER = "Character"
    PROPS = "Props"
    VEHICLE = "Vehicle"
    ARCHITECTURE = "Architecture"
    OTHER = "Other"


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------

class RegisterInput(BaseModel):
    """Validation schema for user registration."""
    username: str = Field(..., min_length=3, max_length=30)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        """Basic email format check."""
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email format")
        return v.lower().strip()

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Username must be alphanumeric (underscores allowed)."""
        if not v.replace("_", "").isalnum():
            raise ValueError("Username must be alphanumeric (underscores allowed)")
        return v.strip()


class LoginInput(BaseModel):
    """Validation schema for login."""
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Asset schemas
# ---------------------------------------------------------------------------

class AssetCreateInput(BaseModel):
    """Validation schema for creating a new asset."""
    NamaAset: str = Field(..., min_length=1, max_length=100)
    Deskripsi: str = Field("", max_length=500)
    Kategori: AssetCategory
    HargaJuta: float = Field(..., ge=0)


class AssetUpdateInput(BaseModel):
    """Validation schema for updating an asset (all fields optional)."""
    NamaAset: str | None = Field(None, min_length=1, max_length=100)
    Deskripsi: str | None = Field(None, max_length=500)
    Kategori: AssetCategory | None = None
    HargaJuta: float | None = Field(None, ge=0)
