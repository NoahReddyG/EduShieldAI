import enum 
from datetime import datetime 
from typing import List ,TYPE_CHECKING 
from sqlalchemy import String ,Boolean ,DateTime ,Enum ,func 
from sqlalchemy .orm import Mapped ,mapped_column ,relationship 
from backend .database import Base 

if TYPE_CHECKING :
    from backend .models .session import ExamSession 

class UserRole (str ,enum .Enum ):
    STUDENT ="STUDENT"
    FACULTY ="FACULTY"
    ADMIN ="ADMIN"

class User (Base ):
    __tablename__ ="users"

    user_id :Mapped [int ]=mapped_column (primary_key =True ,index =True ,autoincrement =True )
    name :Mapped [str ]=mapped_column (String (100 ),nullable =False )
    email :Mapped [str ]=mapped_column (String (100 ),unique =True ,index =True ,nullable =False )
    password_hash :Mapped [str ]=mapped_column (String (255 ),nullable =False )
    role :Mapped [UserRole ]=mapped_column (
    Enum (UserRole ),
    default =UserRole .STUDENT ,
    nullable =False 
    )

    accessibility_mode :Mapped [bool ]=mapped_column (Boolean ,default =False )
    preferred_font_scale :Mapped [float ]=mapped_column (default =1.0 )

    created_at :Mapped [datetime ]=mapped_column (
    DateTime (timezone =True ),
    server_default =func .now ()
    )

    exam_sessions :Mapped [List ["ExamSession"]]=relationship (
    "ExamSession",
    back_populates ="student",
    cascade ="all, delete-orphan"
    )

    def as_dict (self )->dict :
        return {
        "user_id":self .user_id ,
        "name":self .name ,
        "email":self .email ,
        "role":self .role .value ,
        "accessibility_mode":self .accessibility_mode ,
        "created_at":self .created_at .isoformat ()if self .created_at else None ,
        }
