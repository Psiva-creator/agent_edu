"""
Market Research Agent
=====================
Analyzes current job market trends, demand for specific skills,
and industry growth patterns.

Features:
    - Custom market analysis for specific industries and locations
    - Structured reports containing trends, future opportunities,
      demand scores, growth predictions, emerging tech, and skills
    - OpenAI GPT-4 powered generation (when API key is available)
    - Local fallback database covering 12 common tech sectors
    - Dynamic generic fallback for non-tech and custom industries
"""

import logging
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from services.llm_service import LLMService
from prompts.templates import MARKET_ANALYSIS_PROMPT

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# Response Models for Validation and Documentation
# ═══════════════════════════════════════════════════════════════

class MarketAnalysisResponse(BaseModel):
    """Structured response for market trend analysis."""
    industry: str = Field(..., description="Target industry")
    location: Optional[str] = Field("Global", description="Geographic location of analysis")
    trends: List[str] = Field(default_factory=list, description="Top industry trends")
    future_opportunities: List[str] = Field(default_factory=list, description="Future growth areas and roles")
    demand_score: float = Field(..., ge=0.0, le=100.0, description="Overall demand score (0-100)")
    growth_prediction: str = Field(..., description="Description or rate of growth prediction")
    emerging_technologies: List[str] = Field(default_factory=list, description="Emerging technologies to watch")
    in_demand_skills: List[str] = Field(default_factory=list, description="Top in-demand skills in the sector")


# ═══════════════════════════════════════════════════════════════
# Predefined Knowledge Database for Fallback
# ═══════════════════════════════════════════════════════════════

PREDEFINED_KNOWLEDGE: Dict[str, Dict[str, Any]] = {
    "software_engineering": {
        "trends": [
            "AI-assisted software development (Copilots) is becoming industry standard.",
            "Shift towards cloud-native architectures and serverless computing.",
            "Increased focus on application security (DevSecOps) and data privacy.",
            "Rise of edge computing and decentralized application development."
        ],
        "future_opportunities": [
            "Integration of LLMs into enterprise product workflows.",
            "High demand for platform engineers to scale internal developer platforms.",
            "Green software engineering focusing on carbon-efficient coding.",
            "Opportunities in building privacy-preserving tech (Zero Knowledge proofs)."
        ],
        "demand_score": 92.0,
        "growth_prediction": "+12.5% YoY growth predicted over the next 5 years.",
        "emerging_technologies": [
            "GitHub Copilot & AI Code Agents",
            "WebAssembly (Wasm) on Server",
            "Serverless Containers",
            "Rust for systems programming"
        ],
        "in_demand_skills": [
            "Python",
            "TypeScript / JavaScript",
            "Docker / Kubernetes",
            "System Design",
            "Cloud Platforms (AWS/GCP/Azure)",
            "Git / CI-CD"
        ]
    },
    "frontend_development": {
        "trends": [
            "Server-side rendering (SSR) and hybrid framework consolidation.",
            "Component-driven design systems and headless UI adoption.",
            "Emphasis on web vitals, speed performance, and accessibility (a11y).",
            "Micro-frontend architectures for scaling large products."
        ],
        "future_opportunities": [
            "Interactive 3D web experiences (Three.js / WebGL).",
            "Design system engineers bridging the gap between design and development.",
            "Mobile-web unified applications using progressive framework architectures.",
            "Voice and conversational UI integration."
        ],
        "demand_score": 87.0,
        "growth_prediction": "+10.2% YoY growth expected as user experience becomes key.",
        "emerging_technologies": [
            "Next.js / Remix",
            "Tailwind CSS v4",
            "WebGPU / WebGL",
            "Vite & Turbopack bundlers"
        ],
        "in_demand_skills": [
            "React / Vue / Svelte",
            "TypeScript / JavaScript",
            "CSS Grid & Flexbox",
            "State Management (Redux/Zustand)",
            "Testing (Jest/Cypress/Playwright)",
            "UI/UX Best Practices"
        ]
    },
    "backend_development": {
        "trends": [
            "Microservices scaling and transition to serverless backends.",
            "Increased usage of event-driven architectures (Pub/Sub).",
            "Consolidation of relational and NoSQL databases in modern tech stacks.",
            "API-first design principles (REST, GraphQL, gRPC)."
        ],
        "future_opportunities": [
            "Developing real-time streaming engines and low-latency APIs.",
            "Building high-volume distributed system pipelines.",
            "Transition to high-performance languages like Go and Rust.",
            "Designing scalable distributed storage layers."
        ],
        "demand_score": 91.0,
        "growth_prediction": "+14.0% YoY growth, driven by enterprise API integration.",
        "emerging_technologies": [
            "FastAPI and Go-based backends",
            "Distributed SQL (CockroachDB, YugabyteDB)",
            "gRPC & WebSockets",
            "Redis Stack & Edge Caching"
        ],
        "in_demand_skills": [
            "Python / Go / Java",
            "SQL & NoSQL Databases",
            "REST API / GraphQL Design",
            "Docker & Containerization",
            "System Design & Architecture",
            "Message Brokers (Kafka/RabbitMQ)"
        ]
    },
    "full_stack_development": {
        "trends": [
            "Full-stack frameworks (Next.js, Nuxt, SvelteKit) handling both UI and backend.",
            "Serverless hosting architectures (Vercel, Netlify, Supabase) simplifying deploys.",
            "AI generation of boilerplate code across front and backend.",
            "Consolidation of single-language developer profiles (TypeScript/Python)."
        ],
        "future_opportunities": [
            "Rapid prototyping and MVP development for early-stage startups.",
            "Transition into engineering manager or technical product lead.",
            "Building specialized web-based AI dashboard applications.",
            "Integrating custom payment and third-party SaaS pipelines."
        ],
        "demand_score": 93.0,
        "growth_prediction": "+15.2% YoY growth, favored for operational flexibility.",
        "emerging_technologies": [
            "Server Actions & Edge Functions",
            "Supabase / Supabase CLI",
            "TRPC & Prisma ORMs",
            "Next.js / Astro"
        ],
        "in_demand_skills": [
            "JavaScript / TypeScript",
            "React & Node.js",
            "SQL & ORMs (Prisma/Drizzle)",
            "REST APIs & Authentication",
            "Docker & Basic DevOps",
            "Git & Deployment Automation"
        ]
    },
    "data_science": {
        "trends": [
            "Shift towards MLOps and production-ready data pipelines.",
            "Adoption of Automated Machine Learning (AutoML) tools.",
            "Widespread integration of LLMs for data cleaning and generation.",
            "Focus on explainable AI and algorithmic bias detection."
        ],
        "future_opportunities": [
            "Ethical AI auditor and compliance consulting.",
            "Advanced forecasting model development in financial technology.",
            "Building custom search and recommendation systems.",
            "Healthcare analytics leveraging medical vision/nlp models."
        ],
        "demand_score": 88.0,
        "growth_prediction": "+16.8% YoY growth, driven by big data monetization.",
        "emerging_technologies": [
            "Vector databases",
            "LLMs for analysis (OpenAI Code Interpreter)",
            "LlamaIndex & LangChain",
            "DuckDB for analytical querying"
        ],
        "in_demand_skills": [
            "Python / R",
            "SQL & Data Wrangling",
            "Machine Learning Algorithms",
            "Statistics & Hypothesis Testing",
            "Pandas / NumPy / Scikit-learn",
            "Data Visualization (Tableau/PowerBI)"
        ]
    },
    "ml_engineering": {
        "trends": [
            "Fine-tuning and deploying open-source models (Llama, Mistral).",
            "Standardization of AI deployment using specialized hardware architectures.",
            "Focus on reducing latency and compute cost for model inference.",
            "Convergence of software engineering best practices with AI modeling."
        ],
        "future_opportunities": [
            "Developing autonomous agent networks and multi-agent systems.",
            "Edge ML engineering deploying models on client devices/IoT.",
            "Creating customized Retrieval-Augmented Generation (RAG) applications.",
            "ML security and adversarial prompt-defense systems."
        ],
        "demand_score": 95.0,
        "growth_prediction": "+22.5% YoY growth, the fastest-growing technology segment.",
        "emerging_technologies": [
            "vLLM & HuggingFace TGI",
            "PyTorch 2.0 / JAX",
            "MLflow / Weights & Biases",
            "TensorRT inference engines"
        ],
        "in_demand_skills": [
            "Python",
            "PyTorch / TensorFlow",
            "MLOps (Docker, Kubernetes, Kubeflow)",
            "Cloud ML Services (AWS SageMaker)",
            "Linear Algebra & Calculus",
            "CUDA & Hardware Optimization"
        ]
    },
    "devops_engineering": {
        "trends": [
            "GitOps as the dominant deployment workflow strategy.",
            "Shift toward Platform Engineering and developer self-service portals.",
            "DevSecOps integrating security directly into build pipelines.",
            "FinOps: optimizing cloud spending via automated resource management."
        ],
        "future_opportunities": [
            "Building highly resilient multi-cloud strategies.",
            "Creating automated recovery and self-healing infrastructure.",
            "Platform Engineering to improve internal developer workflows.",
            "Specialized kubernetes operator development."
        ],
        "demand_score": 90.0,
        "growth_prediction": "+13.8% YoY growth, driven by cloud-native scaling.",
        "emerging_technologies": [
            "Terraform / OpenTofu / Pulumi",
            "Kubernetes / ArgoCD",
            "Backstage (Platform Engineering)",
            "eBPF for network observability"
        ],
        "in_demand_skills": [
            "Docker / Containerization",
            "Kubernetes Administration",
            "Infrastructure as Code (IaC)",
            "Linux System Administration",
            "CI/CD Tools (GitHub Actions/Jenkins)",
            "Cloud Architecture (AWS/GCP/Azure)"
        ]
    },
    "cloud_architecture": {
        "trends": [
            "Multi-cloud architectures to avoid single-vendor lock-in.",
            "Shift toward serverless databases and edge computing.",
            "Zero Trust networking models across internal servers.",
            "AI-driven automated cloud cost and performance scaling."
        ],
        "future_opportunities": [
            "Enterprise hybrid-cloud migration consulting.",
            "Disaster recovery and business continuity architect.",
            "Designing data mesh infrastructure in cloud environments.",
            "Cost optimization analyst roles."
        ],
        "demand_score": 89.0,
        "growth_prediction": "+11.5% YoY growth as enterprise migrations continue.",
        "emerging_technologies": [
            "Serverless relational databases",
            "Cloud Native Buildpacks",
            "AWS Lambda @ Edge",
            "Zero Trust network access (ZTNA)"
        ],
        "in_demand_skills": [
            "AWS / GCP / Azure administration",
            "Terraform / IaC",
            "Enterprise Networking & VPCs",
            "IAM / Cloud Security Policies",
            "Docker / Kubernetes",
            "Cost Management & Optimizations"
        ]
    },
    "product_management": {
        "trends": [
            "Data-driven product strategy and product-led growth (PLG).",
            "Increased usage of AI-based tools for market research and PRDs.",
            "Focus on outcome metrics (KPIs/OKRs) rather than output metrics.",
            "Growth of specialized technical PM roles (AI PM, Platform PM)."
        ],
        "future_opportunities": [
            "Managing complex AI and machine learning products.",
            "Directing product-led growth strategies for global startups.",
            "Spearheading enterprise developer platform tools.",
            "Data privacy and compliance product ownership."
        ],
        "demand_score": 84.0,
        "growth_prediction": "+8.5% YoY growth, with premium on specialized technical PMs.",
        "emerging_technologies": [
            "AI product analytics tools",
            "Jira Product Discovery",
            "Linear / Notion",
            "A/B testing software (Optimizely, LaunchDarkly)"
        ],
        "in_demand_skills": [
            "Agile & Scrum Methodologies",
            "Product Analytics (Mixpanel/Amplitude)",
            "User Research & Testing",
            "Roadmapping & Prioritization",
            "Basic SQL & Data Analysis",
            "Effective Stakeholder Communication"
        ]
    },
    "mobile_development": {
        "trends": [
            "Cross-platform frameworks (React Native, Flutter) dominating new apps.",
            "Declining build-sizes and optimized mobile asset delivery.",
            "Mobile-first commerce and integration with digital wallets.",
            "Integrating local AI models on-device (CoreML, TensorFlow Lite)."
        ],
        "future_opportunities": [
            "Developing mobile-optimized AI agent interfaces.",
            "Building immersive AR/VR applications (VisionOS).",
            "IoT mobile controller interface design.",
            "Wearable tech integration (smartwatches, health sensors)."
        ],
        "demand_score": 86.0,
        "growth_prediction": "+9.0% YoY growth, driven by mobile-first business models.",
        "emerging_technologies": [
            "Flutter 3 / React Native Architecture",
            "VisionOS / ARKit",
            "Kotlin Multiplatform (KMP)",
            "On-device LLMs"
        ],
        "in_demand_skills": [
            "React Native / Flutter",
            "Swift / Kotlin",
            "REST APIs & WebSocket integration",
            "State Management (Redux/Bloc)",
            "App Store & Google Play publishing",
            "Mobile UI/UX best practices"
        ]
    },
    "cybersecurity": {
        "trends": [
            "AI-driven automated threat detection and response.",
            "Shift to Zero Trust architecture as standard practice.",
            "Growth in ransomware-as-a-service and state-sponsored threats.",
            "Securing supply chains and software bills of materials (SBOMs)."
        ],
        "future_opportunities": [
            "AI security and prompt injection protection.",
            "Decentralized identity management architectures.",
            "Critical infrastructure security (energy grids, IoT pipelines).",
            "Data privacy regulation officer."
        ],
        "demand_score": 94.0,
        "growth_prediction": "+18.0% YoY growth, driven by growing security compliance.",
        "emerging_technologies": [
            "Zero Trust Network Access (ZTNA)",
            "Security Information & Event Management (SIEM)",
            "AI security tools",
            "Quantum-resistant cryptography"
        ],
        "in_demand_skills": [
            "Network Protocols & Architecture",
            "Linux System Administration",
            "Penetration Testing / Ethical Hacking",
            "SIEM & Incident Response Tools",
            "Python / Shell scripting",
            "Security Compliance Standards (ISO, SOC2)"
        ]
    },
    "qa_engineering": {
        "trends": [
            "Transition to test automation using AI test generators.",
            "Shift-left testing: developers and QA writing tests early in cycles.",
            "Continuous testing integrated into automated CI/CD pipelines.",
            "Performance and security testing becoming core QA roles."
        ],
        "future_opportunities": [
            "Designing large-scale automated test frameworks.",
            "Load testing complex cloud applications under surge scenarios.",
            "Transition to software development engineer in test (SDET).",
            "Mobile-device farm test execution coordination."
        ],
        "demand_score": 83.0,
        "growth_prediction": "+7.5% YoY growth, with high demand for automation specialists.",
        "emerging_technologies": [
            "Playwright / Cypress testing engines",
            "AI-powered visual testing (Applitools)",
            "K6 load testing",
            "CI/CD runner integrations"
        ],
        "in_demand_skills": [
            "Test Automation Frameworks (Selenium/Playwright)",
            "Programming (Python / JavaScript / Java)",
            "Git & version control",
            "API Testing Tools (Postman/Insomnia)",
            "Basic SQL for data validation",
            "Agile testing methodologies"
        ]
    },
    "generic": {
        "trends": [
            "Digital transformation and integration of software tools in {industry} operations.",
            "Rising reliance on data analytics and data-driven decision making.",
            "Increased focus on remote collaboration tools and hybrid workflows.",
            "Adoption of automation to replace repetitive manual workflows."
        ],
        "future_opportunities": [
            "Roles focusing on integrating automation and smart tools within {industry}.",
            "Consulting opportunities for digital transformation projects.",
            "Specialized software solutions development catering to {industry}.",
            "Transitioning to tech-driven product manager or analyst roles in {industry}."
        ],
        "demand_score": 75.0,
        "growth_prediction": "+7.0% to +10.0% growth expected over the next decade.",
        "emerging_technologies": [
            "Automation tools and RPA",
            "Low-code/No-code platforms",
            "Enterprise analytics software",
            "Cloud-based collaboration platforms"
        ],
        "in_demand_skills": [
            "Data Analysis",
            "Digital Literacy",
            "Project Management",
            "Problem Solving",
            "Agile Collaboration",
            "Automation Tooling"
        ]
    }
}


# ═══════════════════════════════════════════════════════════════
# MarketAgent Class
# ═══════════════════════════════════════════════════════════════

class MarketAgent:
    """Agent responsible for market trend analysis and industry insights."""

    def __init__(
        self,
        llm_service: Optional[LLMService] = None,
    ):
        """
        Initialize the MarketAgent.

        Args:
            llm_service: Injected LLM service (or creates its own).
        """
        self.llm = llm_service or LLMService()

    # ═══════════════════════════════════════════════════════════
    # PUBLIC API
    # ═══════════════════════════════════════════════════════════

    async def analyze_market(self, industry: str, location: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze market trends for a given industry and location.

        Args:
            industry: The industry sector to analyze (e.g., 'data science', 'software engineering').
            location: Optional geographic location of the analysis (e.g., 'United States', 'India').

        Returns:
            Structured JSON dict matching MarketAnalysisResponse schema.
        """
        if not industry or not industry.strip():
            industry = "Software Engineering"

        location_display = location.strip() if location and location.strip() else "Global"
        logger.info(f"MarketAgent beginning market analysis for '{industry}' in '{location_display}'")

        # ── 1. Try LLM-based analysis first ───────────────────
        if self.llm.is_available:
            try:
                result = await self._analyze_with_llm(industry, location_display)
                if result and result.get("trends"):
                    logger.info("Market analysis successfully generated via LLM.")
                    return result
            except Exception as e:
                logger.warning(f"LLM market analysis failed: {e}. Falling back to predefined knowledge.")

        # ── 2. Run deterministic fallback ────────────────────
        logger.info("Performing fallback market analysis using predefined knowledge database.")
        return self._analyze_fallback(industry, location_display)

    # ═══════════════════════════════════════════════════════════
    # LLM Market Analysis
    # ═══════════════════════════════════════════════════════════

    async def _analyze_with_llm(self, industry: str, location: str) -> Dict[str, Any]:
        """Query the LLM to get structured market intelligence."""
        base_prompt = MARKET_ANALYSIS_PROMPT.format(industry=industry, location=location)
        prompt = f"""\
{base_prompt}

You MUST return your answer as a valid JSON object matching this schema:
{{
  "trends": ["<industry trend 1>", "<industry trend 2>", ...],
  "future_opportunities": ["<opportunity 1>", "<opportunity 2>", ...],
  "demand_score": <float between 0.0 and 100.0>,
  "growth_prediction": "<growth prediction description or rate, e.g., +15.5% YoY growth over the next 5 years>",
  "emerging_technologies": ["<technology 1>", "<technology 2>", ...],
  "in_demand_skills": ["<skill 1>", "<skill 2>", ...]
}}

Ensure all JSON keys and formats match exactly. Keep explanations and text concise.
"""
        system_message = (
            "You are a career market research analyst. Return ONLY a valid JSON object matching the requested schema. "
            "Do not include any wrapper text, explanations, or markdown code blocks outside the JSON."
        )

        data = await self.llm.generate_json(prompt, system_message=system_message)

        if not data or not isinstance(data, dict):
            return {}

        # Validate and return cleaned data
        return {
            "industry": industry,
            "location": location,
            "trends": [str(x) for x in data.get("trends", [])],
            "future_opportunities": [str(x) for x in data.get("future_opportunities", [])],
            "demand_score": float(data.get("demand_score", 80.0)),
            "growth_prediction": str(data.get("growth_prediction", "Steady growth predicted")),
            "emerging_technologies": [str(x) for x in data.get("emerging_technologies", [])],
            "in_demand_skills": [str(x) for x in data.get("in_demand_skills", [])],
        }

    # ═══════════════════════════════════════════════════════════
    # Predefined Fallback Logic
    # ═══════════════════════════════════════════════════════════

    def _analyze_fallback(self, industry: str, location: str) -> Dict[str, Any]:
        """Perform fallback market analysis by matching the industry with predefined sectors."""
        normalized_industry = self._normalize_industry_key(industry)
        
        # Look up database or fallback to generic template
        if normalized_industry in PREDEFINED_KNOWLEDGE and normalized_industry != "generic":
            logger.debug(f"Predefined knowledge match found for normalized key: '{normalized_industry}'")
            raw_data = PREDEFINED_KNOWLEDGE[normalized_industry]
            
            # Create a copy so we do not mutate original dict
            data = {
                "trends": list(raw_data["trends"]),
                "future_opportunities": list(raw_data["future_opportunities"]),
                "demand_score": raw_data["demand_score"],
                "growth_prediction": raw_data["growth_prediction"],
                "emerging_technologies": list(raw_data["emerging_technologies"]),
                "in_demand_skills": list(raw_data["in_demand_skills"])
            }
        else:
            logger.debug(f"No predefined key matched '{normalized_industry}'. Formatting generic template.")
            generic_raw = PREDEFINED_KNOWLEDGE["generic"]
            
            # Format generic template dynamically using the industry name
            data = {
                "trends": [s.format(industry=industry) for s in generic_raw["trends"]],
                "future_opportunities": [s.format(industry=industry) for s in generic_raw["future_opportunities"]],
                "demand_score": generic_raw["demand_score"],
                "growth_prediction": generic_raw["growth_prediction"].format(industry=industry),
                "emerging_technologies": list(generic_raw["emerging_technologies"]),
                "in_demand_skills": list(generic_raw["in_demand_skills"])
            }

        # Localize trends and opportunities slightly if a location is specified
        if location and location.lower() != "global":
            data["trends"].insert(0, f"Increasing local tech investment and resource allocation in {location}.")
            data["future_opportunities"].insert(0, f"Expanding job opportunities within local hubs in {location}.")

        return {
            "industry": industry,
            "location": location,
            "trends": data["trends"][:6],
            "future_opportunities": data["future_opportunities"][:6],
            "demand_score": data["demand_score"],
            "growth_prediction": data["growth_prediction"],
            "emerging_technologies": data["emerging_technologies"][:6],
            "in_demand_skills": data["in_demand_skills"][:8]
        }

    # ═══════════════════════════════════════════════════════════
    # Industry Normalization Helper
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _normalize_industry_key(industry: str) -> str:
        """Map raw user industry input to the closest predefined database key."""
        raw = industry.lower().strip()
        
        # Exact/Partial substring check mapping
        if "data science" in raw or "data scientist" in raw or "analytics" in raw:
            return "data_science"
        elif "ml" in raw or "machine learning" in raw or "artificial intelligence" in raw or "ai" in raw:
            return "ml_engineering"
        elif "devops" in raw or "site reliability" in raw or "sre" in raw:
            return "devops_engineering"
        elif "frontend" in raw or "front-end" in raw or "web design" in raw:
            return "frontend_development"
        elif "backend" in raw or "back-end" in raw:
            return "backend_development"
        elif "full stack" in raw or "fullstack" in raw or "web development" in raw:
            return "full_stack_development"
        elif "cloud" in raw or "cloud architecture" in raw or "aws" in raw or "gcp" in raw or "azure" in raw:
            return "cloud_architecture"
        elif "product" in raw or "product management" in raw or "product manager" in raw:
            return "product_management"
        elif "mobile" in raw or "android" in raw or "ios" in raw or "flutter" in raw or "react native" in raw:
            return "mobile_development"
        elif "cyber" in raw or "security" in raw or "cybersecurity" in raw or "infosec" in raw:
            return "cybersecurity"
        elif "qa" in raw or "testing" in raw or "quality assurance" in raw or "automation" in raw:
            return "qa_engineering"
        elif "software" in raw or "developer" in raw or "programmer" in raw or "coding" in raw:
            return "software_engineering"
            
        return "generic"
