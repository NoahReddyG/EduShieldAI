from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
def login_user(credentials: LoginRequest):
    """
    Authenticates students or faculty and issues user roles.
    """
    # Demo mock authentication
    if credentials.email.endswith("@admin.com"):
        role = "FACULTY"
    else:
        role = "STUDENT"

    return {
        "access_token": "demo_jwt_token_edushield_12345",
        "token_type": "bearer",
        "user_id": 1,
        "email": credentials.email,
        "role": role,
    }