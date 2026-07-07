"""
Interview Agent
===============
AI-powered interview simulator that generates personalized questions
based on career context (resume, projects, role, experience, market),
evaluates candidate answers, and produces final interview scores.

Round Types:
    - HR: Culture fit, motivation, salary expectations, work style
    - Technical: Stack-specific algorithms, system concepts, debugging
    - Behavioral: STAR-format situational questions from project history
    - System Design: Architecture, scalability, trade-offs for role level
    - Coding: Algorithm problems relevant to candidate's tech stack
"""

import logging
from typing import Optional, List, Dict, Any

from services.llm_service import LLMService

logger = logging.getLogger(__name__)

ROUND_CONFIGS = {
    "hr": {
        "label": "HR Round",
        "focus": "culture fit, motivation, work style, career goals, and salary expectations",
        "time_limit": 120,
        "difficulty_range": "Easy to Medium",
    },
    "technical": {
        "label": "Technical Round",
        "focus": "data structures, algorithms, debugging, system concepts, and tech-stack specific knowledge",
        "time_limit": 180,
        "difficulty_range": "Medium to Hard",
    },
    "behavioral": {
        "label": "Behavioral Round",
        "focus": "past experiences using STAR format (Situation, Task, Action, Result), teamwork, conflict resolution",
        "time_limit": 120,
        "difficulty_range": "Easy to Medium",
    },
    "system_design": {
        "label": "System Design Round",
        "focus": "designing scalable systems, architecture trade-offs, database design, API design, and capacity planning",
        "time_limit": 300,
        "difficulty_range": "Hard",
    },
    "coding": {
        "label": "Coding Round",
        "focus": "algorithm problems, time/space complexity analysis, and code logic relevant to the candidate's stack",
        "time_limit": 240,
        "difficulty_range": "Medium to Hard",
    },
}


class InterviewAgent:
    """AI agent for generating and evaluating interview questions."""

    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm = llm_service or LLMService()

    # ─── Question Generation ──────────────────────────────────────

    async def generate_question(
        self,
        round_type: str,
        career_context: Dict[str, Any],
        question_number: int = 1,
        previous_questions: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a personalized interview question based on candidate context.

        Returns:
            dict with keys: question, difficulty, hints (list of 3), expected_answer, time_limit_seconds
        """
        round_type = round_type.lower().replace(" ", "_")
        config = ROUND_CONFIGS.get(round_type, ROUND_CONFIGS["technical"])
        prev_qs = previous_questions or []

        # Build context string
        ctx = self._build_context_str(career_context)
        prev_str = "\n".join(f"- {q}" for q in prev_qs) if prev_qs else "None yet"

        prompt = f"""You are a senior interviewer at a top tech company conducting a {config['label']}.

Candidate Profile:
{ctx}

Round Focus: {config['focus']}
Question Number: {question_number} of 5
Previous questions asked (DO NOT repeat these):
{prev_str}

Generate ONE unique, specific, and challenging interview question for this candidate.
The question MUST be personalized to their background, tech stack, projects, and target role.
Do NOT use generic textbook questions.

Return ONLY this exact JSON (no markdown wraps):
{{
  "question": "<the interview question, written naturally as a real interviewer would ask>",
  "difficulty": "<Easy|Medium|Hard>",
  "hints": [
    "<hint 1 — a subtle nudge, not the answer>",
    "<hint 2 — a bit more specific>",
    "<hint 3 — the most explicit hint, still not the full answer>"
  ],
  "expected_answer": "<a comprehensive model answer a strong candidate would give, 2-4 paragraphs>",
  "time_limit_seconds": {config['time_limit']}
}}"""

        system_msg = (
            f"You are an expert {config['label']} interviewer. "
            "Generate highly personalized, context-aware interview questions. "
            "Return ONLY valid JSON. No markdown."
        )

        if self.llm.is_available:
            try:
                data = await self.llm.generate_json(prompt, system_message=system_msg)
                if isinstance(data, dict) and "question" in data:
                    return {
                        "question": str(data.get("question", "")),
                        "difficulty": str(data.get("difficulty", "Medium")),
                        "hints": [str(h) for h in data.get("hints", [])],
                        "expected_answer": str(data.get("expected_answer", "")),
                        "time_limit_seconds": int(data.get("time_limit_seconds", config["time_limit"])),
                    }
            except Exception as e:
                logger.warning(f"Interview question generation failed: {e}")

        return self._fallback_question(round_type, career_context, config)

    # ─── Answer Evaluation ────────────────────────────────────────

    async def evaluate_answer(
        self,
        question: str,
        candidate_answer: str,
        expected_answer: str,
        round_type: str,
        career_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Evaluate a candidate's answer against the expected answer.

        Returns:
            dict with keys: score (0-100), feedback, strengths, weaknesses, improved_answer
        """
        round_type = round_type.lower().replace(" ", "_")
        config = ROUND_CONFIGS.get(round_type, ROUND_CONFIGS["technical"])
        ctx = self._build_context_str(career_context)

        if not candidate_answer or not candidate_answer.strip():
            return {
                "score": 0,
                "feedback": "No answer was provided. Please attempt the question.",
                "strengths": [],
                "weaknesses": ["No answer submitted"],
                "improved_answer": expected_answer,
            }

        prompt = f"""You are evaluating a candidate's answer in a {config['label']} interview.

Candidate Profile:
{ctx}

Question Asked:
{question}

Expected Model Answer:
{expected_answer}

Candidate's Actual Answer:
{candidate_answer}

Evaluate the candidate's answer rigorously but fairly.
Score on a scale of 0-100 based on:
- Correctness and depth of knowledge
- Communication clarity
- Completeness vs expected answer
- Relevance to their experience level and target role

Return ONLY this exact JSON (no markdown):
{{
  "score": <integer 0-100>,
  "feedback": "<2-3 sentence overall evaluation>",
  "strengths": [
    "<specific strength observed in the answer>",
    "<another strength>"
  ],
  "weaknesses": [
    "<specific gap or mistake in the answer>",
    "<another weakness>"
  ],
  "improved_answer": "<a rewritten, improved version of what the candidate said, keeping their voice but filling gaps>"
}}"""

        system_msg = (
            "You are a strict but fair technical interviewer. "
            "Evaluate answers objectively. Be specific in feedback. "
            "Return ONLY valid JSON."
        )

        if self.llm.is_available:
            try:
                data = await self.llm.generate_json(prompt, system_message=system_msg)
                if isinstance(data, dict) and "score" in data:
                    return {
                        "score": max(0, min(100, int(data.get("score", 50)))),
                        "feedback": str(data.get("feedback", "")),
                        "strengths": [str(s) for s in data.get("strengths", [])],
                        "weaknesses": [str(w) for w in data.get("weaknesses", [])],
                        "improved_answer": str(data.get("improved_answer", "")),
                    }
            except Exception as e:
                logger.warning(f"Answer evaluation failed: {e}")

        return self._fallback_evaluation(candidate_answer, expected_answer)

    # ─── Final Score ──────────────────────────────────────────────

    async def generate_final_score(
        self,
        round_type: str,
        evaluations: List[Dict[str, Any]],
        career_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Compute aggregate final score and hire recommendation from all round evaluations.

        Returns:
            dict with: overall_score, grade, round_scores, top_strengths,
                       top_weaknesses, hire_recommendation, next_steps
        """
        if not evaluations:
            return self._empty_final_score()

        scores = [e.get("score", 0) for e in evaluations]
        overall = round(sum(scores) / len(scores))

        all_strengths = []
        all_weaknesses = []
        for ev in evaluations:
            all_strengths.extend(ev.get("strengths", []))
            all_weaknesses.extend(ev.get("weaknesses", []))

        ctx = self._build_context_str(career_context)
        config = ROUND_CONFIGS.get(round_type.lower(), ROUND_CONFIGS["technical"])

        prompt = f"""You are a hiring panel giving final feedback after a {config['label']}.

Candidate Profile:
{ctx}

Individual Question Scores: {scores}
Overall Average Score: {overall}/100

Strengths observed across all questions:
{chr(10).join(f"- {s}" for s in all_strengths)}

Weaknesses observed across all questions:
{chr(10).join(f"- {w}" for w in all_weaknesses)}

Generate a final interview report. Return ONLY this JSON:
{{
  "overall_score": {overall},
  "grade": "<A+|A|B+|B|C|F>",
  "hire_recommendation": "<Strong Hire|Hire|Maybe|No Hire>",
  "top_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "top_weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "summary": "<2-3 sentence hiring panel summary>",
  "next_steps": [
    "<actionable improvement step 1>",
    "<actionable improvement step 2>",
    "<actionable improvement step 3>"
  ]
}}"""

        system_msg = "You are a senior hiring panel evaluator. Return ONLY valid JSON."

        if self.llm.is_available:
            try:
                data = await self.llm.generate_json(prompt, system_message=system_msg)
                if isinstance(data, dict) and "grade" in data:
                    return {
                        "overall_score": overall,
                        "grade": str(data.get("grade", self._score_to_grade(overall))),
                        "hire_recommendation": str(data.get("hire_recommendation", "")),
                        "top_strengths": [str(s) for s in data.get("top_strengths", all_strengths[:3])],
                        "top_weaknesses": [str(w) for w in data.get("top_weaknesses", all_weaknesses[:3])],
                        "summary": str(data.get("summary", "")),
                        "next_steps": [str(s) for s in data.get("next_steps", [])],
                        "question_scores": scores,
                    }
            except Exception as e:
                logger.warning(f"Final score generation failed: {e}")

        return self._fallback_final_score(overall, scores, all_strengths, all_weaknesses)

    # ─── Helpers ──────────────────────────────────────────────────

    def _build_context_str(self, ctx: Dict[str, Any]) -> str:
        skills = ctx.get("skills", [])
        projects = ctx.get("projects", [])
        skills_str = ", ".join(skills[:15]) if skills else "Not specified"
        proj_str = ", ".join(projects[:5]) if isinstance(projects, list) and projects and isinstance(projects[0], str) else \
                   ", ".join(p.get("name", "") for p in projects[:5] if isinstance(p, dict)) if projects else "Not specified"

        return (
            f"Name: {ctx.get('name', 'Candidate')}\n"
            f"Current Role: {ctx.get('current_role', 'Student')}\n"
            f"Target Role: {ctx.get('target_role', 'Software Engineer')}\n"
            f"Experience: {ctx.get('experience_years', 0)} years\n"
            f"Skills: {skills_str}\n"
            f"Projects: {proj_str}\n"
            f"Education: {ctx.get('education', 'Not specified')}\n"
            f"Location: {ctx.get('location', 'Not specified')}"
        )

    def _score_to_grade(self, score: int) -> str:
        if score >= 90: return "A+"
        if score >= 80: return "A"
        if score >= 70: return "B+"
        if score >= 60: return "B"
        if score >= 50: return "C"
        return "F"

    def _score_to_hire(self, score: int) -> str:
        if score >= 85: return "Strong Hire"
        if score >= 70: return "Hire"
        if score >= 55: return "Maybe"
        return "No Hire"

    def _fallback_question(self, round_type: str, ctx: Dict[str, Any], config: Dict) -> Dict[str, Any]:
        role = ctx.get("target_role", "Software Engineer")
        skills = ctx.get("skills", ["Python"])
        skill = skills[0] if skills else "Python"

        questions = {
            "hr": f"Why do you want to become a {role}? What motivates you most about this career path?",
            "technical": f"Explain how you would optimize a slow database query in a {skill} application.",
            "behavioral": f"Tell me about a time you faced a technical challenge in one of your projects. How did you resolve it?",
            "system_design": f"Design a scalable REST API for a job board platform targeting {role} roles. Walk me through your architecture.",
            "coding": f"Write a function in {skill} to find the longest substring without repeating characters.",
        }

        return {
            "question": questions.get(round_type, questions["technical"]),
            "difficulty": "Medium",
            "hints": [
                "Think about the core concepts involved.",
                "Consider edge cases and performance implications.",
                "Break the problem into smaller steps before answering.",
            ],
            "expected_answer": f"A strong answer would demonstrate deep knowledge of {skill} and practical experience as a {role}.",
            "time_limit_seconds": config["time_limit"],
        }

    def _fallback_evaluation(self, answer: str, expected: str) -> Dict[str, Any]:
        word_count = len(answer.split())
        score = min(70, max(30, word_count * 2))
        return {
            "score": score,
            "feedback": "Your answer shows some understanding. Review the expected answer to identify gaps.",
            "strengths": ["Attempted the question", "Provided some relevant information"],
            "weaknesses": ["Could be more detailed", "Missing key concepts from the expected answer"],
            "improved_answer": expected,
        }

    def _fallback_final_score(self, overall: int, scores: List[int], strengths: List[str], weaknesses: List[str]) -> Dict[str, Any]:
        return {
            "overall_score": overall,
            "grade": self._score_to_grade(overall),
            "hire_recommendation": self._score_to_hire(overall),
            "top_strengths": list(set(strengths))[:3] or ["Attempted all questions", "Some domain knowledge shown"],
            "top_weaknesses": list(set(weaknesses))[:3] or ["Needs deeper technical knowledge"],
            "summary": f"The candidate scored {overall}/100 overall. Further preparation is recommended.",
            "next_steps": [
                "Review topics where you scored below 70",
                "Practice more mock interviews",
                "Build projects demonstrating your target role skills",
            ],
            "question_scores": scores,
        }

    def _empty_final_score(self) -> Dict[str, Any]:
        return {
            "overall_score": 0,
            "grade": "F",
            "hire_recommendation": "No Hire",
            "top_strengths": [],
            "top_weaknesses": [],
            "summary": "No evaluations found.",
            "next_steps": [],
            "question_scores": [],
        }
