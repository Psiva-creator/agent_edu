"""
Prompt templates for AI agents.
Store all LLM prompts here for easy management and versioning.
Each prompt uses Python str.format() placeholders.
"""

# ═══════════════════════════════════════════════════════════════
# Market Analysis
# ═══════════════════════════════════════════════════════════════

MARKET_ANALYSIS_PROMPT = """\
You are an expert career market research analyst. Analyze the current job market
for the following industry/role: {industry}
Location: {location}

Provide a highly comprehensive and detailed analysis.

You MUST return your answer as a valid JSON object matching this schema.
Include as much detailed, accurate intelligence as possible.
If reliable data is completely unavailable for an optional field, return null or [].
Do NOT fabricate statistics. Explicitly label any estimates as "AI Estimates".

{{
  "trends": ["<industry trend 1>", "<industry trend 2>", ...],
  "future_opportunities": ["<opportunity 1>", ...],
  "demand_score": <float 0-100>,
  "growth_prediction": "<growth prediction description>",
  "emerging_technologies": ["<technology 1>", ...],
  "in_demand_skills": ["<skill 1>", ...],
  
  "market_health": "Growing|Stable|Declining",
  "salary_insights": {{
    "entry": <int>,
    "junior": <int>,
    "mid": <int>,
    "senior": <int>,
    "lead": <int>,
    "average": <int>,
    "highest": <int>,
    "top_10_percent": <int>,
    "currency": "<USD/INR/etc>",
    "growth_percent": <float>
  }},
  "hiring_demand": {{
    "hiring_velocity": "High|Medium|Low",
    "recruiter_activity": "High|Medium|Low",
    "growth_percent": <float>
  }},
  "top_companies": [
    {{"name": "<company>", "hiring_status": "Actively Hiring|Stable", "remote_percent": <int>, "tech_stack": ["<tech1>", ...]}}
  ],
  "skill_metrics": [
    {{"skill": "<skill>", "demand_percent": <int>, "salary_impact": "<impact>", "difficulty": "<difficulty>"}}
  ],
  "technology_trends": [
    {{"technology": "<tech>", "trend": "Up|Down|Stable", "growth_percent": <float>, "adoption": "<stage>"}}
  ],
  "location_insights": [
    {{"city": "<city>", "demand_score": <int>, "average_salary": <int>, "remote_percent": <int>}}
  ],
  "competition_metrics": {{
    "hiring_ratio": <float>,
    "interview_probability": <float>,
    "hiring_difficulty": "High|Medium|Low"
  }},
  "industry_timeline": [
    {{"timeframe": "Current|6 Months|1 Year|3 Years", "prediction": "<prediction>"}}
  ],
  "career_ladder": ["Student", "Intern", "Junior", "Mid", "Senior", "Lead", "Architect"],
  "learning_roi": [
    {{"skill": "<skill>", "learning_hours": <int>, "salary_increase": "<increase>", "roi_score": <int>}}
  ],
  "role_compatibility": [
    {{"role": "<role>", "compatibility_percent": <int>, "salary": <int>, "demand": "High|Medium|Low"}}
  ],
  "remote_outlook": {{
    "remote_percent": <int>,
    "hybrid_percent": <int>,
    "office_percent": <int>
  }},
  "recruiter_insights": {{
    "top_keywords": ["<keyword1>", ...],
    "average_hiring_time": "<time>"
  }},
  "recommendations": [
    {{"action": "<learn X>", "priority": "High|Medium|Low", "expected_gain": "<gain>", "time_estimate": "<time>"}}
  ],
  "executive_summary": {{
    "strengths": ["<strength1>", ...],
    "weaknesses": ["<weakness1>", ...],
    "future_outlook": "<outlook>",
    "best_next_step": "<step>",
    "opportunities": ["<opp1>", ...],
    "threats": ["<threat1>", ...],
    "best_cities": ["<city1>", ...],
    "learning_focus": "<focus>"
  }},
  
  "ai_career_gps": {{
    "current_position": "<string>",
    "destination": "<string>",
    "distance_remaining": "<string>",
    "estimated_time": "<string>",
    "confidence_percentage": <int>
  }},
  "opportunity_radar": [
    {{"category": "High|Medium|Emerging|Declining", "opportunity_name": "<string>"}}
  ],
  "future_simulator": [
    {{"action": "<string, e.g. Learn Kubernetes>", "expected_salary": <int>, "hiring_probability": <int>, "career_growth": "<string>"}}
  ],
  "investment_calculator": [
    {{"hours_invested": <int>, "salary_increase": <int>, "roi_percentage": <int>, "career_score_increase": <int>}}
  ],
  "decision_assistant": {{
    "career_a": "<string>",
    "career_b": "<string>",
    "comparison": [
      {{"metric": "Salary|Stress|Demand|Remote|Growth|Competition|Learning Curve", "winner": "Career A|Career B|Tie", "details": "<string>"}}
    ],
    "recommendation": "<string>"
  }},
  "market_pulse": "Healthy|Growing|Cooling|Hot",
  "career_weather": "Sunny|Cloudy|Storm|Booming",
  "opportunity_timeline": [
    {{"timeframe": "Today", "prediction": "<string>"}, {"timeframe": "6 Months", "prediction": "<string>"}, {"timeframe": "1 Year", "prediction": "<string>"}, {"timeframe": "3 Years", "prediction": "<string>"}, {"timeframe": "5 Years", "prediction": "<string>"}}
  ],
  "ai_risk_detector": [
    {{"risk_type": "High Competition|Skill Obsolete|Low Hiring|Automation Risk|Industry Slowdown", "description": "<string>", "severity": "High|Medium|Low"}}
  ],
  "hidden_opportunities": [
    {{"role": "<string>", "reason": "<string>", "match_score": <int>}}
  ],
  "recruiter_perspective": {{
    "perspective": "<first person narrative starting with 'If I were a recruiter...'>"
  }},
  "market_story": {{
    "narrative": "<A well-written narrative paragraph about the current state of the market>"
  }}
}}
"""

# ═══════════════════════════════════════════════════════════════
# Skill Gap Analysis
# ═══════════════════════════════════════════════════════════════

SKILL_GAP_PROMPT = """\
You are an expert career skills analyst. Perform a deep gap analysis comparing the candidate's
current skills with the industry expectations and requirements for their target role.

Current Skills: {current_skills}
Target Role: {target_role}

Identify:
1. Critical missing technical skill areas, tools, platforms, or methodologies.
2. Skills that need to be polished or improved to reach proficiency.
3. Recommended structured learning resources to bridge each gap.
"""

# ═══════════════════════════════════════════════════════════════
# Career Roadmap
# ═══════════════════════════════════════════════════════════════

ROADMAP_PROMPT = """\
You are a professional career development planner. Create a highly structured and detailed week-by-week career roadmap to guide a transition.

Current Role: {current_role}
Target Role: {target_role}
Skill Gaps to Address: {skill_gaps}
Hours Available Per Week: {hours_per_week}
Total Weeks: {deadline_weeks}

Generate a realistic, progressive learning path (fundamentals, core skills, advanced topics, portfolio projects, interview prep).
Tasks must be highly concrete and sum up to approximately {hours_per_week} hours per week.
Make sure resources include official documentation, high-quality open-source tutorials, or platform links (e.g., devdocs.io, docs.python.org, nextjs.org/docs).

For EACH week, generate a JSON object with this exact structure:
{{
  "week_number": <int>,
  "theme": "<week focus area>",
  "phase": "<Foundations|Core Skills|Advanced Topics|Portfolio & Interview Prep>",
  "learning_objectives": ["<objective 1>", "<objective 2>"],
  "tasks": [
    {{"title": "<task title>", "description": "<detailed actionable step>", "estimated_hours": <float>, "priority": "high|medium|low", "type": "learning|practice|review|project"}}
  ],
  "resources": [
    {{"title": "<official resource/course name>", "url": "<valid url>", "type": "docs|youtube|course|article", "skill": "<skill>"}}
  ],
  "practice": ["<exercise 1>", "<exercise 2>"],
  "mini_project": {{
    "title": "<project name>",
    "description": "<what to build>",
    "skills_used": ["<skill1>", "<skill2>"],
    "difficulty": "beginner|intermediate|advanced"
  }},
  "milestone": {{
    "title": "<milestone>",
    "description": "<what to achieve>",
    "deliverable": "<tangible output>",
    "week": <int>
  }},
  "estimated_hours": <float>
}}

Return a JSON array of all weeks. Focus on progressive skill building — fundamentals first, then advanced topics, then portfolio projects.
"""

# ═══════════════════════════════════════════════════════════════
# Resume Analysis
# ═══════════════════════════════════════════════════════════════

RESUME_ANALYSIS_PROMPT = """\
You are a professional resume reviewer and career advisor.
Analyze the following resume and provide deep, actionable feedback relative to the target role.

Resume Content:
{resume_text}

Target Role: {target_role}

Perform a detailed ATS and skill gap evaluation. Return a JSON object with these exact keys:
{{
  "extracted_skills": ["<skill1>", "<skill2>", ...],
  "missing_skills": ["<skill1>", "<skill2>", ...],
  "experience_years": <int>,
  "readiness_score": <float 0-100>,
  "readiness_label": "Beginner|Developing|Competent|Proficient|Expert",
  "career_path": [
    {{"role": "<role>", "match_percentage": <int>, "matching_skills": <int>, "total_required": <int>}}
  ],
  "strengths": ["<strength1>", ...],
  "improvements": ["<improvement1>", ...],
  "score": <float 0-100>,
  "summary": "<detailed summary of the resume analysis>",
  "ats_suggestions": ["<suggestion1>", ...],
  "ats_breakdown": {{
    "keywords": <int 0-100>,
    "projects": <int 0-100>,
    "achievements": <int 0-100>,
    "experience": <int 0-100>,
    "education": <int 0-100>,
    "grammar": <int 0-100>,
    "readability": <int 0-100>
  }},
  "recruiter_verdict": {{
    "verdict": "Would Shortlist|Needs Improvement|Excellent Candidate|Borderline",
    "interview_probability": <int 0-100>,
    "hiring_probability": <int 0-100>
  }},
  "ai_rewrites": [
    {{"original": "<weak bullet point>", "improved": "<strong quantified ATS-friendly bullet point>"}}
  ],
  "interview_questions": {{
    "easy": ["<q1>", "<q2>"],
    "medium": ["<q1>", "<q2>"],
    "hard": ["<q1>", "<q2>"]
  }},
  "section_checklist": {{
    "education": <bool>,
    "skills": <bool>,
    "experience": <bool>,
    "projects": <bool>,
    "achievements": <bool>,
    "certifications": <bool>,
    "github": <bool>,
    "linkedin": <bool>
  }}
}}

Evaluate:
1. Skills relevance to '{target_role}'
2. Missing critical skills for the target role
3. Career readiness percentage and detailed ATS category breakdown
4. Provide rewritten bullet points for weak sections
5. Generate AI interview questions based strictly on their provided experience
6. Provide a simulated recruiter verdict and probabilities
"""

# ═══════════════════════════════════════════════════════════════
# Resume Export
# ═══════════════════════════════════════════════════════════════

RESUME_EXPORT_PROMPT = """\
You are a professional resume writer. Generate a polished, well-structured resume
in Markdown format using the following information:

Name: {name}
Email: {email}
Phone: {phone}
Summary: {summary}
Skills: {skills}
Experience: {experience}
Education: {education}
Projects: {projects}
Certifications: {certifications}

Create a professional resume in clean Markdown format with proper sections,
action verbs, and quantified achievements.
"""

# ═══════════════════════════════════════════════════════════════
# Career Intelligence Report
# ═══════════════════════════════════════════════════════════════

CAREER_REPORT_PROMPT = """\
You are an expert career intelligence analyst. Generate a comprehensive career intelligence report for the following individual.

Name: {name}
Current Role: {current_role}
Target Role: {target_role}
Current Skills: {skills}
Experience: {experience_years} years
Education: {education}
Location: {location}

Synthesize all data to provide high-quality salary benchmarking, job matches, and professional mentor coaching.
Provide a JSON response with:
{{
  "readiness_score": <float 0-100>,
  "readiness_label": "Beginner|Developing|Competent|Proficient|Expert",
  "expected_salary": {{
    "currency": "INR",
    "min": <int>,
    "max": <int>,
    "median": <int>
  }},
  "skill_gaps": ["<gap1>", "<gap2>", ...],
  "roadmap_summary": "<brief 3-sentence roadmap summary>",
  "top_job_matches": [
    {{"title": "<job>", "company_type": "<type>", "match_score": <float>}}
  ],
  "mentor_advice": "<personalized career advice paragraph>",
  "next_steps": ["<step1>", "<step2>", ...]
}}
"""

# ═══════════════════════════════════════════════════════════════
# Mentor
# ═══════════════════════════════════════════════════════════════

MENTOR_PROMPT = """\
You are a seasoned career mentor. Provide thoughtful, personalized, and encouraging career advice
based on the user's question and background context.

User Question: {question}
User Context: {context}

Provide:
1. Direct answer to the question
2. Additional insights
3. Follow-up questions to explore
"""

# ═══════════════════════════════════════════════════════════════
# Resume Rewrite Studio
# ═══════════════════════════════════════════════════════════════

RESUME_REWRITE_PROMPT = """\
You are an expert resume writer and ATS optimization specialist.
Extract 3-5 of the weakest bullet points from the following resume text and rewrite them to be highly impactful, quantified, and ATS-friendly for a {target_role} role.

Resume Content:
{resume_text}

For each extracted bullet point, provide the original text, the AI improved version, and a detailed explanation of why you made the changes across 5 dimensions: Grammar, Impact, Action Verbs, ATS Keywords, and Clarity.

Return your response strictly as a JSON object matching this schema:
{{
  "rewrites": [
    {{
      "original": "<original bullet point from resume>",
      "improved": "<highly impactful rewritten bullet point>",
      "explanation": {{
        "grammar": "<how grammar or phrasing was improved>",
        "impact": "<how the impact was quantified or highlighted>",
        "action_verbs": "<action verbs that were introduced>",
        "ats_keywords": "<ATS keywords added for the target role>",
        "clarity": "<how clarity and readability were improved>"
      }}
    }}
  ]
}}
"""

# ═══════════════════════════════════════════════════════════════
# Cover Letter Generator
# ═══════════════════════════════════════════════════════════════

COVER_LETTER_PROMPT = """\
You are an expert career coach and executive resume writer.
Generate a highly personalized cover letter for the user. Do NOT use any hardcoded placeholders (e.g. [Hiring Manager], [Company Name]) if the information is not provided. Instead, write naturally around missing information (e.g., "To the Hiring Team,").

Tone: {tone}

User Context:
- Target Role: {target_role}
- Company Name: {company_name}
- Hiring Manager: {hiring_manager}
- Resume: {resume_text}
- Skills: {skills}
- Experience: {experience_years} years
- Projects: {projects}
- Job Description: {job_description}

Instructions:
1. Write a 3 to 4 paragraph cover letter.
2. The letter must match the requested tone ({tone}).
   - Formal: Traditional, highly professional, polite.
   - Startup: Energetic, passionate, impact-driven, modern.
   - Corporate: Results-oriented, leadership-focused, structured.
   - Friendly: Warm, personable, enthusiastic.
   - Executive: High-level strategy, confident, authoritative.
3. For each paragraph, provide an explanation of WHY this paragraph exists strategically (e.g., "Grabs attention and establishes alignment with the role", "Highlights quantifiable impact from past projects").

Return your response strictly as a JSON object matching this schema:
{{
  "paragraphs": [
    {{
      "text": "<The actual paragraph text>",
      "explanation": "<Strategic explanation of this paragraph>"
    }}
  ]
}}
"""
