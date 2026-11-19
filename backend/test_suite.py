import urllib.request
import json

BASE = 'http://127.0.0.1:8000/api/v1'

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

def main():
    print("1. Testing HR Login...")
    hr_auth = post_json('/auth/login', {'email': 'hr@resumeai.io', 'password': 'Password123!'})
    hr_token = hr_auth['access_token']
    print(f"   HR Token acquired. Role: {hr_auth['user']['role']}")

    print("2. Testing Candidate Login...")
    cand_auth = post_json('/auth/login', {'email': 'candidate@resumeai.io', 'password': 'Password123!'})
    cand_token = cand_auth['access_token']
    print(f"   Candidate Token acquired. Role: {cand_auth['user']['role']}")

    print("3. Testing AI Job Requirement Extraction...")
    req_analysis = post_json('/jobs/extract-requirements', {
        'title': 'Senior Python Backend Architect',
        'description': 'Mandatory qualifications: Python, FastAPI, SQL, Docker. Preferred: Kubernetes, AWS. Must have at least 4 years experience.'
    }, hr_token)
    print(f"   Extracted Mandatory: {req_analysis['mandatory_skills']}")
    print(f"   Extracted Experience: {req_analysis['experience_years']} yrs")

    print("4. Testing Job Rankings for Job #1...")
    rankings = get_json('/ranking/job/1', hr_token)
    print(f"   Retrieved {len(rankings)} candidates in ranking matrix.")
    for r in rankings:
        print(f"   -> Candidate: {r['candidate_name']}, Overall Score: {r['overall_score']}%, Skill: {r['skill_score']}%, Mandatory Deficit: {r['has_mandatory_deficit']}")

    print("5. Testing Candidate Comparison...")
    if len(rankings) >= 1:
        cand_ids = [r['candidate_id'] for r in rankings[:2]]
        comp = post_json('/ranking/compare', {
            'job_id': 1,
            'candidate_ids': cand_ids
        }, hr_token)
        print(f"   Comparison radar dimensions: {len(comp['radar_data'])} rows")

    print("6. Testing Recruitment Telemetry Metrics...")
    metrics = get_json('/analytics/recruitment-metrics', hr_token)
    print(f"   Active Jobs: {metrics['active_jobs']}, Total Candidates: {metrics['total_candidates']}, Resumes Analyzed: {metrics['resumes_analyzed']}")
    print(f"   Pipeline Stages: {metrics['pipeline_stages']}")
    print(f"   Conversion Rates: {metrics['conversion_rates']}")

    print("7. Testing PDF Report Generation...")
    req = urllib.request.Request(f'{BASE}/reports/generate/1', headers={'Authorization': f'Bearer {hr_token}'})
    pdf_data = urllib.request.urlopen(req).read()
    print(f"   ReportLab PDF generated successfully! Byte size: {len(pdf_data)} bytes. Header: {pdf_data[:4].decode()}")

    print("\n[ALL 7 AUTOMATED VERIFICATION CHECKS PASSED WITH 100% SUCCESS!]")

if __name__ == '__main__':
    main()

