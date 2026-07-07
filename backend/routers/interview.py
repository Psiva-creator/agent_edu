"""
Interview Router
================
REST endpoints for the AI Interview Simulator.
"""
from fastapi import APIRouter, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from agents.interview_agent import InterviewAgent
from services.llm_service import LLMService

router = APIRouter(tags=["Interview"])

_llm = LLMService()
_agent = InterviewAgent(llm_service=_llm)


class InterviewQuestionRequest(BaseModel):
    round_type: str = "technical"
    career_context: Dict[str, Any] = {}
    question_number: int = 1
    previous_questions: Optional[List[str]] = []


class InterviewEvaluateRequest(BaseModel):
    question: str
    candidate_answer: str
    expected_answer: str
    round_type: str = "technical"
    career_context: Dict[str, Any] = {}


class InterviewFinalScoreRequest(BaseModel):
    round_type: str = "technical"
    evaluations: List[Dict[str, Any]] = []
    career_context: Dict[str, Any] = {}


@router.post(
    "/interview/question",
    status_code=status.HTTP_200_OK,
    summary="Generate personalized interview question",
)
async def generate_question(data: InterviewQuestionRequest):
    """Generate an AI interview question personalized to the candidate's profile."""
    return await _agent.generate_question(
        round_type=data.round_type,
        career_context=data.career_context,
        question_number=data.question_number,
        previous_questions=data.previous_questions,
    )


@router.post(
    "/interview/evaluate",
    status_code=status.HTTP_200_OK,
    summary="Evaluate candidate's answer",
)
async def evaluate_answer(data: InterviewEvaluateRequest):
    """Evaluate a candidate's answer and return score, feedback, strengths, weaknesses, and improved answer."""
    return await _agent.evaluate_answer(
        question=data.question,
        candidate_answer=data.candidate_answer,
        expected_answer=data.expected_answer,
        round_type=data.round_type,
        career_context=data.career_context,
    )


@router.post(
    "/interview/final-score",
    status_code=status.HTTP_200_OK,
    summary="Generate final interview score",
)
async def final_score(data: InterviewFinalScoreRequest):
    """Compute aggregate final score, grade, and hiring recommendation from all round evaluations."""
    return await _agent.generate_final_score(
        round_type=data.round_type,
        evaluations=data.evaluations,
        career_context=data.career_context,
    )
