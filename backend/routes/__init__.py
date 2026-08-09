from backend .routes .auth import router as auth_router 
from backend .routes .proctoring import router as proctoring_router 
from backend .routes .accessibility import router as accessibility_router 
from backend .routes .reports import router as reports_router 

__all__ =[
"auth_router",
"proctoring_router",
"accessibility_router",
"reports_router",
]
