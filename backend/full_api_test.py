import requests
import json

BASE_URL = 'http://127.0.0.1:5000/api'
PASS_ICON = "[PASS]"
FAIL_ICON = "[FAIL]"
results = []

def check(name, condition, detail=""):
    status = PASS_ICON if condition else FAIL_ICON
    msg = f"  {status} {name}"
    if detail:
        msg += f" -> {detail}"
    print(msg)
    results.append((name, condition))

def login():
    print("\n--- 1. AUTH ---")
    resp = requests.post(f'{BASE_URL}/auth/login', json={'email': 'admin3641@instaura.live', 'password': 'Instaura364133'})
    check("POST /auth/login", resp.status_code == 200, f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        token = data.get('token')
        check("Token returned", bool(token), str(token)[:30] if token else "None")
        return token
    print(f"  RAW: {resp.text[:200]}")
    return None

def test_me(headers):
    resp = requests.get(f'{BASE_URL}/auth/me', headers=headers)
    check("GET /auth/me (profile)", resp.status_code == 200, f"Status: {resp.status_code}")
    if resp.status_code == 200:
        user = resp.json().get('user', {})
        check("User role is admin", user.get('role') == 'admin', user.get('role'))

def test_users(headers):
    print("\n--- 2. USERS ---")
    resp = requests.get(f'{BASE_URL}/users', headers=headers)
    check("GET /users (list)", resp.status_code == 200, f"Status: {resp.status_code}")
    if resp.status_code == 200:
        check("Users data returned", 'users' in resp.json() or isinstance(resp.json(), list))

def test_projects(headers):
    print("\n--- 3. PROJECTS ---")
    # List
    resp = requests.get(f'{BASE_URL}/projects', headers=headers)
    check("GET /projects (list)", resp.status_code == 200, f"Status: {resp.status_code}")

    # Create
    payload = {"name": "Test Automated Project", "description": "Created by automated test", "status": "active"}
    resp = requests.post(f'{BASE_URL}/projects', json=payload, headers=headers)
    check("POST /projects (create)", resp.status_code in [200, 201], f"Status: {resp.status_code}")
    if resp.status_code in [200, 201]:
        project_id = resp.json().get('project', {}).get('id')
        check("Project ID returned", bool(project_id), str(project_id))
        return project_id
    print(f"  RAW: {resp.text[:200]}")
    return None

def test_tasks(headers, project_id=None):
    print("\n--- 4. TASKS ---")
    resp = requests.get(f'{BASE_URL}/tasks', headers=headers)
    check("GET /tasks (list)", resp.status_code == 200, f"Status: {resp.status_code}")
    if project_id:
        payload = {"title": "Automated Test Task", "project_id": project_id, "status": "todo", "priority": "medium"}
        resp = requests.post(f'{BASE_URL}/tasks', json=payload, headers=headers)
        check("POST /tasks (create)", resp.status_code in [200, 201], f"Status: {resp.status_code}")

def test_clients(headers):
    print("\n--- 5. CLIENTS ---")
    resp = requests.get(f'{BASE_URL}/clients', headers=headers)
    check("GET /clients (list)", resp.status_code == 200, f"Status: {resp.status_code}")

def test_goals(headers):
    print("\n--- 6. GOALS ---")
    resp = requests.get(f'{BASE_URL}/goals', headers=headers)
    check("GET /goals (list)", resp.status_code == 200, f"Status: {resp.status_code}")

def test_health():
    print("\n--- 7. HEALTH ---")
    # health router has prefix /health (not /api/health)
    resp = requests.get('http://127.0.0.1:5000/health')
    check("GET /health", resp.status_code == 200, f"Status: {resp.status_code}")

def test_attendance(headers):
    print("\n--- 8. ATTENDANCE ---")
    resp = requests.get(f'{BASE_URL}/attendance/today', headers=headers)
    check("GET /attendance/today", resp.status_code in [200, 403], f"Status: {resp.status_code}")

def test_jobs(headers):
    print("\n--- 9. JOBS ---")
    resp = requests.get(f'{BASE_URL}/jobs', headers=headers)
    check("GET /jobs (listing)", resp.status_code == 200, f"Status: {resp.status_code}")

def run():
    print("=" * 50)
    print("  INSTAURA IMS API - AUTOMATED TEST SUITE")
    print("=" * 50)

    token = login()
    if not token:
        print("\n[FATAL] Unable to authenticate. Stopping tests.")
        return

    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    test_me(headers)
    test_users(headers)
    project_id = test_projects(headers)
    test_tasks(headers, project_id)
    test_clients(headers)
    test_goals(headers)
    test_health()
    test_attendance(headers)
    test_jobs(headers)

    print("\n" + "=" * 50)
    passed = sum(1 for _, ok in results if ok)
    failed = sum(1 for _, ok in results if not ok)
    print(f"  RESULTS: {passed} passed, {failed} failed out of {len(results)} tests")
    print("=" * 50)
    if failed:
        print("\n  Failed tests:")
        for name, ok in results:
            if not ok:
                print(f"    - {name}")

if __name__ == '__main__':
    run()
