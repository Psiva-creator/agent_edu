"""
Tests: Roadmap Agent
=====================
Covers: generation, validation, phase structure, weekly breakdown,
        resource integration, edge cases, invalid inputs.
"""
import pytest
from agents.roadmap_agent import RoadmapAgent


class TestRoadmapGeneration:
    @pytest.mark.asyncio
    async def test_generates_roadmap(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python", "SQL"],
            hours_per_week=10,
            deadline_weeks=10,
        )
        assert "weeks" in result
        assert len(result["weeks"]) == 10

    @pytest.mark.asyncio
    async def test_roadmap_has_weekly_breakdown(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Machine Learning"],
            hours_per_week=15,
            deadline_weeks=8,
        )
        for week in result["weeks"]:
            assert "week_number" in week
            assert "theme" in week
            assert "learning_objectives" in week
            assert "tasks" in week
            assert "resources" in week

    @pytest.mark.asyncio
    async def test_roadmap_has_phases(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Docker", "Kubernetes"],
            hours_per_week=10,
            deadline_weeks=10,
        )
        phases = {w.get("phase") for w in result["weeks"]}
        assert len(phases) >= 2  # At least 2 phases

    @pytest.mark.asyncio
    async def test_roadmap_has_milestones(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["React"],
            hours_per_week=10,
            deadline_weeks=10,
        )
        milestones = [w.get("milestone") for w in result["weeks"] if w.get("milestone")]
        assert len(milestones) > 0

    @pytest.mark.asyncio
    async def test_roadmap_has_mini_projects(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python", "FastAPI"],
            hours_per_week=10,
            deadline_weeks=10,
        )
        projects = [w.get("mini_project") for w in result["weeks"] if w.get("mini_project")]
        assert len(projects) > 0

    @pytest.mark.asyncio
    async def test_roadmap_hours_match(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python"],
            hours_per_week=15,
            deadline_weeks=10,
        )
        assert result["hours_per_week"] == 15

    @pytest.mark.asyncio
    async def test_roadmap_with_roles(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Docker"],
            hours_per_week=10,
            deadline_weeks=10,
            current_role="Student",
            target_role="DevOps Engineer",
        )
        assert result["current_role"] == "Student"
        assert result["target_role"] == "DevOps Engineer"


class TestRoadmapValidation:
    @pytest.mark.asyncio
    async def test_clamp_hours_too_low(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python"],
            hours_per_week=0,    # Below minimum
            deadline_weeks=10,
        )
        assert result["hours_per_week"] >= 1

    @pytest.mark.asyncio
    async def test_clamp_hours_too_high(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python"],
            hours_per_week=200,  # Above maximum
            deadline_weeks=10,
        )
        assert result["hours_per_week"] <= 80

    @pytest.mark.asyncio
    async def test_clamp_weeks_too_low(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python"],
            hours_per_week=10,
            deadline_weeks=0,  # Below minimum
        )
        assert result["total_weeks"] >= 1

    @pytest.mark.asyncio
    async def test_clamp_weeks_too_high(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python"],
            hours_per_week=10,
            deadline_weeks=100,  # Above maximum
        )
        assert result["total_weeks"] <= 52


class TestRoadmapEdgeCases:
    @pytest.mark.asyncio
    async def test_empty_skill_gaps_infers_from_role(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=[],
            hours_per_week=10,
            deadline_weeks=10,
            target_role="Data Scientist",
        )
        assert len(result["weeks"]) == 10
        assert len(result["skill_gaps_addressed"]) > 0

    @pytest.mark.asyncio
    async def test_single_skill(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Git"],
            hours_per_week=5,
            deadline_weeks=4,
        )
        assert len(result["weeks"]) == 4

    @pytest.mark.asyncio
    async def test_many_skills(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python", "SQL", "Docker", "AWS", "React", "Git", "FastAPI", "System Design"],
            hours_per_week=20,
            deadline_weeks=10,
        )
        assert len(result["weeks"]) == 10

    @pytest.mark.asyncio
    async def test_minimum_viable_roadmap(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python"],
            hours_per_week=1,
            deadline_weeks=1,
        )
        assert len(result["weeks"]) >= 1

    @pytest.mark.asyncio
    async def test_unknown_role_still_works(self, roadmap_agent):
        result = await roadmap_agent.generate_roadmap(
            skill_gaps=["Python"],
            hours_per_week=10,
            deadline_weeks=5,
            target_role="Quantum Computing Specialist",
        )
        assert "weeks" in result
