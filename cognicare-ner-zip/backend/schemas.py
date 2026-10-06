from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ============================================================
# Game Session Schema
# Used when a cognitive game sends performance data
# ============================================================

class GameSessionCreate(BaseModel):
    game: str = Field(
        min_length=1,
        max_length=100,
    )

    difficulty: str = Field(
        min_length=1,
        max_length=50,
    )

    accuracy: float = Field(
        ge=0,
        le=100,
    )

    mistakes: int = Field(
        ge=0,
    )

    time: int = Field(
        ge=0,
    )

    completed: bool = True

    # Memory Match
    matches: Optional[int] = Field(
        default=None,
        ge=0,
    )

    # Sequence Memory
    sequenceLength: Optional[int] = Field(
        default=None,
        ge=0,
    )

    # Object Recall
    targetCount: Optional[int] = Field(
        default=None,
        ge=0,
    )

    # Object Recall
    correct: Optional[int] = Field(
        default=None,
        ge=0,
    )

    wrong: Optional[int] = Field(
        default=None,
        ge=0,
    )


# ============================================================
# Memory Create Schema
# ============================================================

class MemoryCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str = Field(
        min_length=1,
        max_length=5000,
    )

    category: str = Field(
        default="General",
        max_length=50,
    )

    memoryDate: Optional[date] = None


# ============================================================
# Memory Update Schema
# ============================================================

class MemoryUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=5000,
    )

    category: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    memoryDate: Optional[date] = None


# ============================================================
# Reminder Create Schema
# ============================================================

class ReminderCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str = Field(
        min_length=1,
        max_length=5000,
    )

    category: str = Field(
        default="General",
        max_length=50,
    )

    dueDatetime: Optional[datetime] = None

    completed: bool = False


# ============================================================
# Reminder Update Schema
# ============================================================

class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=5000,
    )

    category: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    dueDatetime: Optional[datetime] = None

    completed: Optional[bool] = None


# ============================================================
# User Registration Schema
# Used when creating a new account
# ============================================================

class UserCreate(BaseModel):
    full_name: str = Field(
        min_length=1,
        max_length=200,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: str = Field(
        default="elderly",
        pattern="^(elderly|caregiver)$",
    )


# ============================================================
# User Login Schema
# ============================================================

class UserLogin(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=1,
        max_length=128,
    )


# ============================================================
# Token Response Schema
# Returned after successful login
# ============================================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ============================================================
# Public User Response Schema
# IMPORTANT:
# hashed_password is never returned
# ============================================================

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime


# ============================================================
# Caregiver Link Create Schema
# Used by a caregiver to request a connection
# with an elderly user's account
# ============================================================

class CaregiverLinkCreate(BaseModel):
    elderly_email: EmailStr


# ============================================================
# Caregiver Link Decision Schema
# Used by an elderly user to approve or reject
# a caregiver's request
# ============================================================

class CaregiverLinkDecision(BaseModel):
    status: Literal["approved", "rejected"]


# ============================================================
# Caregiver Link Response Schema
# Includes readable user information for the UI
# ============================================================

class CaregiverLinkResponse(BaseModel):
    id: int

    caregiver_id: int
    caregiver_name: str
    caregiver_email: EmailStr

    elderly_id: int
    elderly_name: str
    elderly_email: EmailStr

    status: Literal[
        "pending",
        "approved",
        "rejected",
    ]

    created_at: datetime