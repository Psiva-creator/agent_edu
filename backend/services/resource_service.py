"""
Resource Service
================
Loads, searches, and recommends from the curated resource library.

Features:
    - Lazy-loads resources.json with in-memory caching
    - Case-insensitive & fuzzy skill matching
    - Skill recommendations based on category/difficulty
    - Graceful handling of missing skills
    - Structured JSON responses for all operations
"""

import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class ResourceService:
    """
    Manages the curated resource library (resources.json).

    Usage:
        svc = ResourceService()
        result = svc.search("python")
        recs  = svc.recommend(["Python"], difficulty="beginner")
    """

    def __init__(self, resources_path: Optional[str] = None):
        """
        Initialize the ResourceService.

        Args:
            resources_path: Override path to resources.json
                            (defaults to ../data/resources.json).
        """
        self._cache: dict | None = None
        self._path = (
            Path(resources_path)
            if resources_path
            else Path(__file__).parent.parent / "data" / "resources.json"
        )

    # ─── Loading ──────────────────────────────────────────────

    def _load(self) -> dict:
        """
        Load resources.json into memory (cached after first call).

        Returns:
            Dict mapping skill keys to skill resource objects.
        """
        if self._cache is not None:
            return self._cache

        try:
            with open(self._path, "r", encoding="utf-8") as f:
                self._cache = json.load(f)
            logger.info(
                f"Loaded {len(self._cache)} skills from {self._path.name}"
            )
        except FileNotFoundError:
            logger.warning(f"Resource file not found: {self._path}")
            self._cache = {}
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in resources.json: {e}")
            self._cache = {}

        return self._cache

    def reload(self) -> int:
        """Force reload from disk. Returns number of skills loaded."""
        self._cache = None
        return len(self._load())

    # ─── Search ───────────────────────────────────────────────

    def search(self, query: str) -> dict:
        """
        Search for a skill by name (case-insensitive, fuzzy).

        Args:
            query: Skill name or partial match.

        Returns:
            Full resource dict if found, or a "not found" response
            with suggestions.
        """
        if not query or not query.strip():
            return {
                "found": False,
                "query": query,
                "message": "Empty search query.",
                "available_skills": self.get_all_skill_names(),
            }

        resource = self.get_for_skill(query)

        if resource:
            return {
                "found": True,
                "query": query,
                "skill": resource,
            }

        # ── Not found — provide suggestions ──────────────────
        suggestions = self._find_similar(query)
        return {
            "found": False,
            "query": query,
            "message": f"Skill '{query}' not found in resource library.",
            "suggestions": suggestions,
            "available_skills": self.get_all_skill_names(),
        }

    def get_for_skill(self, skill: str) -> dict:
        """
        Look up resources for a single skill.

        Matching strategy (in order):
            1. Exact key match (normalized)
            2. Key contains query
            3. Skill name contains query

        Args:
            skill: Skill name to look up.

        Returns:
            Skill resource dict, or empty dict if not found.
        """
        resources = self._load()
        normalized = self._normalize(skill)

        # 1. Exact key match
        if normalized in resources:
            return resources[normalized]

        # 2. Key contains query
        for key, value in resources.items():
            if normalized in key:
                return value

        # 3. Skill name contains query
        for key, value in resources.items():
            name = value.get("name", "").lower()
            if normalized in name or name in normalized:
                return value

        return {}

    def get_for_skills(self, skills: list[str]) -> list[dict]:
        """
        Look up resources for multiple skills.

        Args:
            skills: List of skill names.

        Returns:
            List of results, one per skill (found or fallback).
        """
        results = []
        for skill in skills:
            resource = self.get_for_skill(skill)
            if resource:
                results.append({
                    "skill": skill,
                    "found": True,
                    "name": resource.get("name", skill),
                    "category": resource.get("category", "General"),
                    "difficulty": resource.get("difficulty", "intermediate"),
                    "estimated_hours": resource.get("estimated_hours", 40),
                    "official_docs": resource.get("official_docs", {}),
                    "youtube_playlist": resource.get("youtube_playlist", {}),
                    "free_course": resource.get("free_course", {}),
                    "practice_website": resource.get("practice_website", {}),
                    "mini_project": resource.get("mini_project", {}),
                })
            else:
                # ── Graceful fallback for unknown skills ─────
                results.append(self._fallback_resource(skill))

        return results

    # ─── Recommend ────────────────────────────────────────────

    def recommend(
        self,
        known_skills: list[str] = None,
        category: str = None,
        difficulty: str = None,
        limit: int = 5,
    ) -> list[dict]:
        """
        Recommend skills the user should learn next.

        Strategy:
            1. Exclude skills the user already knows.
            2. Filter by category and/or difficulty if specified.
            3. Sort by estimated hours (easiest first).
            4. Return top N recommendations.

        Args:
            known_skills:  Skills the user already has (excluded).
            category:      Filter by category (e.g., "DevOps").
            difficulty:    Filter by difficulty ("beginner"|"intermediate"|"advanced").
            limit:         Max number of recommendations.

        Returns:
            List of recommended skill objects.
        """
        resources = self._load()
        known_set = {
            self._normalize(s) for s in (known_skills or [])
        }

        candidates = []
        for key, value in resources.items():
            # Skip already-known skills
            if key in known_set or self._normalize(value.get("name", "")) in known_set:
                continue

            # Filter by category
            if category and category.lower() not in value.get("category", "").lower():
                continue

            # Filter by difficulty
            if difficulty and value.get("difficulty", "") != difficulty.lower():
                continue

            candidates.append({
                "key": key,
                "name": value.get("name", key),
                "category": value.get("category", "General"),
                "difficulty": value.get("difficulty", "intermediate"),
                "estimated_hours": value.get("estimated_hours", 40),
                "mini_project": value.get("mini_project", {}).get("title", ""),
                "free_course": value.get("free_course", {}).get("title", ""),
            })

        # Sort: beginner → intermediate → advanced, then by hours
        difficulty_order = {"beginner": 0, "intermediate": 1, "advanced": 2}
        candidates.sort(
            key=lambda c: (
                difficulty_order.get(c["difficulty"], 1),
                c["estimated_hours"],
            )
        )

        return candidates[:limit]

    # ─── Listing ──────────────────────────────────────────────

    def get_all_skill_names(self) -> list[str]:
        """Get a sorted list of all skill names in the library."""
        resources = self._load()
        return sorted(v.get("name", k) for k, v in resources.items())

    def get_all_categories(self) -> list[str]:
        """Get a sorted list of unique categories."""
        resources = self._load()
        return sorted({v.get("category", "General") for v in resources.values()})

    def get_skills_by_category(self, category: str) -> list[dict]:
        """Get all skills in a given category."""
        resources = self._load()
        results = []
        for key, value in resources.items():
            if category.lower() in value.get("category", "").lower():
                results.append({
                    "key": key,
                    "name": value.get("name", key),
                    "difficulty": value.get("difficulty", "intermediate"),
                    "estimated_hours": value.get("estimated_hours", 40),
                })
        return results

    def get_stats(self) -> dict:
        """Get summary statistics about the resource library."""
        resources = self._load()
        total = len(resources)
        categories = self.get_all_categories()
        difficulties = {}
        total_hours = 0

        for v in resources.values():
            d = v.get("difficulty", "intermediate")
            difficulties[d] = difficulties.get(d, 0) + 1
            total_hours += v.get("estimated_hours", 0)

        return {
            "total_skills": total,
            "categories": categories,
            "total_categories": len(categories),
            "difficulty_breakdown": difficulties,
            "total_estimated_hours": total_hours,
            "average_hours_per_skill": round(total_hours / total, 1) if total else 0,
        }

    # ─── Private Helpers ──────────────────────────────────────

    @staticmethod
    def _normalize(text: str) -> str:
        """Normalize a skill name for matching."""
        return (
            text.lower()
            .strip()
            .replace(" ", "_")
            .replace("-", "_")
            .replace(".", "")
            .replace("&", "and")
        )

    def _find_similar(self, query: str, limit: int = 3) -> list[str]:
        """Find skill names similar to the query."""
        resources = self._load()
        normalized = self._normalize(query)
        matches = []

        for key, value in resources.items():
            name = value.get("name", key).lower()
            # Check if any word in the query appears in the skill
            query_words = normalized.split("_")
            for word in query_words:
                if len(word) >= 3 and (word in key or word in name):
                    matches.append(value.get("name", key))
                    break

        return matches[:limit]

    def _fallback_resource(self, skill: str) -> dict:
        """
        Generate a fallback resource entry for unknown skills.
        Ensures the API always returns useful data.
        """
        return {
            "skill": skill,
            "found": False,
            "name": skill,
            "category": "General",
            "difficulty": "intermediate",
            "estimated_hours": 40,
            "official_docs": {
                "title": f"Search {skill} documentation",
                "url": f"https://www.google.com/search?q={skill}+official+documentation",
            },
            "youtube_playlist": {
                "title": f"{skill} tutorials on YouTube",
                "url": f"https://www.youtube.com/results?search_query={skill}+full+course",
                "channel": "Various",
            },
            "free_course": {
                "title": f"Search free {skill} courses",
                "url": f"https://www.coursera.org/search?query={skill}",
                "platform": "Coursera",
            },
            "practice_website": {
                "title": f"Practice {skill} online",
                "url": f"https://www.google.com/search?q={skill}+practice+exercises",
            },
            "mini_project": {
                "title": f"Build a {skill} Project",
                "description": f"Create a small project demonstrating your {skill} skills.",
                "skills_practiced": [skill],
                "estimated_hours": 8,
            },
        }
