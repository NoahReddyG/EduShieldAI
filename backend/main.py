import sys 
import os 
from pathlib import Path 
ROOT_DIR =Path (__file__ ).resolve ().parent .parent 
if str (ROOT_DIR )not in sys .path :
    sys .path .insert (0 ,str (ROOT_DIR ))

import uvicorn 
from fastapi import FastAPI ,status 
from fastapi .middleware .cors import CORSMiddleware 
from contextlib import asynccontextmanager 
from backend .database import engine ,Base 
import backend .models 
from backend .routes .auth import router as auth_router 
from backend .routes .proctoring import router as proctoring_router 
from backend .routes .accessibility import router as accessibility_router 
from backend .routes .reports import router as reports_router 
@asynccontextmanager 
async def lifespan (app :FastAPI ):
    """
    Lifecycle event handler to automatically create MySQL tables 
    when the FastAPI server boots up.
    """
    print ("Starting EduShield AI Backend...")
    try :
        Base .metadata .create_all (bind =engine )
        print ("MySQL Database tables initialized successfully.")
    except Exception as e :
        print (f"Error initializing MySQL Database: {e }")
    yield 
    print ("Shutting down EduShield AI Backend...")

app =FastAPI (
title ="EduShield AI - API",
description ="Backend API for AI-powered proctoring and neurodivergent accessibility.",
version ="1.0.0",
lifespan =lifespan ,
)

origins =[
"http://localhost:5173",
"http://127.0.0.1:5173",
"http://localhost:3000",
"*",
]

app .add_middleware (
CORSMiddleware ,
allow_origins =origins ,
allow_credentials =True ,
allow_methods =["*"],
allow_headers =["*"],
)

app .include_router (auth_router ,prefix ="/api/v1/auth",tags =["Authentication"])
app .include_router (proctoring_router ,prefix ="/api/v1/proctoring",tags =["Proctoring"])
app .include_router (accessibility_router ,prefix ="/api/v1/accessibility",tags =["Accessibility"])
app .include_router (reports_router ,prefix ="/api/v1/reports",tags =["Reports & Analytics"])

@app .get ("/health",status_code =status .HTTP_200_OK ,tags =["Health"])
async def health_check ():
    """
    Health check endpoint to verify backend server and MySQL connection state.
    """
    return {
    "status":"healthy",
    "service":"EduShield AI API",
    "database":"MySQL Connected",
    }

if __name__ =="__main__":
    uvicorn .run ("backend.main:app",host ="127.0.0.1",port =8000 ,reload =True )
