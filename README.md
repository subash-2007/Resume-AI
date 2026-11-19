# ResumeAI: Enterprise AI-Powered HR Recruitment & Intelligent Resume Analysis Platform

**ResumeAI** is an enterprise-grade SaaS recruitment intelligence platform designed with dual user experiences (HR Recruitment Portal and Candidate Career Portal) anchored upon a centralized Python Machine Learning and Natural Language Processing engine. It includes a dedicated **Bulk Hiring & Intelligent Resume Screening Portal** capable of processing 500+ to 1,000+ resumes asynchronously with zero memory exhaustion.

---

## 1. Strict Brand Design System

The entire application enforces an uncompromising three-color palette across all interfaces, components, charts, and ReportLab PDF documents:

| Role | Color Name | Hex Code | Visual Application |
| :--- | :--- | :--- | :--- |
| **Primary** | Mocha Brown | `#6F4E37` | Main backgrounds, sidebar bases, header chrome, card backgrounds, input containers |
| **Secondary** | Platinum Silver | `#E5E4E2` | Main headings, primary typography, borders, card outlines, subtle dividers |
| **Accent** | Pale Lavender | `#E6E0F0` | Interactive buttons, active navigation states, circular progress indicators, badges |

### Design Standards & Iconography
- **Headings**: `Playfair Display`, serif
- **Body & Data**: `Inter`, sans-serif
- **Buttons & Badges**: `Inter SemiBold`, sans-serif
- **Iconography**: Strictly Lucide React vector icons (`Layers`, `Briefcase`, `Users`, `FileText`, `UploadCloud`, `Cpu`, `CheckCircle2`, `AlertTriangle`).
- **Zero Emojis**: The entire application is completely emoji-free across hardcoded text, dynamic API messages, empty states, buttons, navigation items, tooltips, and alerts.

---

## 2. Centralized Machine Learning & NLP Architecture

```
                                  +-----------------------------+
                                  | Resume Documents (PDF/DOCX) |
                                  +--------------+--------------+
                                                 |
                                                 v
                                    [ PyMuPDF / python-docx ]
                                                 |
                                                 v
                                     [ NLP Entity Extractor ]
                                                 |
                       +-------------------------+-------------------------+
                       |                                                   |
                       v                                                   v
          [ Global Skill Taxonomy ]                             [ TF-IDF Keyword Engine ]
          (Synonym & Acronym Normalizer)                        (Scikit-Learn Vectorizer)
                       |                                                   |
                       +-------------------------+-------------------------+
                                                 |
                                                 v
                              [ Sentence Transformers Embeddings ]
                                    (all-MiniLM-L6-v2)
                                                 |
                                                 v
                                 [ Explainable Hybrid Scorer ]
```

### Explainable Composite Hybrid Formula
$$\text{Final Score} = (S_{\text{skill}} \times 0.35) + (S_{\text{semantic}} \times 0.25) + (S_{\text{exp}} \times 0.15) + (S_{\text{edu}} \times 0.10) + (S_{\text{tech}} \times 0.10) + (S_{\text{domain}} \times 0.05)$$

- **Mandatory Deficit Guardrail**: A high overall semantic score can never conceal a missing mandatory requirement. Deficit flags proactively notify human recruiters for review.

---

## 3. Bulk Hiring Portal: 5-Step Sequential Workflow

The `/hiring` route provides a high-scale, sequential bulk recruitment screening wizard:

```
[ Step 01: Create Job ] ──► [ Step 02: Bulk Upload ] ──► [ Step 03: AI Analysis ] ──► [ Step 04: Rankings ] ──► [ Step 05: Candidate Dossier ]
```

### Step 1 – Create Job
- Collects 12 comprehensive vacancy parameters:
  1. Job Title
  2. Company Name
  3. Department
  4. Job Location
  5. Employment Type
  6. Required Experience (Years)
  7. Education Qualification
  8. Mandatory Skills (Comma-separated)
  9. Preferred Skills (Comma-separated)
  10. Complete Job Description (with automated AI requirement extraction)
  11. Number of Vacancies
  12. Application Deadline
- **"Create Job & Continue"**: Validates required fields, persists `Job`, `JobRequirement`, and `HiringCampaign` records to the database, generates a unique Job ID (e.g. `JOB-0001`), displays an inline confirmation banner, and advances to Step 2.

### Step 2 – Bulk Resume Upload
- Dedicated high-scale ingestion interface displaying the active Job Title, Company Name, Job ID, and Job Description summary.
- Supports **500+ to 1,000+ PDF/DOCX resumes** with **10GB+ aggregate upload capacity**.
- **Features**: Drag-and-drop zone, multi-file picker, folder uploads (`webkitdirectory`), chunked streaming in 64KB buffers and 50-file batches, SHA-256 duplicate detection, file extension validation, and failed upload retry.
- **"Start Resume Analysis"**: Enqueues resumes into background processing workers and transitions to Step 3.

### Step 3 – AI Resume Analysis
- Real-time telemetry monitoring the 10-point extraction pipeline:
  1. Candidate Personal Information (Name, Email, Phone, Location)
  2. Education & Degree Verification
  3. Technical Skills Extraction
  4. Work Experience & Chronology Calculation
  5. Projects & Practical Experience
  6. Internships
  7. Certifications & Credentials
  8. Job Requirement Comparison
  9. Hybrid ML Matching (SentenceTransformers embeddings + TF-IDF)
  10. Database Persistence
- Live progress bar, queue status telemetry (Pending, In Progress, Completed, Failed), and an individual per-file ingestion log table.
- **"View Candidate Rankings"**: Advances to Step 4 once resumes are processed.

### Step 4 – Candidate Ranking
- Leaderboard displaying candidates in descending order of actual match score:
  - Rank (`#1`, `#2`, ...)
  - Candidate Name & Email
  - Compatibility Gauge (clean radial ring with high-contrast `{score}%` display)
  - Experience Duration (Years)
  - Education Degree
  - Matched Skills (interactive tags)
  - Mandatory Status (`100% Met` or `Missing Mandatory` warning pill)
  - Review Status Badge (`AI Screened`, `Under Review`, `Shortlisted`, `Interview Scheduled`, `Not Selected`)
- Multi-dimensional search, experience filter (Junior, Mid, Senior), mandatory coverage filter, status filter, sorting options, pagination, and one-click **CSV Export**.
- Clicking any candidate row navigates directly to Step 5.

### Step 5 – Candidate Details (Dossier)
- Comprehensive candidate dossier view:
  - Header with contact details, location, and verified experience.
  - Overall Compatibility Score and 6-component breakdown (Skills, Semantic, Experience, Education, Tech, Domain).
  - Multi-dimensional radar chart.
  - Matched Skills vs. Missing Skills badges.
  - Extracted work experience, education, projects, internships, and certifications.
  - Embedded PDF preview viewer with direct file streaming and secure document download.
  - Recruiter Action Controls (*Shortlist*, *Under Review*, *Schedule Interview*, *Reject*).
  - Recruiter Notes log with timestamped entries and author attribution.
  - **"Back to Candidate Rankings"** navigation button.

---

## 4. Platform Capabilities

### HR Recruitment Portal (`/hr`)
- **Overview Dashboard**: Real-time KPI telemetry (Active Jobs, Candidates Ingested, Resumes Analyzed, Shortlisted, Interviews Scheduled, Pending Triage) calculated directly from database records.
- **Job Management**: Create, edit, publish, close, and delete job openings with custom scoring weights.
- **AI Job Requirement Analyzer**: Analyzes job title and description to automatically extract technical skills, soft skills, mandatory vs. preferred requirements, years of experience, and education levels.
- **Resume Screening**: Single and bulk drag-and-drop resume ingestion (PDF and DOCX) with duplicate candidate profile prevention and automated background ML scoring.
- **Candidate Ranking**: Sortable candidate matrix with component subscores and mandatory deficit warning badges.
- **Candidate Comparison**: Interactive multi-candidate radar and bar comparison charts rendered via Recharts in the strict 3-color palette.
- **Interview Coordination**: Structured 7-stage pipeline (`Applied` &rarr; `AI Screened` &rarr; `HR Review` &rarr; `Shortlisted` &rarr; `Technical Interview` &rarr; `HR Interview` &rarr; `Selected / Not Selected`) with rating and feedback logging.
- **Recruitment Analytics**: Conversion velocity, match distribution tiers, and in-demand skill charts.
- **Executive PDF Reports**: Generates downloadable vector PDF dossiers via ReportLab styled in Mocha Brown, Platinum Silver, and Pale Lavender.

### Candidate / User Portal (`/candidate`)
- **Candidate Overview**: Compatibility KPIs, average score across openings, and animated circular match indicator.
- **Resume Upload & Parsing**: Real-time entity extraction preview showing detected email, telephone, degrees, work span, and skills.
- **Resume Compatibility Analysis**: Test any uploaded resume against published enterprise openings or paste custom job descriptions for instant feedback.
- **Skill Gap Remediation**: Categorized mandatory and preferred competency gaps with actionable upskilling roadmaps.
- **Evaluation History & Dossiers**: Complete audit trail with downloadable ReportLab PDF reports.

---

## 5. Database Architecture

The platform uses SQLAlchemy with support for SQLite and PostgreSQL:

| Model | Table Name | Purpose |
| :--- | :--- | :--- |
| `User` | `users` | Accounts, passwords (bcrypt), roles (`admin`, `hr_manager`, `hr_recruiter`, `candidate`), organization linkage |
| `Organization` | `organizations` | Multi-tenant organization entities and domains |
| `Job` | `jobs` | Job openings, requirements, vacancies, deadlines, scoring weights |
| `JobRequirement` | `job_requirements` | Extracted technical skills, qualifications, tools, and experience thresholds |
| `Candidate` | `candidates` | Extracted candidate profiles, contact info, total experience |
| `Resume` | `resumes` | Uploaded resume files, hashes (SHA-256), file types, parsed JSON payload |
| `Application` | `applications` | Candidate applications to specific jobs, status, applied timestamps |
| `AnalysisResult` | `analysis_results` | 6-component scores, overall match, matched skills, missing skills, explanations |
| `Interview` | `interviews` | Scheduled interview sessions, types, dates, times, interviewer feedback, ratings |
| `AuditLog` | `audit_logs` | Immutable audit trail of recruiter and administrative actions |
| `HiringCampaign` | `hiring_campaigns` | High-scale recruitment campaigns linked to job entities |
| `ProcessingJob` | `processing_jobs` | Asynchronous batch ingestion queues and status |
| `ProcessingLog` | `processing_logs` | Per-file processing stages, sizes, statuses, and messages |
| `CandidateNote` | `candidate_notes` | Recruiter internal notes and evaluations |

---

## 6. API Route Reference

### Bulk Hiring & Screening Endpoints (`/api/v1/hiring`)
- `POST /campaigns` - Create job & hiring campaign (with guest recruiter fallback)
- `GET /campaigns` - List all hiring campaigns
- `GET /campaigns/{id}` - Retrieve campaign details
- `POST /campaigns/{id}/upload-batch` - Ingest batch of resumes (up to 500+ files)
- `POST /campaigns/{id}/upload-chunk` - Ingest file chunk (resumable 64KB uploads)
- `POST /campaigns/{id}/complete-chunk-upload` - Reassemble chunked file and enqueue
- `GET /campaigns/{id}/progress` - Real-time processing queue progress and logs
- `GET /campaigns/{id}/rankings` - Ranked candidate leaderboard with filters and pagination
- `GET /candidates/{id}/detail` - Comprehensive candidate dossier and evidence
- `POST /candidates/{id}/action` - Log recruiter action (*Shortlist*, *Review*, *Interview*, *Reject*) and notes
- `GET /resumes/{id}/preview` - Stream resume document for embedded PDF preview
- `GET /resumes/{id}/download` - Download original resume file
- `GET /campaigns/{id}/analytics` - Aggregated campaign recruitment analytics

### Core Endpoints
- `POST /api/v1/auth/token` - OAuth2 password token generation
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Authenticated user profile
- `GET /api/v1/jobs` & `POST /api/v1/jobs` - Job management CRUD
- `POST /api/v1/jobs/analyze-requirements` - AI job requirement parsing
- `POST /api/v1/resumes/upload` - Single resume upload & PyMuPDF parsing
- `POST /api/v1/resumes/upload-bulk` - Bulk resume screening
- `POST /api/v1/analysis/match` - Hybrid ML candidate evaluation
- `GET /api/v1/ranking/job/{job_id}` - Candidate ranking for job
- `POST /api/v1/ranking/compare` - Multi-candidate radar comparison
- `GET /api/v1/interviews` & `POST /api/v1/interviews` - Interview scheduling & feedback
- `GET /api/v1/reports/generate/{analysis_id}` - Vector ReportLab PDF report generation
- `GET /api/v1/analytics/recruitment-metrics` - Executive HR dashboard KPIs

---

## 7. Credentials for Platform Evaluation

The database includes default enterprise credentials:

| Portal Experience | Email Address | Password | Role |
| :--- | :--- | :--- | :--- |
| **HR Recruitment Portal** | `hr@resumeai.io` | `Password123!` | `hr_manager` |
| **Candidate Career Portal** | `candidate@resumeai.io` | `Password123!` | `candidate` |

*The Bulk Hiring Portal (`/hiring`) also supports immediate guest recruiter access directly from the public landing page navigation without requiring pre-login.*

---

## 8. Running the Application Locally

### Backend (FastAPI + SQLAlchemy + Uvicorn)
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000/api/v1`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### Frontend (React + TypeScript + Vite + Tailwind CSS)
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Frontend Application URL: `http://127.0.0.1:5173`
- Bulk Hiring Portal URL: `http://127.0.0.1:5173/hiring`
#   R e s u m e - A I 
 
 
