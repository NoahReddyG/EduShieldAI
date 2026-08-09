from typing import List 
from fastapi import APIRouter ,Depends ,HTTPException ,status 
from sqlalchemy .orm import Session 

from backend .database import get_db 
from backend .models .session import ExamSession 
from backend .models .anomaly import AnomalyLog 
from backend .schemas .session_schema import ExamSessionResponse 
from backend .schemas .anomaly_schema import AnomalyLogResponse 

router =APIRouter ()

@router .get ("/sessions/{session_id}/report")
def get_session_full_report (session_id :int ,db :Session =Depends (get_db )):
    """
    Retrieves complete post-exam analytics for a single session, including full timeline logs.
    """
    session =db .query (ExamSession ).filter (ExamSession .session_id ==session_id ).first ()
    if not session :
        raise HTTPException (
        status_code =status .HTTP_404_NOT_FOUND ,
        detail ="Exam session not found"
        )

    anomalies =db .query (AnomalyLog ).filter (AnomalyLog .session_id ==session_id ).all ()

    return {
    "session_info":ExamSessionResponse .model_validate (session ),
    "total_anomalies_flagged":len (anomalies ),
    "anomaly_timeline":[AnomalyLogResponse .model_validate (a )for a in anomalies ],
    "integrity_rating":"PASS"if session .trust_score >=70.0 else "REVIEW_REQUIRED"
    }
