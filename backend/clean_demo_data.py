from app.core.database import SessionLocal
from app.models.models import (
    Candidate, CandidateSkill, Resume, Job, JobRequirement,
    Application, AnalysisResult, SkillGap, Interview, Report, AuditLog
)

def clean_demo_data():
    db = SessionLocal()
    try:
        print("Clearing out demo data from database...")
        db.query(SkillGap).delete()
        db.query(Report).delete()
        db.query(Interview).delete()
        db.query(AnalysisResult).delete()
        db.query(Application).delete()
        db.query(CandidateSkill).delete()
        db.query(Candidate).delete()
        db.query(Resume).delete()
        db.query(JobRequirement).delete()
        db.query(Job).delete()
        db.query(AuditLog).delete()
        db.commit()
        print("Demo data removed successfully! Database is now clean.")
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_demo_data()

