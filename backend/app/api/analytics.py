from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_hr_role
from app.models.models import Job, Candidate, Resume, Application, AnalysisResult, Interview, CandidateSkill, User
from app.schemas.schemas import RecruitmentMetricsResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/recruitment-metrics", response_model=RecruitmentMetricsResponse)
def get_recruitment_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr_role)
):
    # 1. Real Aggregations from DB
    active_jobs = db.query(Job).filter(Job.status == "active").count()
    total_candidates = db.query(Candidate).count()
    resumes_analyzed = db.query(AnalysisResult).count()
    shortlisted = db.query(Application).filter(Application.status == "Shortlisted").count()
    interviews_scheduled = db.query(Interview).filter(Interview.status == "Scheduled").count()
    pending_reviews = db.query(Application).filter(Application.status.in_(["Applied", "AI Screened", "HR Review"])).count()

    # 2. Pipeline Stages Breakdown
    all_apps = db.query(Application).all()
    pipeline_counts = {
        "Applied": 0,
        "AI Screened": 0,
        "HR Review": 0,
        "Shortlisted": 0,
        "Technical Interview": 0,
        "HR Interview": 0,
        "Selected": 0,
        "Not Selected": 0
    }
    for app in all_apps:
        if app.status in pipeline_counts:
            pipeline_counts[app.status] += 1
        else:
            pipeline_counts["Applied"] += 1

    # 3. Match Score Distribution
    all_analyses = db.query(AnalysisResult.overall_score).all()
    dist = {"Under 50%": 0, "50% - 69%": 0, "70% - 84%": 0, "85% - 100%": 0}
    for (score,) in all_analyses:
        if score < 50:
            dist["Under 50%"] += 1
        elif score < 70:
            dist["50% - 69%"] += 1
        elif score < 85:
            dist["70% - 84%"] += 1
        else:
            dist["85% - 100%"] += 1

    match_dist_list = [{"range": k, "count": v} for k, v in dist.items()]

    # 4. Top Skills in Demand across Jobs
    jobs = db.query(Job).all()
    skill_counter = Counter()
    for j in jobs:
        for s in (j.mandatory_skills or []):
            skill_counter[s] += 2
        for s in (j.preferred_skills or []):
            skill_counter[s] += 1

    top_skills = [{"skill": k, "demand_score": v} for k, v in skill_counter.most_common(8)]

    # 5. Applications per Job
    job_apps = []
    for j in jobs[:6]:
        count = db.query(Application).filter(Application.job_id == j.id).count()
        job_apps.append({
            "job_title": j.title[:22] + "..." if len(j.title) > 22 else j.title,
            "applications": count
        })

    # 6. Real Recruitment Conversions
    has_apps = len(all_apps) > 0
    total_apps_count = len(all_apps) if has_apps else 1
    screened_count = db.query(Application).filter(Application.status != "Applied").count()
    interview_count = db.query(Application).filter(Application.status.in_(["Technical Interview", "HR Interview", "Selected"])).count()
    selected_count = db.query(Application).filter(Application.status == "Selected").count()

    conversion_rates = {
        "screening_rate": round((screened_count / total_apps_count) * 100, 1) if has_apps else 0.0,
        "shortlist_rate": round((shortlisted / total_apps_count) * 100, 1) if has_apps else 0.0,
        "interview_rate": round((interview_count / total_apps_count) * 100, 1) if has_apps else 0.0,
        "offer_rate": round((selected_count / total_apps_count) * 100, 1) if has_apps else 0.0
    }

    avg_score = round(sum(s[0] for s in all_analyses) / len(all_analyses), 1) if all_analyses else 0.0

    return RecruitmentMetricsResponse(
        active_jobs=active_jobs,
        total_candidates=total_candidates,
        resumes_analyzed=resumes_analyzed,
        shortlisted_candidates=shortlisted,
        interviews_scheduled=interviews_scheduled,
        pending_reviews=pending_reviews,
        pipeline_stages=pipeline_counts,
        match_distribution=match_dist_list,
        top_skills_in_demand=top_skills,
        applications_per_job=job_apps,
        conversion_rates=conversion_rates,
        average_match_score=avg_score
    )

