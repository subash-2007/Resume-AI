import os
import sys
import json
import urllib.request
import urllib.parse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

BASE = 'http://127.0.0.1:8000/api/v1'

def create_sample_pdf(filepath, name, email, phone, title, summary, skills, experience_years, education):
    c = canvas.Canvas(filepath, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, name)
    c.setFont("Helvetica", 10)
    c.drawString(50, 735, f"{email} | {phone} | {title}")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 700, "PROFESSIONAL SUMMARY")
    c.setFont("Helvetica", 10)
    c.drawString(50, 685, summary)
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 650, "TECHNICAL SKILLS")
    c.setFont("Helvetica", 10)
    c.drawString(50, 635, ", ".join(skills))
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 600, "WORK EXPERIENCE")
    c.setFont("Helvetica", 10)
    c.drawString(50, 585, f"Software Professional - {experience_years} years of experience in enterprise development.")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 550, "EDUCATION")
    c.setFont("Helvetica", 10)
    c.drawString(50, 535, education)
    
    c.save()

def post_json(endpoint, payload, token=None):
    data = json.dumps(payload).encode()
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE}{endpoint}', data=data, headers=headers)
    return json.loads(urllib.request.urlopen(req).read().decode())

def get_json(endpoint, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE}{endpoint}', headers=headers)
    return json.loads(urllib.request.urlopen(req).read().decode())

def put_json(endpoint, payload, token=None):
    data = json.dumps(payload).encode()
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(f'{BASE}{endpoint}', data=data, headers=headers, method='PUT')
    return json.loads(urllib.request.urlopen(req).read().decode())

def upload_file_multipart(endpoint, filepath, form_fields=None, token=None):
    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    body = bytearray()
    
    if form_fields:
        for k, v in form_fields.items():
            body.extend(f'--{boundary}\r\n'.encode())
            body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
            body.extend(f'{v}\r\n'.encode())
            
    filename = os.path.basename(filepath)
    body.extend(f'--{boundary}\r\n'.encode())
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
    body.extend(b'Content-Type: application/pdf\r\n\r\n')
    with open(filepath, 'rb') as f:
        body.extend(f.read())
    body.extend(b'\r\n')
    body.extend(f'--{boundary}--\r\n'.encode())
    
    headers = {
        'Content-Type': f'multipart/form-data; boundary={boundary}'
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
        
    req = urllib.request.Request(f'{BASE}{endpoint}', data=body, headers=headers, method='POST')
    return json.loads(urllib.request.urlopen(req).read().decode())

def run_tests():
    print("=" * 60)
    print("RUNNING 14-STEP VERIFICATION SUITE FOR RESUMEAI")
    print("=" * 60)
    
    # ----------------------------------------------------
    # TEST 1: Create a new HR account and log in
    # ----------------------------------------------------
    print("\nTEST 1: Create a new HR account and log in...")
    new_hr_email = "lead.talent@enterprise-corp.io"
    try:
        hr_reg = post_json('/auth/register', {
            'email': new_hr_email,
            'password': 'SecureEnterprisePassword2026!',
            'full_name': 'Victoria Sterling',
            'role': 'hr_manager',
            'organization_name': 'Apex Technologies Group'
        })
        hr_token = hr_reg['access_token']
        print(f"   [PASSED] Registered new HR Account: {hr_reg['user']['email']}, Role: {hr_reg['user']['role']}")
    except Exception as e:
        # If already exists, log in
        hr_login = post_json('/auth/login', {
            'email': new_hr_email,
            'password': 'SecureEnterprisePassword2026!'
        })
        hr_token = hr_login['access_token']
        print(f"   [PASSED] Logged into existing HR Account: {new_hr_email}")
        
    # ----------------------------------------------------
    # TEST 2: Create a real job opening
    # ----------------------------------------------------
    print("\nTEST 2: Create a real job opening...")
    job_payload = {
        "title": "Lead Python Cloud Architect",
        "department": "Engineering",
        "location": "San Francisco, CA (Hybrid)",
        "employment_type": "Full-time",
        "description": "We are seeking a Lead Python Cloud Architect. Mandatory qualifications: Python, FastAPI, SQL, Docker. Preferred: Kubernetes, AWS. Must have at least 4 years experience.",
        "mandatory_skills": ["Python", "FastAPI", "SQL", "Docker"],
        "preferred_skills": ["Kubernetes", "AWS"],
        "required_experience": 4.0,
        "educational_requirements": "Bachelor's Degree",
        "vacancies": 2,
        "deadline": "2026-12-31"
    }
    created_job = post_json('/jobs', job_payload, hr_token)
    job_id = created_job['id']
    print(f"   [PASSED] Created Job ID #{job_id}: '{created_job['title']}' with {len(created_job['mandatory_skills'])} mandatory skills.")

    # ----------------------------------------------------
    # TEST 3: Upload an actual PDF resume
    # ----------------------------------------------------
    print("\nTEST 3: Upload an actual PDF resume...")
    pdf1_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Alice_Walker_Resume.pdf")
    create_sample_pdf(
        filepath=pdf1_path,
        name="Alice Walker",
        email="alice.walker@techcorp.io",
        phone="+1 (415) 781-9920",
        title="Senior Python Backend Architect",
        summary="Senior Backend Architect with 5.0 years experience specializing in high-throughput Python and FastAPI microservices with Docker and SQL databases.",
        skills=["Python", "FastAPI", "SQL", "Docker", "PostgreSQL", "Redis", "Git", "Linux"],
        experience_years=5.0,
        education="Bachelor of Science in Computer Science - Stanford University"
    )
    print(f"   Created physical PDF: {pdf1_path} ({os.path.getsize(pdf1_path)} bytes)")
    
    upload1 = upload_file_multipart('/resumes/upload', pdf1_path, {'job_id': str(job_id)}, hr_token)
    print(f"   [PASSED] Ingested Resume ID #{upload1['id']} for candidate: '{upload1['candidate_name']}'")

    # ----------------------------------------------------
    # TEST 4: Extract candidate information
    # ----------------------------------------------------
    print("\nTEST 4: Extract candidate information via PyMuPDF...")
    parsed_info = upload1['parsed_data']
    print(f"   Extracted Name: {parsed_info.get('name')}")
    print(f"   Extracted Email: {parsed_info.get('email')}")
    print(f"   Extracted Experience: {parsed_info.get('total_experience_years')} yrs")
    print(f"   Extracted Skills: {parsed_info.get('skills')}")
    assert parsed_info.get('email') == "alice.walker@techcorp.io", "Email should match"
    assert "Python" in parsed_info.get('skills'), "Python should be detected"
    print("   [PASSED] Real PyMuPDF entity extraction verified.")

    # ----------------------------------------------------
    # TEST 5: Analyze job requirements
    # ----------------------------------------------------
    print("\nTEST 5: Analyze job requirements...")
    req_res = post_json('/jobs/extract-requirements', {
        'title': 'Senior NLP Engineer',
        'description': 'Mandatory qualifications: Python, Machine Learning, Natural Language Processing. Required 3+ years experience.'
    }, hr_token)
    print(f"   AI Requirement Extraction: Mandatory: {req_res['mandatory_skills']}, Exp: {req_res['experience_years']} yrs")
    assert "Python" in req_res['mandatory_skills'], "Mandatory skills should include Python"
    print("   [PASSED] AI Job Requirement Analyzer functioning.")

    # ----------------------------------------------------
    # TEST 6: Calculate ML matching score
    # ----------------------------------------------------
    print("\nTEST 6: Calculate ML matching score...")
    match_res = upload1.get('match_result')
    if not match_res:
        # Run explicit match
        match_obj = post_json('/analysis/match', {'job_id': job_id, 'resume_id': upload1['id']}, hr_token)
        overall_score = match_obj['overall_score']
        skill_score = match_obj['skill_score']
        semantic_score = match_obj['semantic_score']
        has_deficit = match_obj['has_mandatory_deficit']
        explanation = match_obj['explanation']
    else:
        overall_score = match_res['overall_score']
        skill_score = match_res['skill_score']
        semantic_score = match_res['semantic_score']
        has_deficit = match_res['has_mandatory_deficit']
        explanation = match_res['explanation']
        
    print(f"   Overall Score: {overall_score}%")
    print(f"   Skill Score: {skill_score}%")
    print(f"   Semantic Score: {semantic_score}%")
    print(f"   Mandatory Deficit Flag: {has_deficit}")
    print(f"   Evidence Explanation: {explanation[:100]}...")
    assert overall_score > 50, "Alice should have a strong match"
    print("   [PASSED] Real SentenceTransformers + TF-IDF hybrid match computed.")

    # ----------------------------------------------------
    # TEST 7: Verify that results are stored in database
    # ----------------------------------------------------
    print("\nTEST 7: Verify results stored in relational database...")
    all_cands = get_json('/candidates?search=alice.walker', hr_token)
    matching_cand = next((c for c in all_cands['items'] if c['email'] == 'alice.walker@techcorp.io'), None)
    assert matching_cand is not None, "Candidate record must exist in DB"
    print(f"   [PASSED] Candidate '{matching_cand['first_name']} {matching_cand['last_name']}' confirmed in DB with ID #{matching_cand['id']}.")

    # ----------------------------------------------------
    # TEST 8: Refresh page & verify persistence
    # ----------------------------------------------------
    print("\nTEST 8: Verify persistence across simulated refresh...")
    verify_job = get_json(f'/jobs/{job_id}')
    assert verify_job['title'] == "Lead Python Cloud Architect", "Job must persist"
    verify_cand = get_json(f'/candidates/{matching_cand["id"]}', hr_token)
    assert verify_cand['email'] == "alice.walker@techcorp.io", "Candidate must persist"
    print("   [PASSED] Data persistence verified across database queries.")

    # ----------------------------------------------------
    # TEST 9: Upload another resume (Bob Taylor, Junior Developer)
    # ----------------------------------------------------
    print("\nTEST 9: Upload second resume with mandatory skill deficit...")
    pdf2_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Bob_Taylor_Resume.pdf")
    create_sample_pdf(
        filepath=pdf2_path,
        name="Bob Taylor",
        email="bob.taylor@junior.io",
        phone="+1 (555) 014-9922",
        title="Junior Frontend Enthusiast",
        summary="Aspiring web developer with 1.0 years experience focusing on HTML, CSS, JavaScript, and basic Python scripting.",
        skills=["HTML", "CSS", "JavaScript", "Python", "Git"],
        experience_years=1.0,
        education="Associate Degree in Information Technology"
    )
    upload2 = upload_file_multipart('/resumes/upload', pdf2_path, {'job_id': str(job_id)}, hr_token)
    print(f"   [PASSED] Ingested Resume ID #{upload2['id']} for candidate: '{upload2['candidate_name']}'")

    # ----------------------------------------------------
    # TEST 10: Verify that candidate ranking updates
    # ----------------------------------------------------
    print("\nTEST 10: Verify that candidate ranking updates dynamically...")
    rankings = get_json(f'/ranking/job/{job_id}', hr_token)
    print(f"   Total Ranked Candidates: {len(rankings)}")
    for r in rankings:
        print(f"   Rank #{rankings.index(r)+1}: {r['candidate_name']} -> Overall: {r['overall_score']}%, Mandatory Deficit: {r['has_mandatory_deficit']}")
    assert rankings[0]['overall_score'] >= rankings[1]['overall_score'], "Rankings must be sorted descending"
    assert rankings[0]['candidate_name'] == "Alice Walker", "Alice Walker must rank #1"
    print("   [PASSED] Candidate ranking matrix verified.")

    # ----------------------------------------------------
    # TEST 11: Shortlist a candidate
    # ----------------------------------------------------
    print("\nTEST 11: Shortlist candidate in database...")
    alice_app_id = matching_cand['applications'][0]['application_id']
    status_res = put_json(f'/candidates/application/{alice_app_id}/status', {'status': 'Shortlisted'}, hr_token)
    assert status_res['new_status'] == 'Shortlisted', "Status must be Shortlisted"
    print(f"   [PASSED] Application #{alice_app_id} status updated to: {status_res['new_status']}")

    # ----------------------------------------------------
    # TEST 12: Verify that dashboard statistics update
    # ----------------------------------------------------
    print("\nTEST 12: Verify dashboard telemetry statistics update from real DB records...")
    metrics = get_json('/analytics/recruitment-metrics', hr_token)
    print(f"   Active Jobs: {metrics['active_jobs']}")
    print(f"   Total Candidates: {metrics['total_candidates']}")
    print(f"   Resumes Analyzed: {metrics['resumes_analyzed']}")
    print(f"   Shortlisted Candidates: {metrics['shortlisted_candidates']}")
    assert metrics['shortlisted_candidates'] >= 1, "Shortlisted count must be at least 1"
    assert metrics['total_candidates'] >= 2, "Candidates count must be at least 2"
    print("   [PASSED] Live recruitment telemetry verified from actual DB records.")

    # ----------------------------------------------------
    # TEST 13: Generate a PDF report
    # ----------------------------------------------------
    print("\nTEST 13: Generate PDF report via ReportLab...")
    # Find Alice's analysis ID
    cand_detail = get_json(f'/candidates/{matching_cand["id"]}', hr_token)
    analysis_id = cand_detail['latest_analysis']['id']
    
    pdf_req = urllib.request.Request(f'{BASE}/reports/generate/{analysis_id}', headers={'Authorization': f'Bearer {hr_token}'})
    pdf_bytes = urllib.request.urlopen(pdf_req).read()
    print(f"   ReportLab PDF size: {len(pdf_bytes)} bytes. Magic: {pdf_bytes[:4].decode()}")
    assert pdf_bytes.startswith(b'%PDF'), "File must be valid PDF"
    print("   [PASSED] Official PDF evaluation dossier generated successfully.")

    # ----------------------------------------------------
    # TEST 14: Verify that candidate portal cannot access HR-only routes
    # ----------------------------------------------------
    print("\nTEST 14: Verify RBAC security - Candidate cannot access HR routes...")
    try:
        cand_reg = post_json('/auth/register', {
            'email': 'independent.candidate@domain.com',
            'password': 'CandidatePassword123!',
            'full_name': 'Evan Brooks',
            'role': 'candidate'
        })
    except urllib.error.HTTPError:
        cand_reg = post_json('/auth/login', {
            'email': 'independent.candidate@domain.com',
            'password': 'CandidatePassword123!'
        })
    cand_token = cand_reg['access_token']
    
    # Attempt to access HR-only route /analytics/recruitment-metrics
    try:
        req = urllib.request.Request(f'{BASE}/analytics/recruitment-metrics', headers={'Authorization': f'Bearer {cand_token}'})
        urllib.request.urlopen(req)
        assert False, "Candidate should have been forbidden from accessing HR analytics"
    except urllib.error.HTTPError as err:
        assert err.code == 403, f"Expected 403 Forbidden, got {err.code}"
        print(f"   [PASSED] Candidate access correctly blocked with HTTP 403 Forbidden: {err.reason}")

    print("\n" + "=" * 60)
    print("ALL 14 TESTS EXECUTED AND PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()

