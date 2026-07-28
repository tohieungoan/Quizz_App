import requests

url = "http://127.0.0.1:8000/api/v1/users/import"
headers = {
    # We would need an admin token to test this directly via API.
    # To bypass, we can just run the test directly or use a dummy token if auth is disabled.
}

csv_content = """email,fullname,password,role,status
test1@example.com,Test 1,password123,USER,ACTIVE
test2@example.com,Test 2,pass,USER,ACTIVE
test3@example.com,Test 3,password123,INVALID_ROLE,ACTIVE
"""

with open("test_import.csv", "w") as f:
    f.write(csv_content)

print("Created test CSV.")
