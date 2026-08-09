from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from backend.models.session import SessionStatus


# --- Shared Base Properties ---
class ExamSessionBase(BaseModel):
    exam_title: str = Field(..., example="CS101: Data Structures Final Exam")


# --- Schema for Creating a Session (Request) ---
class ExamSessionCreate(ExamSessionBase):
    student_id: int = Field(..., example=1)


# --- Schema for Updating Session Status / Trust Score (Request) ---
class ExamSessionUpdate(BaseModel):
    end_time: Optional[datetime] = None
    trust_score: Optional[float] = Field(None, ge=0.0, le=100.0, example=85.5)
    status: Optional[SessionStatus] = None


# --- Schema for Returning Session Data (Response) ---
class ExamSessionResponse(ExamSessionBase):
    session_id: int
    student_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    trust_score: float
    status: SessionStatus

    # Allows Pydantic to read SQLAlchemy ORM models directly
    model_config = ConfigDict(from_attributes=True)