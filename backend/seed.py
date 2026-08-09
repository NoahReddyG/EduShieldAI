import sys 
from pathlib import Path 

ROOT_DIR =Path (__file__ ).resolve ().parent .parent 
if str (ROOT_DIR )not in sys .path :
    sys .path .insert (0 ,str (ROOT_DIR ))

from backend .database import SessionLocal ,engine ,Base 
from backend .models .user import User ,UserRole 
from backend .models .session import ExamSession ,SessionStatus 
from backend .models .anomaly import AnomalyLog ,FlagType 

def seed_database ():
    print ("🌱 Seeding database with mock data...")
    Base .metadata .create_all (bind =engine )
    db =SessionLocal ()

    try :

        if db .query (User ).filter (User .email =="student@edushield.ai").first ():
            print ("⚠️ Seed data already exists in MySQL.")
            return 

        student =User (
        name ="Alex Rivera",
        email ="student@edushield.ai",
        password_hash ="hashed_pw_123",
        role =UserRole .STUDENT ,
        accessibility_mode =True ,
        preferred_font_scale =1.2 ,
        )
        faculty =User (
        name ="Dr. Sarah Connor",
        email ="faculty@edushield.ai",
        password_hash ="hashed_pw_456",
        role =UserRole .FACULTY ,
        )
        db .add_all ([student ,faculty ])
        db .commit ()
        db .refresh (student )

        session =ExamSession (
        student_id =student .user_id ,
        exam_title ="CS202: Data Structures & Algorithms",
        trust_score =88.5 ,
        status =SessionStatus .IN_PROGRESS ,
        )
        db .add (session )
        db .commit ()
        db .refresh (session )

        anomalies =[
        AnomalyLog (
        session_id =session .session_id ,
        flag_type =FlagType .GAZE_OFFSCREEN ,
        confidence_score =0.92 ,
        details ="Gaze deflected right for 4 seconds",
        ),
        AnomalyLog (
        session_id =session .session_id ,
        flag_type =FlagType .AUDIO_DISTURBANCE ,
        confidence_score =0.85 ,
        details ="Background speech detected",
        ),
        ]
        db .add_all (anomalies )
        db .commit ()

        print ("✅ Database successfully seeded!")
        print (f"   Created User ID: {student .user_id }")
        print (f"   Created Session ID: {session .session_id }")
        print (f"   Logged {len (anomalies )} anomalies.")

    except Exception as e :
        print (f"❌ Error seeding database: {e }")
        db .rollback ()
    finally :
        db .close ()

if __name__ =="__main__":
    seed_database ()
