"""
Isolated Sandbox Demo Seeder.
This script is strictly for optional sandbox/testing and is NEVER called automatically by the production server.
Run manually: python seed_demo.py
"""
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.models import (
    Organization, User, Job, JobRequirement, Resume, Candidate, CandidateSkill,
    Application, AnalysisResult, Interview
)
from app.services.nlp_engine import calculate_hybrid_match

Base.metadata.create_all(bind=engine)

def seed_isolated_demo():
    db = SessionLocal()
    try:
        print("[Demo Sandbox] Seeding isolated testing records...")
        
        # Check if HR manager already exists
        hr = db.query(User).filter(User.email == "hr@resumeai.io").first()
        if not hr:
            org = Organization(name="Aethelgard Global Technologies", domain="aethelgard.io")
            db.add(org)
            db.commit()
            db.refresh(org)

            hr = User(
                org_id=org.id,
                email="hr@resumeai.io",
                hashed_password=hash_password("Password123!"),
                full_name="Eleanor Vance",
                role="hr_manager"
            )
            cand_user = User(
                org_id=None,
                email="candidate@resumeai.io",
                hashed_password=hash_password("Password123!"),
                full_name="Julian Drake",
                role="candidate"
            )
            db.add_all([hr, cand_user])
            db.commit()
            print("[Demo Sandbox] Baseline HR and Candidate users initialized.")
        else:
            print("[Demo Sandbox] Base accounts already exist.")
            
    except Exception as e:
        print(f"[Demo Sandbox Error] {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_isolated_demo()

