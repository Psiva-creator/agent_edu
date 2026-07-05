from fastapi import APIRouter, Depends, status

from schemas.models import MentorQuestionRequest, MentorQuestionResponse
from agents.mentor_agent import MentorAgent
from utils.dependencies import get_mentor_agent

router = APIRouter(tags=["career"])


@router.post("/analyze")
async def analyze_career(data: dict):
    """Analyze career path based on user input."""
    # TODO: Integrate with MarketAgent and SkillGapAgent
    return {"message": "Career analysis endpoint", "data": data}


@router.post(
    "/mentor",
    response_model=MentorQuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask AI Mentor a question",
    description="Submit a question and optionally career context to get personalized advice.",
)
async def ask_mentor(
    data: MentorQuestionRequest,
    agent: MentorAgent = Depends(get_mentor_agent),
):
    res = await agent.answer_question(data.question, data.career_context)
    return res

