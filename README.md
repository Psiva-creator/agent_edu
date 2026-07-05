# 🎯 Career Guide AI — Multi-Agent Career Intelligence Platform

> An AI-powered career guidance system built with FastAPI and a multi-agent architecture. Analyze resumes, generate personalized roadmaps, browse curated learning resources, and create comprehensive Career Intelligence Reports.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Server](#-running-the-server)
- [API Endpoints](#-api-endpoints)
- [Multi-Agent Flow](#-multi-agent-flow)
- [Screenshots](#-screenshots)
- [Deployment Guide](#-deployment-guide)
- [Future Scope](#-future-scope)
- [Team Contributions](#-team-contributions)
- [License](#-license)

---

## 🌟 Overview

Career Guide AI is a production-grade, multi-agent career intelligence platform that helps users:

1. **Analyze their resume** — Extract skills, identify gaps, calculate readiness scores, and get ATS optimization tips.
2. **Generate career roadmaps** — Personalized week-by-week learning plans with tasks, resources, projects, and milestones.
3. **Browse learning resources** — Curated library of 18+ skills with official docs, YouTube playlists, free courses, practice sites, and mini-projects.
4. **Generate Career Intelligence Reports** — One-page comprehensive reports with readiness scores, salary estimates, target roles, mentor advice, and more.

The system works **with or without an OpenAI API key** — every agent has an intelligent fallback engine.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Resume Analysis** | Extract 60+ skills, readiness scoring (5-factor weighted), career path matching |
| 📝 **Resume Export** | Markdown → HTML (Jinja2) → PDF (xhtml2pdf) pipeline |
| 🗺️ **Career Roadmap** | 10-week personalized plans with 4 learning phases |
| 📚 **Resource Library** | 18 skills with docs, YouTube, courses, practice sites, projects |
| 📊 **Career Reports** | 12-section intelligence reports with salary, certifications, companies |
| 🤖 **LLM Integration** | OpenAI GPT-4 with retry, caching, and graceful fallback |
| 📄 **PDF Export** | Professional PDF generation for resumes and reports |
| 🔧 **Production-Ready** | Dependency injection, structured logging, error handling, API versioning |

---

## 🏗️ Architecture

The system follows a **clean, layered architecture**:

```
┌─────────────────────────────────────────────────┐
│                   FastAPI App                    │
│              (app.py + middleware)               │
├─────────────────────────────────────────────────┤
│                 API Routers (v1)                 │
│   resume │ roadmap │ resources │ report │ career │
├─────────────────────────────────────────────────┤
│                    Agents                        │
│         ResumeAgent  │  RoadmapAgent             │
├─────────────────────────────────────────────────┤
│                   Services                       │
│   LLMService │ ResourceService │ ReportService   │
├─────────────────────────────────────────────────┤
│              Schemas & Config                    │
│        Pydantic Models │ Settings │ Prompts      │
├─────────────────────────────────────────────────┤
│                  Utilities                       │
│    Dependencies │ Exceptions │ Logging           │
└─────────────────────────────────────────────────┘
```

> See [architecture.md](docs/architecture.md) for detailed component diagrams.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | FastAPI 0.139+ |
| **Language** | Python 3.11+ |
| **LLM** | OpenAI GPT-4 (optional) |
| **Validation** | Pydantic v2 |
| **Configuration** | pydantic-settings + python-dotenv |
| **Templates** | Jinja2 |
| **PDF Export** | xhtml2pdf |
| **API Docs** | Swagger UI (auto-generated) |
| **HTTP Client** | httpx |

---

## 📁 Folder Structure

```
career-guide-ai/
├── backend/
│   ├── app.py                    # FastAPI entry point
│   ├── config.py                 # Settings (env vars, Pydantic)
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment template
│   │
│   ├── agents/                   # AI Agents
│   │   ├── __init__.py
│   │   ├── resume_agent.py       # Resume analysis & export
│   │   └── roadmap_agent.py      # Career roadmap generation
│   │
│   ├── services/                 # Business logic services
│   │   ├── llm_service.py        # OpenAI client with retry/cache
│   │   ├── resource_service.py   # Resource library manager
│   │   └── report_service.py     # Career report generator
│   │
│   ├── routers/                  # API route handlers
│   │   ├── resume.py             # /resume/* endpoints
│   │   ├── roadmap.py            # /roadmap endpoint
│   │   ├── resources.py          # /resources/* endpoints
│   │   ├── report.py             # /report/* endpoints
│   │   ├── career.py             # /analyze endpoint
│   │   └── jobs.py               # /jobs endpoint
│   │
│   ├── schemas/                  # Pydantic models
│   │   ├── __init__.py
│   │   └── models.py             # All request/response schemas
│   │
│   ├── prompts/                  # LLM prompt templates
│   │   └── templates.py          # All prompt strings
│   │
│   ├── templates/                # Jinja2 HTML templates
│   │   ├── resume_template.html  # Resume PDF/HTML template
│   │   └── report_template.html  # Report PDF/HTML template
│   │
│   ├── data/                     # Static data
│   │   └── resources.json        # Curated resource library (18 skills)
│   │
│   └── utils/                    # Shared utilities
│       ├── __init__.py
│       ├── dependencies.py       # FastAPI dependency injection
│       ├── exceptions.py         # Custom exception classes
│       └── logging.py            # Structured logging setup
│
└── docs/                         # Documentation
    ├── architecture.md
    ├── api-reference.md
    └── demo-guide.md
```

---

## 🚀 Installation

### Prerequisites

- Python 3.11 or higher
- pip (Python package manager)
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/career-guide-ai.git
cd career-guide-ai/backend

# 2. Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate      # Linux/Mac
.\venv\Scripts\activate       # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key (optional)

# 5. Run the server
uvicorn app:app --reload --port 8000
```

### Verify Installation

```bash
# Check health
curl http://localhost:8000/health

# Open Swagger docs
# Navigate to: http://localhost:8000/docs
```

---

## 🔐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | Career Guide AI | Application name |
| `APP_VERSION` | 1.0.0 | Application version |
| `DEBUG` | false | Enable debug mode |
| `LOG_LEVEL` | INFO | Logging level |
| `HOST` | 0.0.0.0 | Server host |
| `PORT` | 8000 | Server port |
| `OPENAI_API_KEY` | *(empty)* | OpenAI API key *(optional)* |
| `OPENAI_MODEL` | gpt-4 | OpenAI model name |
| `OPENAI_TEMPERATURE` | 0.7 | LLM temperature |
| `OPENAI_MAX_TOKENS` | 4096 | Max tokens per request |
| `EXPORT_DIR` | exports | Directory for exports |
| `MAX_UPLOAD_SIZE_MB` | 10 | Max upload file size |

> **Note:** The app works fully without `OPENAI_API_KEY`. All agents use intelligent fallback engines.

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

### Resume

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/resume/analyze` | Analyze resume text → skills, gaps, score, ATS tips |
| `POST` | `/resume/export/markdown` | Export resume as Markdown |
| `POST` | `/resume/export/html` | Export resume as styled HTML |
| `POST` | `/resume/export/pdf` | Export resume as PDF download |

### Roadmap

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/roadmap` | Generate a personalized career roadmap |

### Resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/resources` | List all 18 skills |
| `GET` | `/resources/{skill}` | Get full resources for a skill |
| `GET` | `/resources/meta/stats` | Library statistics |
| `GET` | `/resources/meta/recommend` | Skill recommendations |

### Report

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/report` | Generate Career Intelligence Report |
| `GET` | `/report/html` | Preview report as HTML |
| `GET` | `/report/pdf` | Download report as PDF |

> Full API documentation with request/response examples at `/docs` (Swagger UI).

---

## 🔄 Multi-Agent Flow

```
User Request
     │
     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Resume Text │────▶│ ResumeAgent  │────▶│ Skills Extracted │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────┐                │
                    │ResourceService│◀──────────────┤
                    └──────┬───────┘                │
                           │                        │
                    ┌──────▼───────┐     ┌──────────▼────────┐
                    │ RoadmapAgent │     │   ReportService    │
                    └──────┬───────┘     └──────────┬────────┘
                           │                        │
                    ┌──────▼───────┐     ┌──────────▼────────┐
                    │  10-Week     │     │  Intelligence      │
                    │  Roadmap     │     │  Report            │
                    └──────────────┘     └───────────────────┘
```

1. **User submits resume** → ResumeAgent extracts skills, calculates readiness
2. **Skill gaps identified** → ResourceService provides learning resources
3. **RoadmapAgent** creates week-by-week plan using skill gaps + resources
4. **ReportService** aggregates all data into a Career Intelligence Report

---

## 📸 Screenshots

> *Screenshots will be added after UI development.*

| Screenshot | Description |
|-----------|-------------|
| `screenshots/swagger-docs.png` | Swagger API documentation |
| `screenshots/resume-analysis.png` | Resume analysis response |
| `screenshots/roadmap-output.png` | Generated career roadmap |
| `screenshots/report-html.png` | Career Intelligence Report (HTML) |
| `screenshots/report-pdf.png` | Career Intelligence Report (PDF) |
| `screenshots/resources-list.png` | Resource library listing |

---

## 🚢 Deployment Guide

### Local Development

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t career-guide-ai .
docker run -p 8000:8000 --env-file .env career-guide-ai
```

### Production (Gunicorn + Uvicorn Workers)

```bash
pip install gunicorn
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Cloud Deployment

| Platform | Command |
|----------|---------|
| **Render** | Connect GitHub repo → set build command to `pip install -r requirements.txt` |
| **Railway** | `railway deploy` |
| **AWS EC2** | Use Docker or Gunicorn behind Nginx |
| **Heroku** | Add `Procfile`: `web: uvicorn app:app --host 0.0.0.0 --port $PORT` |

---

## 🔮 Future Scope

| Feature | Priority | Description |
|---------|----------|-------------|
| 🖥️ React Frontend | High | Interactive UI with dashboards and visualizations |
| 🧠 LangChain Agents | High | Advanced multi-agent orchestration with memory |
| 🔐 User Authentication | Medium | JWT-based auth with user profiles |
| 💾 Database Integration | Medium | PostgreSQL for persistent user data |
| 📊 Analytics Dashboard | Medium | Track user progress over time |
| 🤝 Mentor Matching | Low | Connect users with career mentors |
| 📱 Mobile App | Low | React Native mobile application |
| 🌐 Job Board Integration | Medium | Real-time job listings from APIs |
| 🧪 A/B Testing | Low | Test different roadmap strategies |

---

## 👥 Team Contributions

| Member | Role | Responsibilities |
|--------|------|-----------------|
| **Member 1** | Research & Analysis | Market analysis, skill gap research, career data collection |
| **Member 2** | Backend Core | FastAPI setup, config, middleware, error handling, DI |
| **Member 3** | AI Agents | ResumeAgent, RoadmapAgent, LLM integration, prompt engineering |
| **Member 4** | Services & Data | ResourceService (18 skills), ReportService (12 sections), PDF export |
| **Member 5** | Roadmap, Resume Export & Docs | Career roadmaps, resume export pipeline, documentation, presentation |

---

## 📄 License

This project is part of an educational assignment. All rights reserved.

---

<p align="center">
  <strong>Career Guide AI</strong> — Built with ❤️ using FastAPI & AI
</p>
