import asyncio
from agents.cover_letter_agent import CoverLetterAgent

async def test():
    agent = CoverLetterAgent()
    pdf = agent.generate_pdf("Test", ["Hello World"])
    print("PDF bytes:", len(pdf))
    docx = agent.generate_docx("Test", ["Hello World"])
    print("DOCX bytes:", len(docx))

asyncio.run(test())
