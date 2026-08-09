import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Float, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base

if TYPE_CHECKING:
    from backend.models.user import User
    from backend.models.anomaly import AnomalyLog


class SessionStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FLAGGED = "FLAGGED"


class ExamSession(Base):
    __tablename__ = "exam_sessions"

    session_id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    exam_title: Mapped[str] = mapped_column(String(150), nullable=False)
    
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now()
    )
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Trust Score (starts at 100%, drops as flags trigger)
    trust_score: Mapped[float] = mapped_column(Float, default=100.0)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus), 
        default=SessionStatus.IN_PROGRESS, 
        nullable=False
    )

    # Relationships
    student: Mapped["User"] = relationship("User", back_populates="exam_sessions")
    anomaly_logs: Mapped[List["AnomalyLog"]] = relationship(
        "AnomalyLog", 
        back_populates="session", 
        cascade="all, delete-orphan"
    )

    def as_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "student_id": self.student_id,
            "exam_title": self.exam_title,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "trust_score": self.trust_score,
            "status": self.status.value,
        }