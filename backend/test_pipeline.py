import requests
import base64
from fpdf import FPDF
import json
import time

# 1. Create a dummy PDF
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, txt="John Doe - Software Engineer", ln=True, align='C')
pdf.cell(200, 10, txt="Skills: Python, React, Docker", ln=True)
pdf.cell(200, 10, txt="Experience: 2020 - 2023 Worked at Tech Corp", ln=True)
pdf.output("dummy_resume.pdf")

# 2. Base64 encode it
with open("dummy_resume.pdf", "rb") as f:
    encoded = base64.b64encode(f.read()).decode('utf-8')

print("1. Uploading PDF...")
res1 = requests.post("http://localhost:8000/api/v1/resume/upload/base64", json={
    "filename": "dummy_resume.pdf",
    "content_base64": encoded
})
print("Upload Status:", res1.status_code)
if res1.status_code != 200:
    print(res1.text)
    exit(1)
text = res1.json().get('text')

print("2. Analyzing Resume...")
res2 = requests.post("http://localhost:8000/api/v1/resume/analyze", json={
    "resume_text": text,
    "target_role": "Software Engineer"
})
print("Analyze Status:", res2.status_code)
analysis = res2.json()

print("3. Generating Report...")
res3 = requests.post("http://localhost:8000/api/v1/report", json={
    "name": "John Doe",
    "current_role": "Student",
    "target_role": "Software Engineer",
    "skills": analysis.get("extracted_skills"),
    "experience_years": analysis.get("experience_years"),
    "education": "B.Tech",
    "location": "India"
})
print("Report Status:", res3.status_code)
if res3.status_code == 201:
    print("SUCCESS! Pipeline works end-to-end.")
else:
    print("FAILED!", res3.text)
