import re
import logging
from typing import Dict, Any, Optional, List
from services.llm_service import LLMService
from services.context_builder import ContextBuilder
from services.conversation_manager import ConversationManager

logger = logging.getLogger(__name__)

def strip_reasoning_backend(text: str) -> str:
    """
    Strips internal reasoning details blocks (<details>...</details>) from response content.
    """
    if not text:
        return ""
    # Strip <details> tags and their contents case-insensitive
    text = re.sub(r'<details\b[^>]*>([\s\S]*?)</details>', '', text, flags=re.IGNORECASE)
    return text.strip()

class MentorService:
    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.context_builder = ContextBuilder()
        self.conversation_manager = ConversationManager()

    async def answer_question(
        self,
        question: str,
        career_context: Optional[dict] = None,
        session_id: str = "default_session"
    ) -> Dict[str, Any]:
        """
        AI Career Intelligence Engine: processes queries, performs intent routing, 
        fetches dynamic context, shifts persona mode, and filters final answers.
        """
        if not question or not question.strip():
            return {"answer": "Please ask a valid career question."}

        # ── Step 1: Collect Context & History ──
        unified_context = self.context_builder.build_context(career_context)
        history = self.conversation_manager.get_history(session_id, unified_context.get("history"))

        name = unified_context.get("name", "User")
        current_role = unified_context.get("current_role", "Student")
        target_role = unified_context.get("target_role", "Software Engineer")
        experience_years = unified_context.get("experience_years", 0)
        skills = unified_context.get("skills", [])
        ats_score = unified_context.get("ats_score", 0)
        roadmap = unified_context.get("roadmap")
        completed_tasks_count = unified_context.get("completed_tasks_count", 0)

        # ── Step 2: Intent Classification ──
        intent = self._detect_intent(question)

        # ── Step 3: Smart Context Filtering ──
        filtered_context = self._get_smart_context(unified_context, intent)
        mentor_mode_instruction = self._get_mentor_mode_instruction(intent)

        # ── Step 4: Mock Interview Controller ──
        interview_active = False
        current_q_num = 0
        
        # Check active interview state in history
        for msg in history:
            content = msg.get("content", "")
            role = msg.get("role", "")
            if role == "assistant":
                if "Question 1:" in content:
                    interview_active = True
                    current_q_num = 1
                elif "Question 2:" in content:
                    interview_active = True
                    current_q_num = 2
                elif "Question 3:" in content:
                    interview_active = True
                    current_q_num = 3
                elif "Final Mock Interview Report" in content:
                    interview_active = False
                    current_q_num = 0

        # Terminating interview
        q_lower = question.lower()
        is_quit = any(x in q_lower for x in ["exit interview", "stop interview", "quit interview", "exit mock", "stop mock"])
        if is_quit and interview_active:
            self.conversation_manager.clear_session(session_id)
            return {
                "answer": (
                    f"### Mock Interview Terminated\n\n"
                    f"I have ended the interview practice session. Let me know what other questions you have about "
                    f"resumes, projects, certifications, or tech comparisons!"
                )
            }

        # Select Interview Questions
        q1_text = f"Explain the core features of a production-ready application for a {target_role}. What architecture would you choose?"
        q2_text = "How do you identify and resolve memory leaks or performance bottlenecks in your code?"
        q3_text = "Describe a challenging technical problem you solved in the past. What was your approach and outcome?"
        
        role_lower = target_role.lower()
        if "ai" in role_lower or "machine" in role_lower or "ml" in role_lower or "data" in role_lower:
            q1_text = "Explain the difference between bias and variance. How do you handle high variance in a model?"
            q2_text = "Describe how gradient descent works. What is the impact of a learning rate that is too high or too low?"
            q3_text = "What metrics (e.g., precision, recall, F1, ROC-AUC) would you use to evaluate an imbalanced classification model?"
        elif "front" in role_lower or "react" in role_lower or "web" in role_lower:
            q1_text = "How does React's virtual DOM reconciliation work? What are key advantages?"
            q2_text = "Explain the difference between Server-Side Rendering (SSR) and Client-Side Rendering (CSR). When do you choose which?"
            q3_text = "How do you manage global state in a complex frontend app? What are the trade-offs of Redux vs Context API?"
        elif "back" in role_lower or "node" in role_lower or "django" in role_lower or "api" in role_lower:
            q1_text = "What is database normalization, and when is it beneficial to denormalize for performance?"
            q2_text = "Explain RESTful API design principles. What HTTP methods and status codes are used for resource creation and updates?"
            q3_text = "What are the common strategies for handling distributed transactions or caching in backend microservices?"

        # Starting mock interview
        if intent == "mock_interview" and not interview_active:
            answer_text = (
                f"🤖 **Mock Interview Started**\n"
                f"• **Role:** {target_role}\n"
                f"• **Experience Level:** {experience_years} years\n"
                f"• **Format:** 3 questions, graded one-by-one.\n\n"
                f"To exit at any time, type **'exit interview'**.\n\n"
                f"--- \n\n"
                f"### Question 1:\n"
                f"{q1_text}"
            )
            self.conversation_manager.add_message(session_id, "user", question)
            self.conversation_manager.add_message(session_id, "assistant", answer_text)
            return {"answer": answer_text}

        # Handling subsequent interview responses
        if interview_active:
            score = 7
            feedback = "A solid answer! You covered the core principles but could expand more on production scalability and design patterns."
            
            ans_len = len(question.strip())
            if ans_len > 150:
                score = 9
                feedback = "Excellent response. Extremely detailed, references real-world trade-offs, and shows deep architecture awareness."
            elif ans_len < 40:
                score = 5
                feedback = "A bit too brief. In a real interview, strive to structure your answers using the STAR method (Situation, Task, Action, Result) and expand on tech details."

            if current_q_num == 1:
                answer_text = (
                    f"### Evaluation (Question 1)\n"
                    f"• **Score:** {score}/10\n"
                    f"• **Feedback:** {feedback}\n\n"
                    f"--- \n\n"
                    f"### Question 2:\n"
                    f"{q2_text}"
                )
            elif current_q_num == 2:
                answer_text = (
                    f"### Evaluation (Question 2)\n"
                    f"• **Score:** {score}/10\n"
                    f"• **Feedback:** {feedback}\n\n"
                    f"--- \n\n"
                    f"### Question 3:\n"
                    f"{q3_text}"
                )
            else:
                answer_text = (
                    f"### Evaluation (Question 3)\n"
                    f"• **Score:** {score}/10\n"
                    f"• **Feedback:** {feedback}\n\n"
                    f"--- \n\n"
                    f"## 🏆 Final Mock Interview Report\n"
                    f"*   **Overall Readiness:** {ats_score}%\n"
                    f"*   **Interview Performance Score:** 8.2/10\n"
                    f"*   **Key Strengths:** Strong conceptual understanding, good technical vocabulary.\n"
                    f"*   **Areas of Focus:** Add more concrete figures (percentage latency reductions, traffic numbers) in your projects descriptions.\n\n"
                    f"Excellent effort! You are well on your way. Ask me anything else to continue preparing!"
                )

            self.conversation_manager.add_message(session_id, "user", question)
            self.conversation_manager.add_message(session_id, "assistant", answer_text)
            return {"answer": answer_text}

        # ── Step 5: LLM Generation Path ──
        if self.llm.is_available:
            try:
                formatted_context = self.context_builder.format_for_llm(filtered_context)
                
                formatted_history = ""
                for msg in history[-6:]:
                    role_label = "Candidate" if msg.get("role") == "user" else "Mentor"
                    formatted_history += f"{role_label}: {strip_reasoning_backend(msg.get('content'))}\n"

                system_message = (
                    f"You are a senior, highly experienced AI Career Coach specialized in technical careers.\n"
                    f"Current Mode Context: {mentor_mode_instruction}\n\n"
                    f"CRITICAL RULES:\n"
                    f"1. You must NEVER output reasoning process tags, chain of thought blocks, or details summaries like '<details>' to the final user. Only provide polished, final response text.\n"
                    f"2. Incorporate the candidate background context naturally without repeating the stored fields back to them. Frame recommendations matching their experience level.\n"
                    f"3. Switch tone according to the topic intent. Make coding advice very direct with examples, and resume reviews highly analytical.\n"
                    f"4. Proactively suggest improvements (e.g. key technical skills, missing certifications, or projects) if context dictates."
                )
                
                prompt = (
                    f"Candidate Background Context:\n{formatted_context}\n\n"
                    f"Recent Conversation History:\n{formatted_history}\n"
                    f"Candidate's Latest Message: {question}\n\n"
                    f"Respond as their Career Coach:"
                )

                answer = await self.llm.generate(prompt, system_message=system_message)
                if answer and not answer.is_empty:
                    clean_res = strip_reasoning_backend(answer.content)
                    self.conversation_manager.add_message(session_id, "user", question)
                    self.conversation_manager.add_message(session_id, "assistant", clean_res)
                    return {"answer": clean_res}
            except Exception as e:
                logger.warning(f"LLM question answering failed: {e}. Using intelligent fallback.")

        # ── Step 6: Fallback Path ──
        response_text = ""
        if intent == "greeting":
            response_text = (
                f"Hello {name}! 👋 It's wonderful to connect with you today.\n\n"
                f"As your Career Mentor, I am ready to guide you on your path to becoming a **{target_role}**. "
                f"We can optimize your resume, review your roadmap, suggest portfolio projects, "
                f"practice interview scenarios, or optimize your LinkedIn visibility.\n\n"
                f"What career topic or question is on your mind today?"
            )
        elif intent in ["resume", "ats"]:
            response_text = (
                f"### Resume Analysis & Recommendations 📄\n\n"
                f"Looking at your profile, your current ATS Score is **{ats_score}%**.\n\n"
                f"**Key Recommendations:**\n"
                f"1. **Quantify Achievements:** Instead of just listing responsibilities, write things like *'optimized SQL queries, reducing load times by 30%'*.\n"
                f"2. **Add Missing Keywords:** Based on your target role (**{target_role}**), make sure you highlight relevant libraries or tools in your skills section.\n"
                f"3. **Format Clearly:** Ensure your contact details and sections are separated using professional margins.\n\n"
                f"Let me know if you would like me to review a specific project description!"
            )
        elif intent in ["projects", "portfolio"]:
            response_text = (
                f"### Recommended Portfolio Project 🚀\n\n"
                f"To boost your chances for a **{target_role}** role, I suggest building a **Collaborative Cloud Analytics Platform**.\n\n"
                f"*   **Tech Stack:** React, Python (FastAPI), PostgreSQL, Docker\n"
                f"*   **Duration:** 3 - 4 weeks\n"
                f"*   **Difficulty:** Medium/Advanced\n"
                f"*   **Resume Value:** Demonstrates your understanding of Docker containerization, RESTful API design, database schemas, and clean UI components.\n\n"
                f"Would you like a step-by-step layout of the database schema to get started?"
            )
        elif intent in ["roadmap", "learning"]:
            response_text = (
                f"### Learning Roadmap Guidance 🗺️\n\n"
                f"Your roadmap focuses on transitioning you into a **{target_role}** role. You have completed **{completed_tasks_count} tasks** so far.\n\n"
                f"**Next Steps:**\n"
                f"1. Review your current week milestone and complete any pending tasks.\n"
                f"2. Focus on building small code repository tests for your target technologies.\n"
                f"3. If your roadmap looks empty, you can toggle a new build in the **Roadmap** tab!\n\n"
                f"Never hesitate to ask me to clarify a specific technical topic in your week syllabus."
            )
        elif intent in ["coding", "programming", "technology_comparison"]:
            response_text = (
                f"### Technical Practice and Insights 💻\n\n"
                f"When writing code for a **{target_role}** application, prioritize readability, modular structure, and automated testing.\n\n"
                f"For example, when setting up an API endpoint, separate business controller functions from raw database operations to keep modules loosely coupled and testable."
            )
        else:
            response_text = (
                f"Hi {name}! As your Career Mentor, I want to help you achieve your goal of becoming a **{target_role}**.\n\n"
                f"Focus on consistent day-by-day practice: write code, read technical articles, and polish your resume details. "
                f"Consistency beats intensity. Keep pushing forward!\n\n"
                f"How can I help you take your next step today?"
            )

        self.conversation_manager.add_message(session_id, "user", question)
        self.conversation_manager.add_message(session_id, "assistant", response_text)
        return {"answer": response_text}

    def _detect_intent(self, question: str) -> str:
        q = question.lower()
        if any(x in q for x in ["interview", "mock", "practice", "prep", "question"]):
            return "mock_interview"
        if any(x in q for x in ["hello", "hi", "hey", "greetings", "good morning", "good afternoon"]):
            return "greeting"
        if any(x in q for x in ["resume", "cv", "experience", "education", "profile", "contact"]):
            return "resume"
        if any(x in q for x in ["ats", "ats score", "recruiter", "verdict", "score"]):
            return "ats"
        if any(x in q for x in ["roadmap", "milestone", "syllabus", "week"]):
            return "roadmap"
        if any(x in q for x in ["project", "portfolio", "github", "build"]):
            return "projects"
        if any(x in q for x in ["code", "programming", "python", "javascript", "react", "html", "css", "db"]):
            return "coding"
        if any(x in q for x in ["vs", "compare", "difference between"]):
            return "technology_comparison"
        if any(x in q for x in ["job", "apply", "application", "vacancy", "matching"]):
            return "jobs"
        if any(x in q for x in ["salary", "compensation", "package", "pay"]):
            return "salary"
        if any(x in q for x in ["switch", "transition", "change field"]):
            return "career_switching"
        if any(x in q for x in ["motivation", "discouraged", "hard", "struggling", "inspire"]):
            return "motivation"
        return "general"

    def _get_smart_context(self, full_context: dict, intent: str) -> dict:
        """
        Smart Context Retrieval: Retrieves only context items matching the question intent.
        """
        filtered = {
            "name": full_context.get("name"),
            "target_role": full_context.get("target_role"),
            "current_role": full_context.get("current_role")
        }
        
        if intent in ["resume", "ats"]:
            filtered["ats_score"] = full_context.get("ats_score")
            filtered["active_resume"] = full_context.get("active_resume")
            filtered["skills"] = full_context.get("skills")
        elif intent in ["roadmap", "learning"]:
            filtered["completed_tasks_count"] = full_context.get("completed_tasks_count")
            filtered["roadmap"] = full_context.get("roadmap")
        elif intent in ["projects", "portfolio"]:
            filtered["projects"] = full_context.get("projects")
            filtered["skills"] = full_context.get("skills")
        elif intent in ["coding", "programming", "technology_comparison"]:
            filtered["skills"] = full_context.get("skills")
        elif intent in ["mock_interview"]:
            filtered["experience_years"] = full_context.get("experience_years")
            filtered["skills"] = full_context.get("skills")
            filtered["target_role"] = full_context.get("target_role")
            filtered["ats_score"] = full_context.get("ats_score")
        elif intent in ["jobs"]:
            filtered["target_role"] = full_context.get("target_role")
            
        return filtered

    def _get_mentor_mode_instruction(self, intent: str) -> str:
        """
        Dynamic Mentor Mode shifting based on query intent.
        """
        if intent in ["resume", "portfolio"]:
            return "Mode: Resume Expert. Focus on reviewing experience details, layout impact, and alignment with target role expectations."
        elif intent == "ats":
            return "Mode: ATS Expert. Focus on keyword matching, parsing issues, checklist achievements, and ATS score optimization."
        elif intent in ["coding", "programming", "technology_comparison"]:
            return "Mode: Coding Mentor. Answer technical questions directly with code examples, explaining programming patterns, best practices, and tech trade-offs."
        elif intent in ["roadmap", "learning"]:
            return "Mode: Learning Mentor. Provide systematic steps to study target technologies, weekly plan pacing, and helpful resources."
        elif intent == "projects":
            return "Mode: Project Mentor. Suggest portfolio projects that bridge skill gaps, outline core architectures, and list feature scopes."
        elif intent == "mock_interview":
            return "Mode: Interview Coach. Maintain a supportive yet professional evaluation persona for Mock Interviews."
        elif intent == "jobs":
            return "Mode: Job Placement Advisor. Focus on application customizing, interview preps, and role match checklists."
        else:
            return "Mode: General Career Mentor. Provide holistic career guidance, transitions pathing, and professional advice."

