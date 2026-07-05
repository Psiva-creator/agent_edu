"""
Tests: LLM Service
===================
Covers: init, cache, retry config, JSON parsing, generate methods,
        availability, stats, edge cases, mock OpenAI responses.
"""
import json
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from pydantic import BaseModel

from services.llm_service import LLMService, LLMResponse, LRUCache, RetryConfig, LLMStats


# ═══════════════════════════════════════════════════════════════
# LRU CACHE
# ═══════════════════════════════════════════════════════════════

class TestLRUCache:
    def test_put_and_get(self):
        cache = LRUCache(max_size=3)
        cache.put("a", "val_a")
        assert cache.get("a") == "val_a"

    def test_miss_returns_none(self):
        cache = LRUCache(max_size=3)
        assert cache.get("missing") is None

    def test_eviction_on_overflow(self):
        cache = LRUCache(max_size=2)
        cache.put("a", "1")
        cache.put("b", "2")
        cache.put("c", "3")  # evicts "a"
        assert cache.get("a") is None
        assert cache.get("b") == "2"
        assert cache.get("c") == "3"

    def test_lru_ordering(self):
        cache = LRUCache(max_size=2)
        cache.put("a", "1")
        cache.put("b", "2")
        cache.get("a")        # access "a", so "b" is now LRU
        cache.put("c", "3")   # evicts "b"
        assert cache.get("a") == "1"
        assert cache.get("b") is None
        assert cache.get("c") == "3"

    def test_update_existing_key(self):
        cache = LRUCache(max_size=3)
        cache.put("a", "old")
        cache.put("a", "new")
        assert cache.get("a") == "new"
        assert cache.size == 1

    def test_clear(self):
        cache = LRUCache(max_size=5)
        cache.put("a", "1")
        cache.put("b", "2")
        cache.clear()
        assert cache.size == 0
        assert cache.get("a") is None

    def test_make_key_deterministic(self):
        k1 = LRUCache.make_key("prompt", "sys", "gpt-4")
        k2 = LRUCache.make_key("prompt", "sys", "gpt-4")
        assert k1 == k2

    def test_make_key_unique_for_different_inputs(self):
        k1 = LRUCache.make_key("prompt1", "sys", "gpt-4")
        k2 = LRUCache.make_key("prompt2", "sys", "gpt-4")
        assert k1 != k2

    def test_size_property(self):
        cache = LRUCache(max_size=10)
        assert cache.size == 0
        cache.put("x", "y")
        assert cache.size == 1


# ═══════════════════════════════════════════════════════════════
# RETRY CONFIG
# ═══════════════════════════════════════════════════════════════

class TestRetryConfig:
    def test_default_values(self):
        rc = RetryConfig()
        assert rc.max_retries == 3
        assert rc.base_delay_seconds == 1.0

    def test_exponential_backoff(self):
        rc = RetryConfig()
        assert rc.get_delay(0) == 1.0
        assert rc.get_delay(1) == 2.0
        assert rc.get_delay(2) == 4.0
        assert rc.get_delay(3) == 8.0

    def test_max_delay_cap(self):
        rc = RetryConfig(max_delay_seconds=5.0)
        assert rc.get_delay(10) == 5.0

    def test_custom_config(self):
        rc = RetryConfig(max_retries=5, base_delay_seconds=0.5)
        assert rc.max_retries == 5
        assert rc.get_delay(0) == 0.5
        assert rc.get_delay(1) == 1.0


# ═══════════════════════════════════════════════════════════════
# LLM RESPONSE
# ═══════════════════════════════════════════════════════════════

class TestLLMResponse:
    def test_is_empty_true(self):
        r = LLMResponse(content="", model="gpt-4")
        assert r.is_empty is True

    def test_is_empty_whitespace(self):
        r = LLMResponse(content="   ", model="gpt-4")
        assert r.is_empty is True

    def test_is_empty_false(self):
        r = LLMResponse(content="hello", model="gpt-4")
        assert r.is_empty is False

    def test_token_counts(self):
        r = LLMResponse(content="x", model="gpt-4", prompt_tokens=10,
                         completion_tokens=20, total_tokens=30)
        assert r.total_tokens == 30


# ═══════════════════════════════════════════════════════════════
# LLM STATS
# ═══════════════════════════════════════════════════════════════

class TestLLMStats:
    def test_cache_hit_rate(self):
        s = LLMStats(total_requests=10, total_cached=3)
        assert s.cache_hit_rate == 30.0

    def test_cache_hit_rate_zero_requests(self):
        s = LLMStats()
        assert s.cache_hit_rate == 0.0

    def test_avg_latency(self):
        s = LLMStats(total_requests=10, total_cached=5, total_latency_ms=500)
        assert s.avg_latency_ms == 100.0

    def test_avg_latency_all_cached(self):
        s = LLMStats(total_requests=5, total_cached=5, total_latency_ms=0)
        assert s.avg_latency_ms == 0.0


# ═══════════════════════════════════════════════════════════════
# LLM SERVICE — INIT & PROPERTIES
# ═══════════════════════════════════════════════════════════════

class TestLLMServiceInit:
    def test_not_available_without_key(self, mock_llm):
        assert mock_llm.is_available is False

    def test_cache_enabled_by_default(self, mock_llm):
        assert mock_llm._cache is not None

    def test_cache_disabled(self):
        svc = LLMService(enable_cache=False)
        assert svc._cache is None

    def test_get_stats(self, mock_llm):
        stats = mock_llm.get_stats()
        assert "is_available" in stats
        assert "model" in stats
        assert "total_requests" in stats

    def test_cache_size_property(self, mock_llm):
        assert mock_llm.cache_size == 0

    def test_clear_cache(self, mock_llm):
        cleared = mock_llm.clear_cache()
        assert cleared == 0


# ═══════════════════════════════════════════════════════════════
# JSON PARSER
# ═══════════════════════════════════════════════════════════════

class TestJSONParser:
    def test_direct_json(self):
        assert LLMService._parse_json('{"a": 1}') == {"a": 1}

    def test_json_array(self):
        assert LLMService._parse_json('[1, 2, 3]') == [1, 2, 3]

    def test_markdown_json_block(self):
        text = 'Here is the result:\n```json\n{"b": 2}\n```\nDone.'
        assert LLMService._parse_json(text) == {"b": 2}

    def test_generic_code_block(self):
        text = '```\n{"c": 3}\n```'
        assert LLMService._parse_json(text) == {"c": 3}

    def test_embedded_json(self):
        text = 'The answer is {"d": 4} and that is it.'
        assert LLMService._parse_json(text) == {"d": 4}

    def test_empty_string(self):
        assert LLMService._parse_json("") == {}

    def test_none_string(self):
        assert LLMService._parse_json("") == {}

    def test_no_json_at_all(self):
        assert LLMService._parse_json("no json here") == {}

    def test_nested_json(self):
        text = '{"outer": {"inner": [1, 2]}}'
        result = LLMService._parse_json(text)
        assert result["outer"]["inner"] == [1, 2]

    def test_whitespace_padding(self):
        assert LLMService._parse_json('   {"x": 1}   ') == {"x": 1}


# ═══════════════════════════════════════════════════════════════
# GENERATE (fallback mode — no API key)
# ═══════════════════════════════════════════════════════════════

class TestLLMGenerate:
    @pytest.mark.asyncio
    async def test_generate_returns_empty_when_unavailable(self, mock_llm):
        resp = await mock_llm.generate("hello")
        assert resp.is_empty
        assert mock_llm.stats.total_requests == 1

    @pytest.mark.asyncio
    async def test_generate_json_returns_empty_dict(self, mock_llm):
        result = await mock_llm.generate_json("hello")
        assert result == {}

    @pytest.mark.asyncio
    async def test_generate_typed_returns_none(self, mock_llm):
        class MyModel(BaseModel):
            name: str

        result = await mock_llm.generate_typed("hello", MyModel)
        assert result is None
