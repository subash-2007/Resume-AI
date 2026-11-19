import re
import os
import pymupdf  # PyMuPDF
import docx
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ----------------- Skill Taxonomy & Synonyms -----------------
SKILL_TAXONOMY = {
    # Programming Languages
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "go": "Go",
    "golang": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "sql": "SQL",
    "html": "HTML",
    "css": "CSS",
    "r": "R",
    "scala": "Scala",
    
    # Frameworks & Libraries
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "angular": "Angular",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "node": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "asp.net": "ASP.NET",
    "dotnet": ".NET",
    ".net": ".NET",
    
    # Data Science, ML & AI
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "dl": "Deep Learning",
    "natural language processing": "Natural Language Processing",
    "nlp": "Natural Language Processing",
    "computer vision": "Computer Vision",
    "cv": "Computer Vision",
    "scikit-learn": "Scikit-learn",
    "sklearn": "Scikit-learn",
    "scikitlearn": "Scikit-learn",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "pytorch": "PyTorch",
    "torch": "PyTorch",
    "keras": "Keras",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scipy": "SciPy",
    "llm": "Large Language Models",
    "llms": "Large Language Models",
    "large language models": "Large Language Models",
    "generative ai": "Generative AI",
    "genai": "Generative AI",
    "rag": "Retrieval-Augmented Generation",
    "transformers": "Transformers",
    "huggingface": "Hugging Face",
    
    # Databases & Storage
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "sqlite": "SQLite",
    "oracle": "Oracle DB",
    "cassandra": "Cassandra",
    "elasticsearch": "Elasticsearch",
    "dynamodb": "DynamoDB",
    
    # Cloud, DevOps & Tools
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Microsoft Azure",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",
    "google cloud platform": "Google Cloud",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "jenkins": "Jenkins",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "continuous integration": "CI/CD",
    "linux": "Linux",
    "bash": "Bash",
    "microservices": "Microservices",
    "graphql": "GraphQL",
    "rest api": "RESTful APIs",
    "rest": "RESTful APIs",
    "restful": "RESTful APIs",
    
    # Methodologies & Soft Skills
    "agile": "Agile",
    "scrum": "Scrum",
    "kanban": "Kanban",
    "jira": "Jira",
    "communication": "Communication",
    "leadership": "Leadership",
    "problem solving": "Problem Solving",
    "teamwork": "Teamwork",
    "critical thinking": "Critical Thinking",
    "mentoring": "Mentoring",
    "collaboration": "Collaboration"
}

# ----------------- Lazy Loaded Embedding Model -----------------
_model = None

def get_sentence_transformer():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            # Using lightweight, fast, highly accurate all-MiniLM-L6-v2
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            print(f"[NLP Engine] Notice: Could not load sentence-transformers model directly: {e}")
            _model = "fallback"
    return _model

# ----------------- Document Parsers -----------------
def extract_text_from_pdf(file_path: str) -> str:
    """Extract raw text from PDF using PyMuPDF."""
    text_content = []
    try:
        doc = pymupdf.open(file_path)
        for page in doc:
            text_content.append(page.get_text("text"))
        doc.close()
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return "\n".join(text_content).strip()

def extract_text_from_docx(file_path: str) -> str:
    """Extract raw text from DOCX using python-docx."""
    text_content = []
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            if para.text.strip():
                text_content.append(para.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    text_content.append(row_text)
    except Exception as e:
        print(f"Error reading DOCX {file_path}: {e}")
    return "\n".join(text_content).strip()

def extract_text_from_file(file_path: str, file_type: str) -> str:
    if file_type.lower() == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type.lower() in ["docx", "doc"]:
        return extract_text_from_docx(file_path)
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()

# ----------------- Entity & Skill Extraction -----------------
def extract_email(text: str) -> str:
    pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    match = re.search(pattern, text)
    return match.group(0) if match else "Not detected"

def extract_phone(text: str) -> str:
    pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    match = re.search(pattern, text)
    return match.group(0) if match else "Not detected"

def extract_name(text: str, email: str = "") -> str:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return "Not detected"
    # Often candidate name is in the first 3 lines
    for line in lines[:4]:
        if "@" in line or "http" in line or len(line) > 50:
            continue
        cleaned = re.sub(r'[^a-zA-Z\s]', '', line).strip()
        words = cleaned.split()
        if 2 <= len(words) <= 4:
            return cleaned.title()
    if email and email != "Not detected":
        prefix = email.split("@")[0]
        cleaned_prefix = re.sub(r'[^a-zA-Z]', ' ', prefix).strip()
        if cleaned_prefix:
            return cleaned_prefix.title()
    return "Not detected"

def extract_skills(text: str) -> List[str]:
    """Identify skills using exact word boundaries and taxonomy mapping."""
    detected = set()
    lowered = f" {text.lower()} "
    
    # Sort skills by length descending to match multi-word phrases first
    sorted_skills = sorted(SKILL_TAXONOMY.keys(), key=lambda s: len(s), reverse=True)
    
    for skill_key in sorted_skills:
        # Regex for word boundary or symbols like C++, .NET, C#
        escaped = re.escape(skill_key)
        pattern = rf'(?<![a-zA-Z0-9]){escaped}(?![a-zA-Z0-9])'
        if re.search(pattern, lowered):
            standardized = SKILL_TAXONOMY[skill_key]
            detected.add(standardized)
            
    return sorted(list(detected))

def extract_experience_years(text: str) -> float:
    """Identify claimed years of professional experience."""
    patterns = [
        r'(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience',
        r'experience\s*(?:of|:)?\s*(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)',
        r'(\d+(?:\.\d+)?)\+?\s*years?\s+in\s+[a-zA-Z]+'
    ]
    max_years = 0.0
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            try:
                val = float(m)
                if val < 40 and val > max_years:
                    max_years = val
            except ValueError:
                pass
                
    # If not explicitly stated, estimate from date ranges like 2018 - 2023 or 2019 - Present
    if max_years == 0.0:
        date_pattern = r'\b(20[0-2][0-9]|19[8-9][0-9])\s*[-–—to]+\s*(Present|Current|20[0-2][0-9])\b'
        matches = re.findall(date_pattern, text, re.IGNORECASE)
        total_span = 0
        current_year = 2026
        for start, end in matches:
            try:
                s_yr = int(start)
                e_yr = current_year if end.lower() in ["present", "current"] else int(end)
                if 0 <= e_yr - s_yr <= 30:
                    total_span = max(total_span, e_yr - s_yr)
            except Exception:
                pass
        if total_span > 0:
            max_years = float(total_span)
            
    return max_years

def partition_resume_sections(text: str) -> Dict[str, str]:
    """Break resume text into logical sections for evidence attribution."""
    section_patterns = [
        ("Summary", r'(?i)\b(professional summary|summary|profile|about me|executive summary|objective)\b'),
        ("Technical Skills", r'(?i)\b(technical skills|skills & expertise|core competencies|technologies|tools|skills)\b'),
        ("Experience", r'(?i)\b(work experience|professional experience|employment history|experience|work history)\b'),
        ("Projects", r'(?i)\b(key projects|projects|selected projects|technical projects|academic projects)\b'),
        ("Education", r'(?i)\b(education|academic background|academics|qualifications|academic credentials)\b'),
        ("Certifications", r'(?i)\b(certifications|certificates|licenses|credentials|professional development)\b')
    ]
    
    # Locate indices of each heading
    matches = []
    for sec_name, pattern in section_patterns:
        m = re.search(pattern, text)
        if m:
            matches.append((m.start(), sec_name))
            
    matches.sort(key=lambda x: x[0])
    
    sections = {}
    if not matches:
        sections["General Content"] = text
        return sections
        
    for i, (start_idx, sec_name) in enumerate(matches):
        end_idx = matches[i+1][0] if i + 1 < len(matches) else len(text)
        sections[sec_name] = text[start_idx:end_idx].strip()
        
    return sections

def extract_education(text: str) -> List[Dict[str, Any]]:
    """Detect degrees, colleges/universities, and graduation years."""
    degrees = []
    degree_keywords = [
        (r'\b(Ph\.?D\.?|Doctor of Philosophy|Doctorate)\b', "Doctorate (Ph.D.)"),
        (r'\b(Master of Science|Master of Technology|M\.?S\.?|M\.?Tech|MBA|Master of Arts|Master\'s)\b', "Master's Degree"),
        (r'\b(Bachelor of Science|Bachelor of Technology|Bachelor of Engineering|B\.?S\.?|B\.?Tech|B\.?E\.?|BCA|Bachelor\'s)\b', "Bachelor's Degree"),
        (r'\b(Associate Degree|Diploma)\b', "Associate / Diploma")
    ]
    detected_degree = "Not detected"
    is_verified = False
    for pattern, name in degree_keywords:
        if re.search(pattern, text, re.IGNORECASE):
            detected_degree = name
            is_verified = True
            break

    # College/University extraction
    institution_match = re.search(
        r'\b([A-Z][a-zA-Z\s&]{2,40}(?:University|Institute|College|Academy|School of [A-Z][a-z]+))\b',
        text
    )
    institution = institution_match.group(1).strip() if institution_match else "Not detected"

    # Year of graduation
    year_match = re.search(r'\b(19[89][0-9]|20[0-2][0-9])\b', text)
    grad_year = year_match.group(1) if year_match else "Not detected"

    degrees.append({
        "degree": detected_degree,
        "institution": institution,
        "graduation_year": grad_year,
        "verified": is_verified
    })
    return degrees

def extract_location(text: str) -> str:
    """Identify location from header or text."""
    loc_match = re.search(
        r'\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2}|[A-Z][a-zA-Z\s]+)\b',
        text[:600]
    )
    if loc_match:
        loc = loc_match.group(0).strip()
        if len(loc) < 40 and not any(k in loc for k in ["University", "College", "Degree", "Phone", "Email"]):
            return loc
    return "Not detected"

def extract_resume_info(text: str) -> Dict[str, Any]:
    """Complete resume information extraction pipeline with section evidence."""
    email = extract_email(text)
    phone = extract_phone(text)
    name = extract_name(text, email)
    location = extract_location(text)
    skills = extract_skills(text)
    exp_years = extract_experience_years(text)
    education = extract_education(text)
    sections = partition_resume_sections(text)

    # Detect projects and certifications sections
    has_projects = bool(re.search(r'\bprojects?\b', text, re.IGNORECASE))
    has_certs = bool(re.search(r'\b(certifications?|certificates?|licensed?)\b', text, re.IGNORECASE))

    projects_list = [{"title": "Detected Technical Projects"}] if has_projects else []
    certs_list = ["Professional Credentials Detected"] if has_certs else []

    # Map skills to their detected section for auditability
    skill_sources = {}
    for sk in skills:
        found_in = "General Text"
        for sec_name, sec_content in sections.items():
            if sk.lower() in sec_content.lower():
                found_in = sec_name
                break
        skill_sources[sk] = found_in

    # Extraction confidence scoring
    confidence = 0.50
    if name != "Not detected": confidence += 0.15
    if email != "Not detected": confidence += 0.15
    if phone != "Not detected": confidence += 0.10
    if len(skills) >= 3: confidence += 0.10
    confidence = min(round(confidence, 2), 1.0)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "location": location,
        "skills": skills,
        "skill_sources": skill_sources,
        "experience": [{"years": exp_years}],
        "total_experience_years": exp_years,
        "education": education,
        "projects": projects_list,
        "certifications": certs_list,
        "technologies": skills,
        "sections": list(sections.keys()),
        "extraction_confidence": confidence
    }

# ----------------- AI Job Requirement Analyzer -----------------
def analyze_job_requirements(title: str, description: str) -> Dict[str, Any]:
    """Extract structured requirements from job title and description."""
    full_text = f"{title}\n{description}"
    all_skills = extract_skills(full_text)
    
    # Partition into technical vs soft
    soft_names = {"Communication", "Leadership", "Problem Solving", "Teamwork", "Critical Thinking", "Mentoring", "Collaboration", "Agile", "Scrum"}
    technical_skills = [s for s in all_skills if s not in soft_names]
    soft_skills = [s for s in all_skills if s in soft_names]
    
    # Mandatory vs Preferred heuristics:
    # Skills mentioned near "required", "must have", "mandatory", "essential"
    mandatory = []
    preferred = []
    
    lines = description.split("\n")
    for s in technical_skills:
        s_lower = s.lower()
        is_mand = False
        for line in lines:
            line_l = line.lower()
            if s_lower in line_l:
                if any(w in line_l for w in ["require", "must", "mandatory", "essential", "minimum", "need"]):
                    is_mand = True
                    break
                elif any(w in line_l for w in ["prefer", "plus", "bonus", "nice to have", "good to have"]):
                    preferred.append(s)
                    break
        if is_mand:
            mandatory.append(s)
            
    # Default fallback partition if lines were unformatted
    if not mandatory and technical_skills:
        mandatory = technical_skills[:max(1, len(technical_skills)//2)]
        preferred = [s for s in technical_skills if s not in mandatory]
    else:
        # Avoid duplicates
        preferred = [s for s in preferred if s not in mandatory]
        
    exp_years = extract_experience_years(description)
    education_level = "Bachelor's Degree"
    if re.search(r'\b(master|ms|mtech|mba)\b', description, re.IGNORECASE):
        education_level = "Master's Degree"
    elif re.search(r'\b(phd|doctorate)\b', description, re.IGNORECASE):
        education_level = "Doctorate (Ph.D.)"
        
    return {
        "technical_skills": technical_skills,
        "soft_skills": soft_skills,
        "mandatory_skills": mandatory,
        "preferred_skills": preferred,
        "experience_years": exp_years if exp_years > 0 else 2.0,
        "education_level": education_level,
        "tools_technologies": technical_skills
    }

# ----------------- Semantic & Keyword Matching -----------------
def compute_tfidf_similarity(text_a: str, text_b: str) -> float:
    """Compute TF-IDF cosine similarity between two texts."""
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(np.clip(sim, 0.0, 1.0))
    except Exception:
        return 0.0

def compute_semantic_similarity(text_a: str, text_b: str) -> float:
    """Compute dense embedding cosine similarity using SentenceTransformers."""
    model = get_sentence_transformer()
    if model != "fallback" and model is not None:
        try:
            embeddings = model.encode([text_a[:1000], text_b[:1000]])
            sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return float(np.clip(sim, 0.0, 1.0))
        except Exception as e:
            print(f"Embedding error: {e}")
            
    # Deterministic n-gram word vector similarity fallback
    return compute_tfidf_similarity(text_a, text_b)

# ----------------- Explainable Hybrid Matching Engine -----------------
def calculate_hybrid_match(
    resume_text: str,
    resume_parsed: Dict[str, Any],
    job_title: str,
    job_description: str,
    mandatory_skills: List[str],
    preferred_skills: List[str],
    required_experience: float,
    required_education: str = "Bachelor's Degree",
    custom_weights: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Computes explainable weighted matching:
    Technical Skill Matching: 35%
    Semantic Similarity: 25%
    Relevant Experience: 15%
    Education: 10%
    Technology Alignment: 10%
    Domain Relevance: 5%
    """
    # 1. Weights
    w_skill = 0.35
    w_semantic = 0.25
    w_exp = 0.15
    w_edu = 0.10
    w_tech = 0.10
    w_domain = 0.05
    
    if custom_weights:
        w_skill = custom_weights.get("technical_skills", w_skill)
        w_semantic = custom_weights.get("semantic_similarity", w_semantic)
        w_exp = custom_weights.get("experience", w_exp)
        w_edu = custom_weights.get("education", w_edu)
        w_tech = custom_weights.get("technology", w_tech)
        w_domain = custom_weights.get("domain", w_domain)
        
    candidate_skills = set(resume_parsed.get("skills", []))
    req_mandatory = set(mandatory_skills)
    req_preferred = set(preferred_skills)
    
    # 2. Skill Scoring
    matched_mandatory = req_mandatory.intersection(candidate_skills)
    missing_mandatory = req_mandatory.difference(candidate_skills)
    matched_preferred = req_preferred.intersection(candidate_skills)
    missing_preferred = req_preferred.difference(candidate_skills)
    
    matched_all = matched_mandatory.union(matched_preferred)
    
    # Scoring math: mandatory skills weigh 70%, preferred weigh 30%
    mand_score = (len(matched_mandatory) / len(req_mandatory)) if req_mandatory else 1.0
    pref_score = (len(matched_preferred) / len(req_preferred)) if req_preferred else 1.0
    skill_score = (mand_score * 0.70 + pref_score * 0.30) * 100.0
    
    # 3. Semantic Similarity
    job_full = f"{job_title}. {job_description}"
    semantic_sim = compute_semantic_similarity(resume_text, job_full)
    semantic_score = semantic_sim * 100.0
    
    # 4. Experience Scoring
    cand_exp = float(resume_parsed.get("total_experience_years", 0.0))
    if required_experience <= 0:
        exp_score = 100.0
    else:
        exp_ratio = min(cand_exp / required_experience, 1.5)
        # 1.0 ratio -> 90%, 1.25+ -> 100%, lower scaled linearly
        exp_score = min(exp_ratio * 90.0, 100.0)
        
    # 5. Education Scoring
    edu_list = resume_parsed.get("education", [])
    cand_degree = edu_list[0].get("degree", "Not detected") if edu_list else "Not detected"
    edu_score = 60.0  # baseline
    if "Doctorate" in cand_degree:
        edu_score = 100.0
    elif "Master" in cand_degree:
        edu_score = 95.0 if "Master" in required_education else 100.0
    elif "Bachelor" in cand_degree:
        edu_score = 75.0 if "Master" in required_education else 90.0
    elif cand_degree != "Not detected":
        edu_score = 70.0
        
    # 6. Technology Alignment (TF-IDF keyword overlap on tech requirements)
    req_tech_str = " ".join(list(req_mandatory) + list(req_preferred))
    cand_tech_str = " ".join(list(candidate_skills))
    tfidf_sim = compute_tfidf_similarity(cand_tech_str, req_tech_str) if req_tech_str else 0.5
    technology_score = tfidf_sim * 100.0
    
    # 7. Domain Relevance (Title and Industry term alignment)
    domain_sim = compute_tfidf_similarity(resume_text, job_title)
    domain_score = max(domain_sim * 100.0, 50.0 if any(k.lower() in resume_text.lower() for k in job_title.split()) else 30.0)
    
    # 8. Hybrid Final Score
    final_score = (
        (skill_score * w_skill) +
        (semantic_score * w_semantic) +
        (exp_score * w_exp) +
        (edu_score * w_edu) +
        (technology_score * w_tech) +
        (domain_score * w_domain)
    )
    final_score = round(float(np.clip(final_score, 0.0, 100.0)), 1)
    
    has_mandatory_deficit = len(missing_mandatory) > 0
    
    # 9. Evidence Breakdown by section
    evidence_breakdown = {}
    skill_sources = resume_parsed.get("skill_sources", {})
    for s in req_mandatory:
        if s in matched_mandatory:
            evidence_breakdown[s] = {
                "status": "Matched Mandatory",
                "section": skill_sources.get(s, "Technical Skills"),
                "found": True
            }
        else:
            evidence_breakdown[s] = {
                "status": "Missing Mandatory",
                "section": "Not detected",
                "found": False
            }
    for s in req_preferred:
        if s in matched_preferred:
            evidence_breakdown[s] = {
                "status": "Matched Preferred",
                "section": skill_sources.get(s, "Technical Skills"),
                "found": True
            }
        else:
            evidence_breakdown[s] = {
                "status": "Missing Preferred",
                "section": "Not detected",
                "found": False
            }

    # Strengths and improvement areas
    strengths = []
    if skill_score >= 75.0:
        strengths.append(f"High technical skill alignment ({skill_score:.0f}%) with {len(matched_all)} relevant skills detected.")
    if not has_mandatory_deficit and len(req_mandatory) > 0:
        strengths.append("Full coverage of all mandatory job requirements.")
    if cand_exp >= required_experience and required_experience > 0:
        strengths.append(f"Meets or exceeds required experience ({cand_exp:.1f} yrs vs {required_experience:.1f} yrs required).")
    if semantic_score >= 70.0:
        strengths.append(f"Strong contextual semantic alignment ({semantic_score:.0f}%) with job description.")

    improvement_areas = []
    if has_mandatory_deficit:
        improvement_areas.append(f"Missing mandatory requirements: {', '.join(sorted(list(missing_mandatory)))}.")
    if missing_preferred:
        improvement_areas.append(f"Missing preferred skills: {', '.join(sorted(list(missing_preferred)))}.")
    if cand_exp < required_experience and required_experience > 0:
        improvement_areas.append(f"Experience deficit: {cand_exp:.1f} yrs detected vs {required_experience:.1f} yrs required.")
    if not improvement_areas:
        improvement_areas.append("No critical qualification deficits detected.")

    # 10. Natural Language Explainable Summary
    explanation_parts = []
    explanation_parts.append(
        f"Candidate matched {len(matched_all)} relevant skills ({len(matched_mandatory)} mandatory, {len(matched_preferred)} preferred)."
    )
    if has_mandatory_deficit:
        explanation_parts.append(
            f"IMPORTANT: Missing mandatory requirement(s): {', '.join(sorted(list(missing_mandatory)))}. Recruiter human review is recommended."
        )
    else:
        explanation_parts.append("All mandatory technical competencies detected.")
        
    explanation_parts.append(
        f"Verified experience is {cand_exp:.1f} years against a requirement of {required_experience:.1f} years (Experience subscore: {exp_score:.1f}%)."
    )
    explanation_parts.append(
        f"Semantic contextual similarity between resume profile and job specification is {semantic_score:.1f}%."
    )
    explanation_parts.append(
        "Note: Compatibility score reflects qualification alignment and should be utilized as an assistive screening metric rather than automated hiring determination."
    )
    
    explanation = " ".join(explanation_parts)
    
    return {
        "overall_score": final_score,
        "skill_score": round(skill_score, 1),
        "semantic_score": round(semantic_score, 1),
        "experience_score": round(exp_score, 1),
        "education_score": round(edu_score, 1),
        "technology_score": round(technology_score, 1),
        "domain_score": round(domain_score, 1),
        "matched_skills": sorted(list(matched_all)),
        "missing_mandatory_skills": sorted(list(missing_mandatory)),
        "missing_preferred_skills": sorted(list(missing_preferred)),
        "has_mandatory_deficit": has_mandatory_deficit,
        "evidence_breakdown": evidence_breakdown,
        "strengths": strengths,
        "improvement_areas": improvement_areas,
        "explanation": explanation,
        "scoring_weights": {
            "technical_skills": w_skill,
            "semantic_similarity": w_semantic,
            "experience": w_exp,
            "education": w_edu,
            "technology": w_tech,
            "domain": w_domain
        }
    }

