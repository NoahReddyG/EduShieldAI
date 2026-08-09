from datetime import datetime 
from typing import Optional ,List 
from pydantic import BaseModel ,ConfigDict ,Field 
from backend .models .session import SessionStatus 

class ExamSessionBase (BaseModel ):
    exam_title :str =Field (...,example ="CS101: Data Structures Final Exam")

class ExamSessionCreate (ExamSessionBase ):
    student_id :int =Field (...,example =1 )

class ExamSessionUpdate (BaseModel ):
    end_time :Optional [datetime ]=None 
    trust_score :Optional [float ]=Field (None ,ge =0.0 ,le =100.0 ,example =85.5 )
    status :Optional [SessionStatus ]=None 

class ExamSessionResponse (ExamSessionBase ):
    session_id :int 
    student_id :int 
    start_time :datetime 
    end_time :Optional [datetime ]=None 
    trust_score :float 
    status :SessionStatus 

    model_config =ConfigDict (from_attributes =True )
