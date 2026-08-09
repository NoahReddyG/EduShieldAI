import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base

if TYPE_CHECKING:
    from backend.models.session import ExamSession


class FlagType(str, enum.Enum):
    GAZE_OFFSCREEN = "GAZE_OFFSCREEN"
    MULTIPLE_FACES = "MULTIPLE_FACES"
    NO_FACE_DETECTED = "NO_FACE_DETECTED"
    AUDIO_DISTURBANCE = "AUDIO_DISTURBANCE"


class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"

    log_id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("exam_sessions.session_id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    flag_type: Mapped[FlagType] = mapped_column(Enum(FlagType), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    details: Mapped[str] = mapped_column(String(255), nullable=True)
    
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )

    # Relationships
    session: Mapped["ExamSession"] = relationship("ExamSession", back_populates="anomaly_logs")

    def as_dict(self) -> dict:
        return {
            "log_id": self.log_id,
            "session_id": self.session_id,
            "flag_type": self.flag_type.value,
            "confidence_score": self.confidence_score,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }