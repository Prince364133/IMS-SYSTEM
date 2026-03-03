import requests  
import json  
BASE_URL = 'http://127.0.0.1:5000/api'  
  
def test_login():  
    print('Testing Login...')  
    try:  
        resp = requests.post(f'{BASE_URL}/auth/login', json={'email': 'admin3641@instaura.live', 'password': 'Instaura364133'})  
        if resp.status_code == 200:  
            print(' Login Successful!')  
            return resp.json().get('access_token')  
        else:  
            print(f' Login Failed: {resp.status_code} - {resp.text}')  
            return None  
    except Exception as e:  
        print(f' Error: {e}')  
        return None  
  
def run_tests():  
    token = test_login()  
    if not token: return  
    headers = {'Authorization': f'Bearer {token}'}  
    endpoints = ['/projects', '/tasks', '/users/me']  
    for ep in endpoints:  
        print(f'\nTesting GET {ep}...')  
        resp = requests.get(f'{BASE_URL}{ep}', headers=headers)  
        if resp.status_code == 200:  
            print(f' Success: {len(resp.json())} items/keys returned')  
        else:  
            print(f' Failed: {resp.status_code} - {resp.text}')  
  
if __name__ == '__main__':  
    run_tests() 
