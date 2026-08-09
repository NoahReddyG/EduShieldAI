from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.models.anomaly import FlagType


# --- Shared Base Properties ---
class AnomalyLogBase(BaseModel):
    flag_type: FlagType = Field(..., example=FlagType.GAZE_OFFSCREEN)
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0, example=0.92)
    details: Optional[str] = Field(default=None, example="Gaze deflected right for > 4 seconds")


# --- Schema for Logging an Anomaly Event (Request) ---
class AnomalyLogCreate(AnomalyLogBase):
    session_id: int = Field(..., example=1)


# --- Schema for Returning Anomaly Data (Response) ---
class AnomalyLogResponse(AnomalyLogBase):
    log_id: int
    session_id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)