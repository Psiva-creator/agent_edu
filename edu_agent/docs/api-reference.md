# 📡 API Reference — Career Guide AI

> Complete API reference for all endpoints. Base URL: `http://localhost:8000/api/v1`

---

## Authentication

No authentication required. The API is open for development.

> **Future:** JWT-based authentication will be added.

---

## Common Response Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created (new resource generated) |
| `400` | Bad Request (invalid input) |
| `404` | Not Found |
| `422` | Validation Error (Pydantic) |
| `500` | Internal Server Error |

---

## 🔍 Resume Endpoints

### POST `/resume/analyze`

Analyze resume text and return comprehensive feedback.

**Request Body:**

```json
{
  "resume_text": "John Doe. 3 years experience in Python, Django, SQL...",
  "target_role": "Backend Developer"
}
```

**Response (200):**

```json
{
  "target_role": "Backend Developer",
  "extracted_skills": ["Python", "Django", "SQL"],
  "missing_skills": ["Docker", "System Design", "Testing"],
  "readiness_score": 62.5,
  "readiness_label": "Competent",
  "career_path": [
    {"role": "Backend Developer", "match_percentage": 50, "matching_skills": 3, "total_required": 6}
  ],
  "experience_years": 3,
  "strengths": ["Strong technical breadth with 8 skills identified"],
  "improvements": ["Add missing skills: Docker, System Design"],
  "ats_suggestions": ["Include the target role 'Backend Developer' in your summary"],
  "summary": "Resume analyzed for 'Backend Developer' role...",
  "score": 62.5
}
```

---

### POST `/resume/export/markdown`

Export resume data as formatted Markdown.

**Request Body:**

```json
{
  "name": "Rishi Sharma",
  "email": "rishi@example.com",
  "phone": "+91 9876543210",
  "summary": "Full-stack developer with 2 years experience.",
  "skills": ["Python", "React", "Docker"],
  "experience": [
    {
      "title": "SDE Intern",
      "company": "Startup Inc",
      "duration": "2024 – 2025",
      "points": ["Built REST APIs", "Reduced latency by 40%"]
    }
  ],
  "education": [
    {"degree": "B.Tech CS", "institution": "IIT Hyderabad", "year": "2025"}
  ],
  "projects": [
    {"name": "Career Guide AI", "description": "Multi-agent platform", "tech": ["FastAPI", "React"]}
  ],
  "certifications": ["AWS Cloud Practitioner"]
}
```

**Response (200):**

```json
{
  "format": "markdown",
  "content": "# Rishi Sharma\nrishi@example.com | +91 9876543210\n\n## Professional Summary\n..."
}
```

---

### POST `/resume/export/html`

Export resume as professionally styled HTML (Jinja2 template).

**Request Body:** Same as `/resume/export/markdown`

**Response (200):** Full HTML document (`Content-Type: text/html`)

---

### POST `/resume/export/pdf`

Export resume as downloadable PDF.

**Request Body:** Same as `/resume/export/markdown`

**Response (200):** PDF file (`Content-Type: application/pdf`, `Content-Disposition: attachment`)

**Response (500):**

```json
{"error": "PDF generation failed. Ensure xhtml2pdf is installed.", "status_code": 500}
```

---

## 🗺️ Roadmap Endpoints

### POST `/roadmap`

Generate a personalized week-by-week career roadmap.

**Request Body:**

```json
{
  "current_role": "Student",
  "target_role": "Data Scientist",
  "skill_gaps": ["Machine Learning", "Statistics", "Deep Learning"],
  "hours_per_week": 15,
  "deadline_weeks": 10,
  "skills": ["Python", "SQL"]
}
```

**Response (201):**

```json
{
  "current_role": "Student",
  "target_role": "Data Scientist",
  "total_weeks": 10,
  "hours_per_week": 15,
  "total_estimated_hours": 150,
  "skill_gaps_addressed": ["Machine Learning", "Statistics", "Deep Learning"],
  "weeks": [
    {
      "week_number": 1,
      "theme": "Python & Statistics Foundations",
      "phase": "Foundations",
      "learning_objectives": ["Master Python basics", "Understand descriptive statistics"],
      "tasks": [
        {"title": "Complete Python basics", "description": "...", "estimated_hours": 5.0, "priority": "high", "type": "learning"}
      ],
      "resources": [
        {"title": "Python Documentation", "url": "https://docs.python.org/3/", "type": "docs", "skill": "Python"}
      ],
      "practice": ["Solve 5 Python problems on HackerRank"],
      "mini_project": {
        "title": "Data Analysis Script",
        "description": "Analyze a CSV dataset",
        "skills_used": ["Python", "pandas"],
        "difficulty": "beginner"
      },
      "milestone": {
        "title": "Python Proficiency",
        "description": "Complete Python fundamentals",
        "deliverable": "5 solved problems + 1 script",
        "week": 1
      },
      "estimated_hours": 15.0
    }
  ],
  "summary": "10-week roadmap from Student to Data Scientist..."
}
```

---

## 📚 Resources Endpoints

### GET `/resources`

List all available skills in the library.

**Response (200):**

```json
{
  "skills": [
    "AWS", "CSS & Responsive Design", "Data Analysis", "Data Structures & Algorithms",
    "Docker", "FastAPI", "Git & GitHub", "JavaScript", "Kubernetes",
    "Machine Learning", "Node.js", "PyTorch", "Python", "React",
    "SQL", "System Design", "TensorFlow", "TypeScript"
  ],
  "total": 18
}
```

---

### GET `/resources/{skill}`

Get full resource data for a specific skill.

**Example:** `GET /resources/python`

**Response (200) — Found:**

```json
{
  "found": true,
  "query": "python",
  "skill": {
    "name": "Python",
    "category": "Programming Language",
    "difficulty": "beginner",
    "estimated_hours": 60,
    "official_docs": {"title": "Python Official Documentation", "url": "https://docs.python.org/3/"},
    "youtube_playlist": {"title": "Python for Beginners", "url": "https://www.youtube.com/watch?v=_uQrJ0TkZlc", "channel": "Programming with Mosh"},
    "free_course": {"title": "Python for Everybody", "url": "https://www.coursera.org/specializations/python", "platform": "Coursera"},
    "practice_website": {"title": "HackerRank — Python Practice", "url": "https://www.hackerrank.com/domains/python"},
    "mini_project": {"title": "CLI Task Manager", "description": "Build a command-line to-do app...", "skills_practiced": ["file I/O", "OOP"], "estimated_hours": 8}
  }
}
```

**Response (200) — Not Found:**

```json
{
  "found": false,
  "query": "django",
  "message": "Skill 'django' not found in resource library.",
  "suggestions": [],
  "available_skills": ["AWS", "CSS & Responsive Design", "..."]
}
```

---

### GET `/resources/meta/stats`

Get library statistics.

**Response (200):**

```json
{
  "total_skills": 18,
  "categories": ["Architecture", "Backend Framework", "Cloud Computing", "..."],
  "total_categories": 10,
  "difficulty_breakdown": {"beginner": 5, "intermediate": 8, "advanced": 5},
  "total_estimated_hours": 1115,
  "average_hours_per_skill": 61.9
}
```

---

### GET `/resources/meta/recommend?known=Python,SQL&difficulty=intermediate&limit=3`

Get skill recommendations.

**Response (200):**

```json
{
  "recommendations": [
    {"key": "docker", "name": "Docker", "category": "DevOps", "difficulty": "intermediate", "estimated_hours": 35},
    {"key": "fastapi", "name": "FastAPI", "category": "Backend Framework", "difficulty": "intermediate", "estimated_hours": 45}
  ],
  "count": 2
}
```

---

## 📊 Report Endpoints

### POST `/report`

Generate a Career Intelligence Report.

**Request Body:**

```json
{
  "name": "Rishi Sharma",
  "current_role": "Student",
  "target_role": "Data Scientist",
  "skills": ["Python", "SQL", "Machine Learning"],
  "experience_years": 1,
  "education": "B.Tech Computer Science",
  "location": "Hyderabad"
}
```

**Response (201):**

```json
{
  "name": "Rishi Sharma",
  "current_role": "Student",
  "target_role": "Data Scientist",
  "generated_at": "July 04, 2026 at 10:00 AM",
  "candidate_summary": "Rishi Sharma is a Student with 1 year(s) of experience...",
  "readiness_score": 53,
  "readiness_label": "Competent",
  "strengths": ["Solid foundation with 3 relevant skills", "Python proficiency"],
  "weaknesses": ["Missing 3 critical skills", "Limited industry experience"],
  "skill_gaps": ["Statistics", "Data Visualization", "Deep Learning"],
  "expected_salary": {"currency": "INR", "min": 600000, "max": 2500000, "median": 1200000},
  "target_roles": [
    {"title": "Data Scientist", "match": 50, "matched_skills": 3, "total_required": 6, "is_primary": true}
  ],
  "roadmap_summary": "Phase 1 (Weeks 1–6): Build foundations in Statistics...",
  "mentor_advice": "Rishi, you have a Student background...",
  "certifications": ["Google Data Analytics Certificate", "IBM Data Science Professional"],
  "hiring_companies": ["Google", "Amazon", "Microsoft", "Flipkart"],
  "overall_recommendation": "Good candidate for junior Data Scientist roles...",
  "next_steps": ["Complete an online course in Statistics", "Build 2–3 portfolio projects"]
}
```

---

### GET `/report/html`

Preview the last generated report as styled HTML.

**Response (200):** Full HTML page (`Content-Type: text/html`)

**Response (404):**

```json
{"error": "No report generated yet. Call POST /report first.", "status_code": 404}
```

---

### GET `/report/pdf`

Download the last generated report as PDF.

**Response (200):** PDF file (`Content-Type: application/pdf`)

**Response (404):**

```json
{"error": "No report generated yet. Call POST /report first.", "status_code": 404}
```

---

## 🩺 System Endpoints

### GET `/health`

```json
{"status": "healthy", "version": "1.0.0", "llm_available": false, "debug": false}
```

### GET `/`

Returns API info with full endpoint directory.

### GET `/docs`

Interactive Swagger UI documentation.

### GET `/redoc`

ReDoc API documentation.
