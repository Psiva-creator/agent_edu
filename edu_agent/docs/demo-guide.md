# 🎬 Demo Guide — Career Guide AI

> Step-by-step guide to demonstrate all features of the Career Guide AI platform.

---

## Prerequisites

1. Python 3.11+ installed
2. Dependencies installed: `pip install -r requirements.txt`
3. Server running: `uvicorn app:app --reload --port 8000`
4. Browser open at: `http://localhost:8000/docs` (Swagger UI)

---

## Demo Flow

```
Step 1: Health Check
     ↓
Step 2: Browse Resources
     ↓
Step 3: Analyze Resume
     ↓
Step 4: Export Resume (MD → HTML → PDF)
     ↓
Step 5: Generate Roadmap
     ↓
Step 6: Generate Career Report
     ↓
Step 7: Download Report PDF
```

---

## Step 1: Health Check

Verify the server is running.

```bash
curl http://localhost:8000/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "llm_available": false,
  "debug": false
}
```

---

## Step 2: Browse the Resource Library

### List all skills

```bash
curl http://localhost:8000/api/v1/resources
```

### Look up a specific skill

```bash
curl http://localhost:8000/api/v1/resources/python
```

### Get recommendations

```bash
curl "http://localhost:8000/api/v1/resources/meta/recommend?known=Python,SQL&difficulty=intermediate&limit=3"
```

### View library statistics

```bash
curl http://localhost:8000/api/v1/resources/meta/stats
```

---

## Step 3: Analyze a Resume

```bash
curl -X POST http://localhost:8000/api/v1/resume/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Rishi Sharma. B.Tech Computer Science from IIT Hyderabad. 1 year experience as Python Developer at TechCorp. Skills: Python, SQL, FastAPI, Docker, Git, REST API, Machine Learning. Built a recommendation engine that improved click-through rates by 25%. Developed microservices handling 10000 requests per second. Projects: Career Guide AI - Multi-agent career intelligence platform using FastAPI and OpenAI.",
    "target_role": "Backend Developer"
  }'
```

**What to observe:**
- Extracted skills from the resume text
- Missing skills for "Backend Developer"
- Readiness score (0–100) with label
- Career path matches ranked by percentage
- Strengths and areas for improvement
- ATS optimization suggestions

---

## Step 4: Export Resume

### 4a. Export as Markdown

```bash
curl -X POST http://localhost:8000/api/v1/resume/export/markdown \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rishi Sharma",
    "email": "rishi@example.com",
    "phone": "+91 9876543210",
    "linkedin": "linkedin.com/in/rishi",
    "github": "github.com/rishi",
    "summary": "Full-stack developer with expertise in Python, FastAPI, and cloud technologies. Passionate about building scalable backend systems.",
    "skills": ["Python", "FastAPI", "Docker", "SQL", "React", "Git", "AWS"],
    "experience": [
      {
        "title": "Software Developer Intern",
        "company": "TechCorp India",
        "duration": "Jan 2024 – Dec 2024",
        "points": [
          "Built REST APIs serving 10K+ requests/day using FastAPI",
          "Improved database query performance by 40% through indexing",
          "Implemented CI/CD pipeline using GitHub Actions"
        ]
      }
    ],
    "education": [
      {"degree": "B.Tech Computer Science", "institution": "IIT Hyderabad", "year": "2025"}
    ],
    "projects": [
      {
        "name": "Career Guide AI",
        "description": "Multi-agent career intelligence platform with resume analysis, roadmap generation, and report exports.",
        "tech": ["FastAPI", "OpenAI", "Jinja2", "xhtml2pdf"]
      }
    ],
    "certifications": ["AWS Cloud Practitioner", "Google Data Analytics"]
  }'
```

### 4b. Export as HTML

Use the same request body but change the endpoint:

```bash
curl -X POST http://localhost:8000/api/v1/resume/export/html \
  -H "Content-Type: application/json" \
  -d '{ ... same body ... }' > resume.html
```

Open `resume.html` in a browser to preview.

### 4c. Export as PDF

```bash
curl -X POST http://localhost:8000/api/v1/resume/export/pdf \
  -H "Content-Type: application/json" \
  -d '{ ... same body ... }' -o resume.pdf
```

Open `resume.pdf` to view the professionally formatted PDF.

---

## Step 5: Generate a Career Roadmap

```bash
curl -X POST http://localhost:8000/api/v1/roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "current_role": "Student",
    "target_role": "Data Scientist",
    "skill_gaps": ["Machine Learning", "Statistics", "Deep Learning", "Data Visualization"],
    "hours_per_week": 15,
    "deadline_weeks": 10,
    "skills": ["Python", "SQL"]
  }'
```

**What to observe:**
- 10-week structured plan
- 4 learning phases (Foundations → Core → Advanced → Portfolio)
- Each week has: theme, objectives, tasks, resources, practice, mini-project, milestone
- Hours distributed across weeks

---

## Step 6: Generate Career Intelligence Report

```bash
curl -X POST http://localhost:8000/api/v1/report \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rishi Sharma",
    "current_role": "Student",
    "target_role": "Data Scientist",
    "skills": ["Python", "SQL", "Machine Learning"],
    "experience_years": 1,
    "education": "B.Tech Computer Science",
    "location": "Hyderabad"
  }'
```

**What to observe (12 sections):**
1. Candidate Summary
2. Readiness Score (0–100)
3. Strengths
4. Weaknesses
5. Skill Gaps
6. Salary Estimate (INR)
7. Target Roles (ranked)
8. Roadmap Summary
9. Mentor Advice
10. Recommended Certifications
11. Hiring Companies
12. Overall Recommendation

---

## Step 7: Preview & Download Report

### Preview as HTML

Open in browser: `http://localhost:8000/api/v1/report/html`

### Download as PDF

```bash
curl http://localhost:8000/api/v1/report/pdf -o career_report.pdf
```

---

## Using Swagger UI

The easiest way to test all endpoints is via the interactive Swagger UI:

1. Open `http://localhost:8000/docs`
2. Each endpoint has a **"Try it out"** button
3. Fill in the request body (examples are pre-populated)
4. Click **"Execute"**
5. View the response below

### Tag Groups in Swagger

| Tag | Endpoints |
|-----|-----------|
| **System** | `/health`, `/` |
| **Resume** | `/resume/analyze`, `/resume/export/*` |
| **Roadmap** | `/roadmap` |
| **Resources** | `/resources`, `/resources/{skill}` |
| **Report** | `/report`, `/report/html`, `/report/pdf` |

---

## Common Test Scenarios

### Scenario 1: Fresh Graduate

```json
{
  "name": "Priya Kumar",
  "current_role": "Student",
  "target_role": "Software Engineer",
  "skills": ["Python", "HTML", "CSS"],
  "experience_years": 0,
  "education": "B.Tech CS"
}
```

**Expected:** Low readiness score (~25–35), many skill gaps, beginner-focused recommendations.

### Scenario 2: Career Switcher

```json
{
  "name": "Amit Patel",
  "current_role": "Mechanical Engineer",
  "target_role": "Data Scientist",
  "skills": ["Python", "MATLAB", "Statistics"],
  "experience_years": 5,
  "education": "M.Tech"
}
```

**Expected:** Medium readiness (~45–55), experience boosts score, gaps in ML/DL.

### Scenario 3: Experienced Developer

```json
{
  "name": "Neha Gupta",
  "current_role": "Backend Developer",
  "target_role": "Full Stack Developer",
  "skills": ["Python", "Django", "SQL", "Docker", "Git", "REST API", "AWS"],
  "experience_years": 4,
  "education": "B.Tech CS"
}
```

**Expected:** High readiness (~70–80), few gaps (React, JavaScript), ready to apply.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| `Port 8000 in use` | Use `--port 8001` |
| PDF generation fails | Install `xhtml2pdf`: `pip install xhtml2pdf` |
| LLM not available | This is normal without an OpenAI key — fallback mode works |
| 422 Validation Error | Check your request body matches the schema in Swagger |
