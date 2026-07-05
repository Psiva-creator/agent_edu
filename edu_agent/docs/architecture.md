# 🏗️ Architecture — Career Guide AI

> Detailed architectural documentation for the multi-agent career intelligence platform.

---

## System Architecture Overview

Career Guide AI uses a **layered, modular architecture** with clear separation of concerns. Each layer communicates through well-defined interfaces using FastAPI's dependency injection system.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│           (Browser / Postman / Frontend App / curl)             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (REST JSON)
┌────────────────────────────▼────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     FastAPI App (app.py)                   │  │
│  │  • Lifespan events (startup/shutdown)                     │  │
│  │  • CORS middleware                                        │  │
│  │  • Global exception handlers                              │  │
│  │  • API versioning (/api/v1)                               │  │
│  │  • Swagger/OpenAPI auto-docs (/docs)                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API Routers                             │  │
│  │                                                           │  │
│  │  resume.py    → POST /resume/analyze                      │  │
│  │               → POST /resume/export/{format}              │  │
│  │                                                           │  │
│  │  roadmap.py   → POST /roadmap                             │  │
│  │                                                           │  │
│  │  resources.py → GET  /resources                           │  │
│  │               → GET  /resources/{skill}                   │  │
│  │                                                           │  │
│  │  report.py    → POST /report                              │  │
│  │               → GET  /report/html                         │  │
│  │               → GET  /report/pdf                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Dependency Injection
┌────────────────────────────▼────────────────────────────────────┐
│                      AGENT LAYER                                │
│                                                                 │
│  ┌────────────────────┐     ┌─────────────────────┐            │
│  │    ResumeAgent      │     │   RoadmapAgent       │            │
│  │                    │     │                     │            │
│  │ • Skill extraction │     │ • 4-phase roadmap   │            │
│  │ • Gap analysis     │     │ • Week generation   │            │
│  │ • Readiness score  │     │ • Resource mapping  │            │
│  │ • Career matching  │     │ • Milestone setting │            │
│  │ • ATS suggestions  │     │ • LLM + fallback    │            │
│  │ • MD/HTML/PDF      │     │                     │            │
│  └────────┬───────────┘     └──────────┬──────────┘            │
│           │                            │                        │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
┌───────────▼────────────────────────────▼────────────────────────┐
│                     SERVICE LAYER                                │
│                                                                 │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│  │   LLMService     │ │ ResourceService   │ │  ReportService   │ │
│  │                 │ │                  │ │                  │ │
│  │ • OpenAI client │ │ • Load JSON      │ │ • 12 sections    │ │
│  │ • Retry logic   │ │ • Fuzzy search   │ │ • Readiness calc │ │
│  │ • LRU cache     │ │ • Recommend      │ │ • Salary data    │ │
│  │ • JSON parser   │ │ • Fallback       │ │ • HTML/PDF       │ │
│  │ • Typed output  │ │ • Stats          │ │ • LLM + fallback │ │
│  └─────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                 │
└───────────┬───────────────────┬───────────────────┬─────────────┘
            │                   │                   │
┌───────────▼───────────────────▼───────────────────▼─────────────┐
│                    DATA / CONFIG LAYER                           │
│                                                                 │
│  config.py         │ Pydantic Settings from .env                │
│  schemas/models.py │ All Pydantic request/response models       │
│  prompts/templates │ LLM prompt templates                       │
│  data/resources.json│ Curated resource library (18 skills)      │
│  templates/*.html  │ Jinja2 templates for PDF/HTML export       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Agents

Agents encapsulate **domain-specific AI logic**. Each agent supports dual-mode operation:

| Agent | LLM Mode | Fallback Mode |
|-------|----------|---------------|
| **ResumeAgent** | GPT-4 analyzes resume text | Regex skill extraction + heuristic scoring |
| **RoadmapAgent** | GPT-4 generates week plans | Template-based 4-phase roadmap builder |

**Agent Design Principles:**
- Each agent receives `LLMService` via constructor injection
- Agents are **stateless** — new instance per request
- All agents **must** provide a fallback path
- Agents return plain dicts (serialized by routers)

### 2. Services

Services manage **shared business logic** and are **singletons** (one instance shared across requests):

| Service | Responsibility |
|---------|---------------|
| **LLMService** | OpenAI client with retry, caching, JSON parsing, typed responses |
| **ResourceService** | Loads, searches, and recommends from `resources.json` |
| **ReportService** | Generates 12-section career reports with HTML/PDF export |

### 3. Dependency Injection

All services and agents are injected via `utils/dependencies.py`:

```python
# Services — singletons (shared across requests)
def get_llm() -> LLMService
def get_resources() -> ResourceService
def get_report() -> ReportService

# Agents — new instance per request
def get_resume_agent() -> ResumeAgent
def get_roadmap_agent() -> RoadmapAgent
```

### 4. Export Pipeline

```
Resume Data ──▶ Markdown ──▶ HTML (Jinja2) ──▶ PDF (xhtml2pdf)
                  │              │                  │
                  ▼              ▼                  ▼
             /export/md     /export/html       /export/pdf
```

---

## Multi-Agent Data Flow

```
                    ┌──────────────┐
                    │   User Input  │
                    │  (Resume +   │
                    │  Target Role) │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │      ResumeAgent        │
              │                        │
              │  1. Extract skills     │
              │  2. Calculate score    │
              │  3. Find gaps          │
              │  4. Match career paths │
              │  5. ATS suggestions    │
              └────────────┬───────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐
    │ResourceService│ │RoadmapAgent│ │ReportService │
    │              │ │          │ │             │
    │ • Get docs   │ │ • Phase 1│ │ • Summary   │
    │ • Courses    │ │ • Phase 2│ │ • Score     │
    │ • YouTube    │ │ • Phase 3│ │ • Salary    │
    │ • Projects   │ │ • Phase 4│ │ • Companies │
    └──────────────┘ └──────────┘ └─────────────┘
            │              │              │
            ▼              ▼              ▼
       Resources       Roadmap        Report
       (18 skills)   (10 weeks)    (12 sections)
```

---

## LLM Service Architecture

```
┌──────────────────────────────────────────────┐
│                 LLMService                    │
│                                              │
│  ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ LRU Cache │    │  Retry   │    │ JSON   │ │
│  │ (SHA-256) │    │  Engine  │    │ Parser │ │
│  │           │    │          │    │        │ │
│  │ 128 slots │    │ 3 retry  │    │ 4 strat│ │
│  │ Cache hit │    │ Exp back │    │ Direct │ │
│  │ → skip API│    │ 1→2→4→8s│    │ MD blk │ │
│  └──────────┘    │ Rate lim │    │ Fence  │ │
│                  │ Timeout  │    │ Bound  │ │
│                  │ 5xx err  │    └────────┘ │
│                  └──────────┘               │
│                                              │
│  generate() → LLMResponse (typed)            │
│  generate_json() → dict | list               │
│  generate_typed() → Pydantic model           │
│  generate_from_template() → LLMResponse      │
└──────────────────────────────────────────────┘
```

---

## Readiness Score Algorithm

The readiness score (0–100) uses a **5-factor weighted formula**:

| Factor | Weight | Measurement |
|--------|--------|-------------|
| Skill Match | 40% | Extracted skills vs. target role requirements |
| Skill Breadth | 15% | Total number of skills (capped at 10) |
| Experience | 20% | Years of experience (capped at 5) |
| Action Verbs | 10% | Achievement-oriented language usage |
| Structure | 15% | Presence of key resume sections |

```
Score = (skill_match × 40) + (breadth × 15) + (experience × 20) +
        (action_verbs × 10) + (structure × 15)
```

---

## Error Handling Strategy

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Custom     │     │  Global Handler   │     │   Response   │
│  AppException │────▶│  (app.py)         │────▶│  JSON Error  │
│  (with code) │     │                  │     │  {error, code}│
└──────────────┘     └──────────────────┘     └──────────────┘

│ 400 │ Bad Request   — Invalid input
│ 404 │ Not Found     — Resource/skill not found
│ 422 │ Validation    — Pydantic model validation failure
│ 500 │ Server Error  — Unhandled exceptions
```

---

## Security Considerations

| Aspect | Implementation |
|--------|---------------|
| **CORS** | Configurable allowed origins via env var |
| **Input Validation** | All inputs validated via Pydantic models |
| **API Keys** | Stored in `.env`, never committed to Git |
| **Rate Limiting** | OpenAI retry handles 429 responses |
| **File Uploads** | Size limited via `MAX_UPLOAD_SIZE_MB` |
| **Error Masking** | Internal errors return generic 500 message |
