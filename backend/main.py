import os
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import (
    auth, jobs, resumes, candidates, ranking, analysis, interviews, analytics, reports, hiring
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ResumeAI API",
    description="Enterprise AI-Powered HR Recruitment & Intelligent Resume Analysis Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration - Permissive for dev environments and local ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.exception(f"Unhandled error processing {request.method} {request.url}: {exc}")
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Access-Control-Allow-Methods"] = "*"
        headers["Access-Control-Allow-Headers"] = "*"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
        headers=headers
    )

# Include Routers under API_V1_STR
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(resumes.router, prefix=settings.API_V1_STR)
app.include_router(candidates.router, prefix=settings.API_V1_STR)
app.include_router(ranking.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(interviews.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(hiring.router, prefix=settings.API_V1_STR)

@app.get("/")
def health_check():
    return {
        "status": "active",
        "platform": "ResumeAI Enterprise Production Platform",
        "database": "Live Relational Persistence",
        "ml_engine": "SentenceTransformers all-MiniLM-L6-v2 + TF-IDF",
        "api_docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
