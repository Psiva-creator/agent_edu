import os
import json
import uuid
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
RESUMES_DIR = os.path.join(DATA_DIR, "resumes")
INDEX_PATH = os.path.join(RESUMES_DIR, "resumes.json")
FILES_DIR = os.path.join(RESUMES_DIR, "files")

class ResumeDB:
    def __init__(self):
        os.makedirs(FILES_DIR, exist_ok=True)
        if not os.path.exists(INDEX_PATH):
            self._save_index([])

    def _load_index(self) -> List[Dict[str, Any]]:
        try:
            if os.path.exists(INDEX_PATH):
                with open(INDEX_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading index: {e}")
        return []

    def _save_index(self, data: List[Dict[str, Any]]):
        try:
            with open(INDEX_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving index: {e}")

    def list_resumes(self) -> List[Dict[str, Any]]:
        return self._load_index()

    def get_resume(self, resume_id: str) -> Optional[Dict[str, Any]]:
        index = self._load_index()
        for r in index:
            if r["id"] == resume_id:
                return r
        return None

    def get_active_resume(self) -> Optional[Dict[str, Any]]:
        index = self._load_index()
        for r in index:
            if r["active"]:
                return r
        # Fallback: if no active, set the first one as active
        if index:
            index[0]["active"] = True
            self._save_index(index)
            return index[0]
        return None

    def add_resume(self, name: str, size: int, text: str, ats_score: int, career_domain: str, file_bytes: bytes) -> Dict[str, Any]:
        index = self._load_index()
        resume_id = str(uuid.uuid4())
        
        # Save file to disk
        file_path = os.path.join(FILES_DIR, f"{resume_id}_{name}")
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Deactivate previous active resumes
        for r in index:
            r["active"] = False

        new_resume = {
            "id": resume_id,
            "name": name,
            "upload_date": uuid.uuid4().hex[:8], # Used for short unique dates, let's use real time below
            "upload_time": uuid.uuid4().hex[:8], # Let's format actual ISO time
            "active": True,
            "ats_score": ats_score,
            "career_domain": career_domain,
            "file_size": f"{round(size / 1024, 1)} KB",
            "file_path": file_path,
            "text": text,
            "version": len(index) + 1
        }
        
        # Actual timestamp
        from datetime import datetime
        now = datetime.now()
        new_resume["upload_date"] = now.strftime("%Y-%m-%d %H:%M:%S")

        index.append(new_resume)
        self._save_index(index)
        return new_resume

    def set_active(self, resume_id: str) -> Optional[Dict[str, Any]]:
        index = self._load_index()
        target = None
        for r in index:
            if r["id"] == resume_id:
                r["active"] = True
                target = r
            else:
                r["active"] = False
        if target:
            self._save_index(index)
        return target

    def rename_resume(self, resume_id: str, new_name: str) -> Optional[Dict[str, Any]]:
        index = self._load_index()
        target = None
        for r in index:
            if r["id"] == resume_id:
                # Rename the file physically if needed, or just change meta name
                r["name"] = new_name
                target = r
                break
        if target:
            self._save_index(index)
        return target

    def delete_resume(self, resume_id: str) -> bool:
        index = self._load_index()
        target = None
        for r in index:
            if r["id"] == resume_id:
                target = r
                break
        if not target:
            return False

        # Remove file from disk
        if os.path.exists(target["file_path"]):
            try:
                os.remove(target["file_path"])
            except Exception as e:
                print(f"Error removing physical file: {e}")

        new_index = [r for r in index if r["id"] != resume_id]
        
        # If deleted active, set another one active
        if target["active"] and new_index:
            new_index[0]["active"] = True

        self._save_index(new_index)
        return True
