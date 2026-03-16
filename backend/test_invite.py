import requests
import json

url = "http://localhost:8080/api/recruiter/invite"
data = {
    "token": "test_token",
    "name": "Test Partner",
    "email": "test@partner.com",
    "code": "testcode123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
