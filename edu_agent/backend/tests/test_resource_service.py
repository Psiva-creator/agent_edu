"""
Tests: Resource Service
========================
Covers: loading, search, fuzzy matching, recommendations,
        multi-skill lookup, stats, categories, edge cases.
"""
import pytest
from services.resource_service import ResourceService


class TestResourceServiceLoading:
    def test_loads_resources(self, resource_service):
        names = resource_service.get_all_skill_names()
        assert len(names) >= 15

    def test_reload(self, resource_service):
        count = resource_service.reload()
        assert count >= 15

    def test_missing_file_graceful(self, tmp_path):
        svc = ResourceService(resources_path=str(tmp_path / "nonexistent.json"))
        result = svc.search("python")
        assert result["found"] is False

    def test_invalid_json_graceful(self, tmp_path):
        bad_file = tmp_path / "bad.json"
        bad_file.write_text("NOT VALID JSON {{{", encoding="utf-8")
        svc = ResourceService(resources_path=str(bad_file))
        names = svc.get_all_skill_names()
        assert names == []


class TestResourceServiceSearch:
    def test_search_exact_match(self, resource_service):
        result = resource_service.search("python")
        assert result["found"] is True
        assert "skill" in result

    def test_search_case_insensitive(self, resource_service):
        result = resource_service.search("PYTHON")
        assert result["found"] is True

    def test_search_partial_match(self, resource_service):
        result = resource_service.search("react")
        assert result["found"] is True

    def test_search_not_found(self, resource_service):
        result = resource_service.search("nonexistent_skill_xyz")
        assert result["found"] is False
        assert "available_skills" in result

    def test_search_empty_query(self, resource_service):
        result = resource_service.search("")
        assert result["found"] is False
        assert "Empty search query" in result.get("message", "")

    def test_search_whitespace_query(self, resource_service):
        result = resource_service.search("   ")
        assert result["found"] is False

    def test_search_returns_skill_details(self, resource_service):
        result = resource_service.search("python")
        skill = result["skill"]
        assert "name" in skill
        assert "official_docs" in skill
        assert "youtube_playlist" in skill
        assert "free_course" in skill
        assert "mini_project" in skill

    def test_search_docker(self, resource_service):
        result = resource_service.search("docker")
        assert result["found"] is True

    def test_search_sql(self, resource_service):
        result = resource_service.search("sql")
        assert result["found"] is True


class TestResourceServiceGetForSkill:
    def test_get_known_skill(self, resource_service):
        result = resource_service.get_for_skill("python")
        assert result != {}
        assert "name" in result

    def test_get_unknown_skill(self, resource_service):
        result = resource_service.get_for_skill("banana_programming")
        assert result == {}


class TestResourceServiceMultiSkill:
    def test_get_for_multiple_skills(self, resource_service):
        results = resource_service.get_for_skills(["Python", "SQL", "Docker"])
        assert len(results) == 3
        for r in results:
            assert "skill" in r
            assert "found" in r

    def test_mixed_known_unknown(self, resource_service):
        results = resource_service.get_for_skills(["Python", "UnknownSkill123"])
        assert len(results) == 2
        assert results[0]["found"] is True
        assert results[1]["found"] is False

    def test_empty_list(self, resource_service):
        results = resource_service.get_for_skills([])
        assert results == []


class TestResourceServiceRecommend:
    def test_recommend_excludes_known(self, resource_service):
        recs = resource_service.recommend(known_skills=["Python"])
        keys = [r["name"].lower() for r in recs]
        assert "python" not in keys

    def test_recommend_respects_limit(self, resource_service):
        recs = resource_service.recommend(limit=3)
        assert len(recs) <= 3

    def test_recommend_filter_difficulty(self, resource_service):
        recs = resource_service.recommend(difficulty="beginner", limit=10)
        for r in recs:
            assert r["difficulty"] == "beginner"

    def test_recommend_no_filters(self, resource_service):
        recs = resource_service.recommend()
        assert len(recs) > 0

    def test_recommend_all_known(self, resource_service):
        all_names = resource_service.get_all_skill_names()
        recs = resource_service.recommend(known_skills=all_names)
        assert len(recs) == 0


class TestResourceServiceStats:
    def test_get_stats(self, resource_service):
        stats = resource_service.get_stats()
        assert stats["total_skills"] >= 15
        assert "categories" in stats
        assert "difficulty_breakdown" in stats
        assert stats["total_estimated_hours"] > 0
        assert stats["average_hours_per_skill"] > 0

    def test_get_all_categories(self, resource_service):
        cats = resource_service.get_all_categories()
        assert len(cats) >= 3
        assert isinstance(cats, list)

    def test_get_all_skill_names_sorted(self, resource_service):
        names = resource_service.get_all_skill_names()
        assert names == sorted(names)
