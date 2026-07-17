import asyncio
from agents.cover_letter_agent import CoverLetterAgent

async def test():
    agent = CoverLetterAgent()
    data = {
        "target_role": "Senior Frontend Developer",
        "skills": ["React", "JavaScript", "CSS"],
        "experience_years": 5,
        "company_name": "Google",
        "hiring_manager": "Sundar Pichai",
        "tone": "Formal"
    }
    # Force fallback
    result = agent._generate_fallback(data)
    print("Fallback Result:")
    for p in result["paragraphs"]:
        print("-", p["text"])

asyncio.run(test())
