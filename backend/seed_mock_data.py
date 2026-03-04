"""
Instaura IMS - Mock Data Seeder
Run from backend dir: python seed_mock_data.py
"""
import requests
import sys

# Fix encoding for Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://127.0.0.1:5000"


def get_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin3641@instaura.live",
        "password": "Instaura364133"
    })
    if r.status_code != 200:
        print(f"[ERROR] Login failed: {r.status_code} - {r.text}")
        return None
    data = r.json()
    token = data.get("access_token") or data.get("token")
    print(f"[OK] Logged in. Token: {token[:20]}...")
    return token


def h(token):
    return {"Authorization": f"Bearer {token}"}


def seed_employees(token):
    employees = [
        {"name": "Rahul Sharma",  "email": "rahul.sharma@instaura.live",  "password": "Test@1234", "role": "employee"},
        {"name": "Priya Patel",   "email": "priya.patel@instaura.live",   "password": "Test@1234", "role": "manager"},
        {"name": "Arjun Singh",   "email": "arjun.singh@instaura.live",   "password": "Test@1234", "role": "employee"},
        {"name": "Sneha Mehta",   "email": "sneha.mehta@instaura.live",   "password": "Test@1234", "role": "employee"},
        {"name": "Vikram Joshi",  "email": "vikram.joshi@instaura.live",  "password": "Test@1234", "role": "hr"},
    ]
    ids = []
    for emp in employees:
        r = requests.post(f"{BASE_URL}/api/auth/register", json=emp)
        if r.status_code in (200, 201):
            eid = (r.json().get("user") or {}).get("id") or r.json().get("id")
            print(f"  [OK] Employee: {emp['name']}")
            ids.append(eid)
        else:
            print(f"  [SKIP] {emp['name']}: {r.status_code}")
    return ids


def seed_clients(token):
    clients = [
        {"name": "Reliance Industries",       "email": "contact@relianceindustries.com", "phone": "+91-9000000001", "company": "Reliance", "status": "active"},
        {"name": "Infosys Ltd",               "email": "biz@infosys.com",               "phone": "+91-9000000002", "company": "Infosys",  "status": "active"},
        {"name": "Tata Consultancy Services", "email": "bizdev@tcs.com",                 "phone": "+91-9000000003", "company": "TCS",      "status": "prospect"},
    ]
    ids = []
    for c in clients:
        r = requests.post(f"{BASE_URL}/api/clients", json=c, headers=h(token))
        if r.status_code in (200, 201):
            cid = r.json().get("id") or (r.json().get("client") or {}).get("id")
            print(f"  [OK] Client: {c['name']}")
            ids.append(cid)
        else:
            print(f"  [SKIP] {c['name']}: {r.status_code} - {r.text[:80]}")
    return ids


def seed_projects(token):
    projects = [
        {
            "name": "Instaura Website Redesign",
            "description": "Complete redesign of the Instaura corporate website with glassmorphic UI. Includes mobile-first responsive design and SEO optimization.",
            "status": "in_progress", "priority": "high", "progress": 65,
            "start_date": "2026-01-01", "deadline": "2026-04-30",
        },
        {
            "name": "Mobile App Development",
            "description": "Native Flutter app for iOS and Android with offline-first architecture, real-time sync, biometric auth, and push notifications.",
            "status": "in_progress", "priority": "critical", "progress": 35,
            "start_date": "2026-02-01", "deadline": "2026-07-31",
        },
        {
            "name": "HRMS Integration",
            "description": "Full integration of Instaura IMS with external HRMS platform including payroll sync, leave management, and attendance reporting.",
            "status": "active", "priority": "medium", "progress": 20,
            "start_date": "2026-01-15", "deadline": "2026-05-15",
        },
        {
            "name": "Analytics Dashboard v2",
            "description": "Advanced BI dashboard with real-time KPI tracking, customizable widgets, and predictive analytics using ML models.",
            "status": "planning", "priority": "medium", "progress": 5,
            "start_date": "2026-03-01", "deadline": "2026-09-01",
        },
        {
            "name": "Security Audit 2025",
            "description": "ISO 27001 compliance audit with penetration testing, code review, and infrastructure hardening.",
            "status": "completed", "priority": "high", "progress": 100,
            "start_date": "2025-10-01", "deadline": "2026-01-31",
        },
    ]
    ids = []
    for p in projects:
        r = requests.post(f"{BASE_URL}/api/projects", json=p, headers=h(token))
        if r.status_code in (200, 201):
            pid = r.json().get("id") or (r.json().get("project") or {}).get("id")
            print(f"  [OK] Project: {p['name']}")
            ids.append(pid)
        else:
            print(f"  [SKIP] {p['name']}: {r.status_code} - {r.text[:100]}")
    return ids


def seed_tasks(token, project_ids):
    tasks_map = {
        0: [
            {"title": "Design homepage wireframes",         "description": "Create Figma wireframes for all key pages.", "status": "done",        "priority": "high"},
            {"title": "Implement glassmorphic UI",          "description": "Build reusable Glass components.",           "status": "in_progress",  "priority": "high"},
            {"title": "SEO audit and optimization",         "description": "Optimize for top 20 keywords.",             "status": "todo",          "priority": "medium"},
            {"title": "Write About section content",        "description": "Draft copy for About Us and Team pages.",   "status": "in_progress",  "priority": "low"},
            {"title": "Deploy to Vercel production",        "description": "Set up CI/CD pipeline with Vercel.",        "status": "done",          "priority": "medium"},
        ],
        1: [
            {"title": "Flutter project scaffold",           "description": "Set up feature-first architecture.",        "status": "done",          "priority": "critical"},
            {"title": "Auth flow (login/register)",         "description": "JWT auth + secure storage.",               "status": "done",          "priority": "high"},
            {"title": "Dashboard home screen",              "description": "KPI cards, charts, activity feed.",         "status": "in_progress",  "priority": "high"},
            {"title": "Offline sync with Hive",             "description": "Implement Hive for offline storage.",       "status": "todo",          "priority": "medium"},
            {"title": "Unit and integration tests",         "description": "Achieve 80% code coverage.",               "status": "todo",          "priority": "medium"},
        ],
    }
    for idx, task_list in tasks_map.items():
        if idx >= len(project_ids) or not project_ids[idx]:
            continue
        pid = project_ids[idx]
        for task in task_list:
            task["project_id"] = pid
            r = requests.post(f"{BASE_URL}/api/tasks", json=task, headers=h(token))
            if r.status_code in (200, 201):
                print(f"    [OK] Task: {task['title']}")
            else:
                print(f"    [SKIP] {task['title']}: {r.status_code} - {r.text[:80]}")


def seed_jobs(token):
    jobs = [
        {"title": "Senior Flutter Developer", "description": "Build cross-platform apps with Flutter.", "requirements": "3+ yrs Flutter, Dart, Riverpod", "location": "Bangalore", "employment_type": "full_time", "salary_range": "Rs 15-25 LPA", "is_active": True},
        {"title": "Python Backend Engineer",  "description": "Design scalable FastAPI microservices.", "requirements": "3+ yrs Python, FastAPI, PostgreSQL", "location": "Remote", "employment_type": "full_time", "salary_range": "Rs 12-20 LPA", "is_active": True},
        {"title": "UI/UX Designer",           "description": "Create stunning glassmorphic interfaces.", "requirements": "2+ yrs Figma, Design Systems", "location": "Mumbai", "employment_type": "full_time", "salary_range": "Rs 10-18 LPA", "is_active": True},
        {"title": "DevOps Engineer",          "description": "Maintain cloud infrastructure and pipelines.", "requirements": "2+ yrs Docker, K8s, Terraform", "location": "Hyderabad", "employment_type": "full_time", "salary_range": "Rs 14-22 LPA", "is_active": True},
    ]
    for job in jobs:
        r = requests.post(f"{BASE_URL}/api/jobs", json=job, headers=h(token))
        if r.status_code in (200, 201):
            print(f"  [OK] Job: {job['title']}")
        else:
            print(f"  [SKIP] {job['title']}: {r.status_code} - {r.text[:80]}")


def main():
    print("\n[SEEDER] Seeding Instaura IMS with mock data...\n")
    token = get_token()
    if not token:
        print("[FATAL] Cannot get token. Is the backend running on port 5000?")
        return

    print("\n[Employees]")
    emp_ids = seed_employees(token)

    print("\n[Clients]")
    client_ids = seed_clients(token)

    print("\n[Projects]")
    project_ids = seed_projects(token)

    print("\n[Tasks]")
    seed_tasks(token, project_ids)

    print("\n[Jobs]")
    seed_jobs(token)

    print("\n[DONE] Summary:")
    print(f"  Employees: {len([e for e in emp_ids if e])}")
    print(f"  Clients:   {len([c for c in client_ids if c])}")
    print(f"  Projects:  {len([p for p in project_ids if p])}")


if __name__ == "__main__":
    main()
