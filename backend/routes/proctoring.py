from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.session import ExamSession, SessionStatus
from backend.models.anomaly import AnomalyLog, FlagType
from backend.schemas.session_schema import (
    ExamSessionCreate,
    ExamSessionUpdate,
    ExamSessionResponse,
)
from backend.schemas.anomaly_schema import (
    AnomalyLogCreate,
    AnomalyLogResponse,
)

router = APIRouter()

# Penalty values for different anomaly types (deducted from 100% initial Trust Score)
PENALTY_WEIGHTS = {
    FlagType.GAZE_OFFSCREEN: 2.5,
    FlagType.MULTIPLE_FACES: 15.0,
    FlagType.NO_FACE_DETECTED: 5.0,
    FlagType.AUDIO_DISTURBANCE: 3.0,
}


@router.post("/sessions", response_model=ExamSessionResponse, status_code=status.HTTP_201_CREATED)
def create_exam_session(
    session_data: ExamSessionCreate, 
    db: Session = Depends(get_db)
):
    """
    Starts a new proctored exam session for a student.
    """
    new_session = ExamSession(
        student_id=session_data.student_id,
        exam_title=session_data.exam_title,
        trust_score=100.0,
        status=SessionStatus.IN_PROGRESS,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.post("/anomalies", response_model=AnomalyLogResponse, status_code=status.HTTP_201_CREATED)
def log_proctoring_anomaly(
    anomaly_data: AnomalyLogCreate, 
    db: Session = Depends(get_db)
):
    """
    Logs an anomaly flag from MediaPipe (frontend) into MySQL and automatically updates the session's trust score.
    """
    # Verify exam session exists
    session = db.query(ExamSession).filter(ExamSession.session_id == anomaly_data.session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Exam session not found"
        )

    # Record anomaly event
    new_anomaly = AnomalyLog(
        session_id=anomaly_data.session_id,
        flag_type=anomaly_data.flag_type,
        confidence_score=anomaly_data.confidence_score,
        details=anomaly_data.details,
    )
    db.add(new_anomaly)

    # Recalculate dynamic Trust Score
    deduction = PENALTY_WEIGHTS.get(anomaly_data.flag_type, 2.0) * anomaly_data.confidence_score
    session.trust_score = max(0.0, float(session.trust_score) - deduction)
    
    # Flag session if trust score drops below critical threshold (e.g. 60%)
    if session.trust_score < 60.0:
        session.status = SessionStatus.FLAGGED

    db.commit()
    db.refresh(new_anomaly)
    return new_anomaly


@router.patch("/sessions/{session_id}", response_model=ExamSessionResponse)
def update_exam_session(
    session_id: int, 
    update_data: ExamSessionUpdate, 
    db: Session = Depends(get_db)
):
    """
    Updates session state (e.g., marks exam as COMPLETED upon submission).
    """
    session = db.query(ExamSession).filter(ExamSession.session_id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Exam session not found"
        )

    if update_data.end_time:
        session.end_time = update_data.end_time
    if update_data.trust_score is not None:
        session.trust_score = update_data.trust_score
    if update_data.status:
        session.status = update_data.status

    db.commit()
    db.refresh(session)
    return session