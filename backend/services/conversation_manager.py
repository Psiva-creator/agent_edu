from typing import List, Dict, Any

class ConversationManager:
    def __init__(self):
        self.sessions: Dict[str, List[Dict[str, str]]] = {}

    def get_history(self, session_id: str, request_history: List[Dict[str, Any]] = None) -> List[Dict[str, str]]:
        """
        Retrieves history for a session, syncing with any history sent from the frontend.
        """
        if session_id not in self.sessions:
            self.sessions[session_id] = []

        if request_history:
            # Sync local session history with request history
            formatted = []
            for msg in request_history:
                formatted.append({
                    "role": "user" if msg.get("role") == "user" else "assistant",
                    "content": msg.get("content", "")
                })
            self.sessions[session_id] = formatted

        return self.sessions[session_id]

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        self.sessions[session_id].append({
            "role": role,
            "content": content
        })
        # Keep last 30 messages to prevent context overflow
        if len(self.sessions[session_id]) > 30:
            self.sessions[session_id] = self.sessions[session_id][-30:]

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id] = []
