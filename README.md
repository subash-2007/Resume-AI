# ResumeAI
### Enterprise AI-Powered HR Recruitment & Intelligent Resume Analysis Platform

ResumeAI is an enterprise-oriented SaaS recruitment intelligence platform with two experiences: an **HR Recruitment Portal** and a **Candidate Career Portal**. Both are powered by a centralized Python-based Machine Learning (ML) and Natural Language Processing (NLP) engine.

The platform also includes a **Bulk Hiring & Intelligent Resume Screening Portal** designed to process large batches of PDF and DOCX resumes through asynchronous background processing.

---

## Table of Contents

- [Key Features](#key-features)
- [Design System](#design-system)
- [System Architecture](#system-architecture)
- [Hybrid Matching Methodology](#hybrid-matching-methodology)
- [Bulk Hiring Workflow](#bulk-hiring-workflow)
- [Platform Modules](#platform-modules)
- [Database Architecture](#database-architecture)
- [API Reference](#api-reference)
- [Demo Credentials](#demo-credentials)
- [Technology Stack](#technology-stack)
- [Run Locally](#run-locally)

---

## Key Features

- Separate HR recruiter and candidate portals.
- Resume parsing for PDF and DOCX documents.
- NLP-based extraction of candidate information and skills.
- Hybrid resume-to-job matching using skill, semantic, experience, education, technology, and domain signals.
- Mandatory-skill deficit warnings to support recruiter review.
- Bulk resume ingestion with background processing and progress tracking.
- Candidate ranking, filtering, comparison, and CSV export.
- Candidate dossiers with extracted information and score explanations.
- Interview pipeline management and recruiter notes.
- Recruitment analytics and downloadable PDF reports.

---

## Design System

The application follows a consistent three-colour design system across its interfaces, components, charts, and PDF reports.

| Role | Colour | Hex Code | Usage |
|---|---|---|---|
| Primary | Mocha Brown | `#6F4E37` | Main backgrounds, sidebars, headers, cards, and input containers |
| Secondary | Platinum Silver | `#E5E4E2` | Headings, primary typography, borders, and dividers |
| Accent | Pale Lavender | `#E6E0F0` | Interactive buttons, active navigation, progress indicators, and badges |

### Typography and Iconography

- **Headings:** Playfair Display
- **Body and data:** Inter
- **Buttons and badges:** Inter SemiBold
- **Icons:** Lucide React
- **Emoji usage:** No emojis in interface text, notifications, buttons, navigation, tooltips, or alerts.

---

## System Architecture

```text
Resume Documents (PDF / DOCX)
              |
              v
     Document Extraction
       PyMuPDF / python-docx
              |
              v
       NLP Entity Extractor
              |
       +------+------+
       |             |
       v             v
 Global Skill     TF-IDF Keyword
 Taxonomy         Engine
 (Synonyms and    (Scikit-learn
 Acronyms)         Vectorizer)
       |             |
       +------+------+
              |
              v
   Sentence Transformers
       all-MiniLM-L6-v2
              |
              v
    Explainable Hybrid Scorer
              |
              v
 Candidate Match Score and Explanation
```

### Processing Overview

1. The user uploads a PDF or DOCX resume.
2. The document extraction layer reads the resume content.
3. The NLP layer extracts candidate details, education, skills, experience, projects, internships, and certifications.
4. Skill normalization maps recognized synonyms and acronyms to a common skill taxonomy.
5. TF-IDF and Sentence Transformers generate keyword-based and semantic representations.
6. The hybrid scoring engine calculates the final match score.
7. The platform stores the analysis and presents the result to the HR recruiter or candidate.

---

## Hybrid Matching Methodology

ResumeAI uses an explainable composite scoring formula:

\[
\text{Final Score} =
(S_{\text{skill}} \times 0.35) +
(S_{\text{semantic}} \times 0.25) +
(S_{\text{exp}} \times 0.15) +
(S_{\text{edu}} \times 0.10) +
(S_{\text{tech}} \times 0.10) +
(S_{\text{domain}} \times 0.05)
\]

| Component | Weight |
|---|---:|
| Skill match | 35% |
| Semantic similarity | 25% |
| Experience | 15% |
| Education | 10% |
| Technical match | 10% |
| Domain match | 5% |
| **Total** | **100%** |

**Mandatory requirement guardrail:** A high semantic similarity score must not hide a missing mandatory requirement. The platform flags mandatory-skill deficits so that recruiters can review those candidates.

---

## Bulk Hiring Workflow

The `/hiring` route provides a five-step recruitment workflow.

```text
Create Job
    |
    v
Bulk Resume Upload
    |
    v
AI Resume Analysis
    |
    v
Candidate Rankings
    |
    v
Candidate Dossier
```

### Step 1 — Create Job

The recruiter can provide the following vacancy details:

1. Job title
2. Company name
3. Department
4. Job location
5. Employment type
6. Required experience
7. Education qualification
8. Mandatory skills
9. Preferred skills
10. Job description
11. Number of vacancies
12. Application deadline

The **Create Job & Continue** action validates the required fields, stores the job and hiring campaign records, generates a unique Job ID (for example, `JOB-0001`), and moves to the upload stage.

### Step 2 — Bulk Resume Upload

The upload interface displays the active job title, company name, Job ID, and job description summary.

Features described for this workflow:

- Bulk PDF and DOCX selection.
- Drag-and-drop upload.
- Folder upload using `webkitdirectory`.
- Chunked uploads using 64 KB buffers.
- Batch handling in groups of 50 files.
- SHA-256 duplicate detection.
- File extension validation.
- Failed-upload retry support.
- Background processing queue.

The project specification targets 500+ to 1,000+ resumes and 10 GB+ aggregate upload capacity. Actual capacity depends on the deployed infrastructure and must be load-tested.

### Step 3 — AI Resume Analysis

The processing pipeline extracts and evaluates:

1. Candidate personal information — name, email, phone, and location.
2. Education and degree details.
3. Technical skills.
4. Work experience and chronology.
5. Projects and practical experience.
6. Internships.
7. Certifications and credentials.
8. Job requirement comparison.
9. Hybrid ML matching using Sentence Transformers and TF-IDF.
10. Database persistence.

The interface provides a progress bar, queue statuses (Pending, In Progress, Completed, and Failed), and per-file processing logs.

### Step 4 — Candidate Rankings

Candidates are ranked by their calculated match scores. The ranking view can display:

- Rank
- Candidate name and email
- Match score
- Experience duration
- Education degree
- Matched skills
- Mandatory requirement status
- Recruitment review status

Recruiters can search, filter by experience and mandatory-skill coverage, filter by status, sort results, paginate, and export candidate data to CSV.

### Step 5 — Candidate Dossier

Selecting a candidate opens a detailed profile containing:

- Contact details and location.
- Verified experience information.
- Overall compatibility score.
- Six-component score breakdown.
- Radar chart.
- Matched and missing skills.
- Extracted education, experience, projects, internships, and certifications.
- Resume preview and download.
- Recruiter actions: Shortlist, Under Review, Schedule Interview, and Reject.
- Timestamped recruiter notes.

---

## Platform Modules

### 1. HR Recruitment Portal — `/hr`

- **Overview dashboard:** Database-driven metrics for active jobs, candidates ingested, resumes analyzed, shortlisted candidates, scheduled interviews, and pending reviews.
- **Job management:** Create, edit, publish, close, and delete job openings.
- **Job requirement analysis:** Extract technical skills, soft skills, mandatory and preferred requirements, experience, and education from job descriptions.
- **Resume screening:** Single and bulk PDF/DOCX uploads with duplicate-profile prevention and background scoring.
- **Candidate ranking:** Sortable candidate matrix with component scores and mandatory requirement warnings.
- **Candidate comparison:** Multi-candidate radar and bar charts using Recharts.
- **Interview coordination:** Seven-stage recruitment pipeline:

  `Applied → AI Screened → HR Review → Shortlisted → Technical Interview → HR Interview → Selected / Not Selected`

- **Recruitment analytics:** Conversion metrics, match-score distributions, and in-demand skills.
- **PDF reports:** Downloadable candidate reports generated using ReportLab.

### 2. Candidate Career Portal — `/candidate`

- Candidate overview and compatibility metrics.
- Resume upload and parsing preview.
- Extraction preview for email, phone, degrees, experience, and skills.
- Resume matching against published jobs.
- Custom job-description analysis.
- Mandatory and preferred skill-gap identification.
- Actionable upskilling recommendations.
- Evaluation history and downloadable PDF reports.

---

## Database Architecture

The platform uses SQLAlchemy and supports SQLite and PostgreSQL.

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | Accounts, bcrypt password hashes, roles, and organization linkage |
| `Organization` | `organizations` | Organization records and domains |
| `Job` | `jobs` | Job openings, requirements, vacancies, deadlines, and scoring weights |
| `JobRequirement` | `job_requirements` | Extracted skills, qualifications, tools, and experience thresholds |
| `Candidate` | `candidates` | Candidate profiles, contact details, and total experience |
| `Resume` | `resumes` | Uploaded files, SHA-256 hashes, file types, and parsed JSON |
| `Application` | `applications` | Candidate applications, job linkage, status, and timestamps |
| `AnalysisResult` | `analysis_results` | Component scores, overall match, matched skills, missing skills, and explanations |
| `Interview` | `interviews` | Interview schedules, types, feedback, and ratings |
| `AuditLog` | `audit_logs` | Audit trail of recruiter and administrative actions |
| `HiringCampaign` | `hiring_campaigns` | Bulk recruitment campaigns linked to jobs |
| `ProcessingJob` | `processing_jobs` | Asynchronous batch-processing queue and status |
| `ProcessingLog` | `processing_logs` | Per-file processing stages, sizes, statuses, and messages |
| `CandidateNote` | `candidate_notes` | Recruiter notes and candidate evaluations |

---

## API Reference

Base path: `/api/v1`

### Bulk Hiring and Screening

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/hiring/campaigns` | Create a job and hiring campaign |
| `GET` | `/hiring/campaigns` | List hiring campaigns |
| `GET` | `/hiring/campaigns/{id}` | Retrieve campaign details |
| `POST` | `/hiring/campaigns/{id}/upload-batch` | Upload a batch of resumes |
| `POST` | `/hiring/campaigns/{id}/upload-chunk` | Upload a file chunk |
| `POST` | `/hiring/campaigns/{id}/complete-chunk-upload` | Reassemble uploaded chunks and enqueue processing |
| `GET` | `/hiring/campaigns/{id}/progress` | Retrieve processing progress and logs |
| `GET` | `/hiring/campaigns/{id}/rankings` | Retrieve ranked candidates |
| `GET` | `/hiring/candidates/{id}/detail` | Retrieve candidate dossier |
| `POST` | `/hiring/candidates/{id}/action` | Record recruiter action and notes |
| `GET` | `/hiring/resumes/{id}/preview` | Stream a resume for preview |
| `GET` | `/hiring/resumes/{id}/download` | Download the original resume |
| `GET` | `/hiring/campaigns/{id}/analytics` | Retrieve campaign analytics |

### Core API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/token` | Generate OAuth2 password token |
| `POST` | `/auth/register` | Register a user |
| `GET` | `/auth/me` | Retrieve authenticated user profile |
| `GET`, `POST` | `/jobs` | List and create jobs |
| `POST` | `/jobs/analyze-requirements` | Analyze job requirements |
| `POST` | `/resumes/upload` | Upload and parse a single resume |
| `POST` | `/resumes/upload-bulk` | Bulk resume screening |
| `POST` | `/analysis/match` | Run hybrid ML candidate evaluation |
| `GET` | `/ranking/job/{job_id}` | Retrieve candidate rankings for a job |
| `POST` | `/ranking/compare` | Compare multiple candidates |
| `GET`, `POST` | `/interviews` | List and schedule interviews |
| `GET` | `/reports/generate/{analysis_id}` | Generate a PDF report |
| `GET` | `/analytics/recruitment-metrics` | Retrieve HR dashboard metrics |

---

## Demo Credentials

The project specification lists the following local evaluation accounts:

| Portal | Email | Password | Role |
|---|---|---|---|
| HR Recruitment Portal | `hr@resumeai.io` | `Password123!` | `hr_manager` |
| Candidate Career Portal | `candidate@resumeai.io` | `Password123!` | `candidate` |

The Bulk Hiring Portal is specified to support guest recruiter access from the public landing page.

> **Security note:** These are demo credentials only. Do not use default credentials in a public or production deployment. Remove them from public documentation or replace them with secure environment-based credentials before publishing the repository.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| UI and charts | Lucide React, Recharts |
| Backend | Python, FastAPI, Uvicorn |
| ORM and database | SQLAlchemy, SQLite, PostgreSQL |
| Document processing | PyMuPDF, python-docx |
| Machine Learning / NLP | Scikit-learn, TF-IDF, Sentence Transformers |
| Embedding model | `all-MiniLM-L6-v2` |
| PDF reporting | ReportLab |
| Security | OAuth2 password flow, bcrypt password hashing |

---

## Run Locally

### Prerequisites

- Python installed.
- Node.js and npm installed.
- Git installed.
- Project dependencies available in the backend and frontend directories.

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

### 2. Start the Backend

```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API base URL:

`http://127.0.0.1:8000/api/v1`

Interactive Swagger documentation:

`http://127.0.0.1:8000/docs`

### 3. Start the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend application:

`http://127.0.0.1:5173`

Bulk Hiring Portal:

`http://127.0.0.1:5173/hiring`

---

## Important Implementation Note

This README describes the architecture, features, endpoints, and capacity targets stated in the project specification. Before presenting these as verified production capabilities, confirm that each feature is implemented and tested in the current codebase. In particular, bulk-upload capacity, asynchronous processing, security controls, model performance, and database-backed analytics should be validated in the deployed environment.
