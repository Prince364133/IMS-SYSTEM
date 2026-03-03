import requests
import json
token = ""
try:
    resp = requests.post("http://127.0.0.1:5000/api/auth/login", json={"email": "admin3641@instaura.live", "password": "Instaura364133"})
    if resp.status_code == 200:
        token = resp.json().get("token")
except Exception as e:
    pass

if token:
    res = requests.get("http://127.0.0.1:5000/api/projects", headers={"Authorization": f"Bearer {token}"})
    print(json.dumps(res.json(), indent=2))
else:
    print("Could not login")
