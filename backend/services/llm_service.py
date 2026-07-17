"""
LLM Service
============
Production-grade OpenAI client wrapper with retry logic,
timeout handling, response caching, JSON parsing, graceful
fallback, structured logging, and strongly typed responses.

Features:
    - OpenAI GPT-4 integration via official SDK
    - Environment variable configuration (via config.py)
    - Exponential backoff retry (configurable max retries)
    - Per-request timeout handling
    - In-memory LRU response cache (optional)
    - Robust JSON extraction from LLM responses
    - Graceful fallback when API key is missing
    - Structured logging for all operations
    - Strongly typed response models (Pydantic)
    - Prompt template rendering support

Usage:
    from services.llm_service import LLMService
    svc = LLMService()
    text = await svc.generate("Explain Python in 3 lines")
    data = await svc.generate_json(prompt, response_model=MyModel)
"""

import json
import time
import asyncio
import hashlib
import logging
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Optional, Type, TypeVar

from pydantic import BaseModel

from config import get_settings

try:
    from google import genai
    from google.genai import types as genai_types
    from google.genai.errors import APIError as GoogleAPIError
except ImportError:
    genai = None
    genai_types = None
    GoogleAPIError = Exception

logger = logging.getLogger(__name__)

# Type variable for Pydantic model generics
T = TypeVar("T", bound=BaseModel)


# ═══════════════════════════════════════════════════════════════
# Response Types
# ═══════════════════════════════════════════════════════════════

@dataclass
class LLMResponse:
    """Strongly typed wrapper for raw LLM responses."""
    content: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cached: bool = False
    latency_ms: float = 0.0

    @property
    def is_empty(self) -> bool:
        return not self.content or not self.content.strip()


@dataclass
class LLMStats:
    """Tracks cumulative usage statistics."""
    total_requests: int = 0
    total_cached: int = 0
    total_errors: int = 0
    total_retries: int = 0
    total_tokens_used: int = 0
    total_latency_ms: float = 0.0

    @property
    def cache_hit_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return round(self.total_cached / self.total_requests * 100, 1)

    @property
    def avg_latency_ms(self) -> float:
        non_cached = self.total_requests - self.total_cached
        if non_cached == 0:
            return 0.0
        return round(self.total_latency_ms / non_cached, 1)


# ═══════════════════════════════════════════════════════════════
# LRU Cache
# ═══════════════════════════════════════════════════════════════

class LRUCache:
    """Simple in-memory LRU cache for LLM responses."""

    def __init__(self, max_size: int = 128):
        self._cache: OrderedDict[str, str] = OrderedDict()
        self._max_size = max_size

    def get(self, key: str) -> Optional[str]:
        """Get a cached response. Returns None on miss."""
        if key in self._cache:
            self._cache.move_to_end(key)
            return self._cache[key]
        return None

    def put(self, key: str, value: str) -> None:
        """Store a response in cache."""
        if key in self._cache:
            self._cache.move_to_end(key)
        else:
            if len(self._cache) >= self._max_size:
                self._cache.popitem(last=False)
        self._cache[key] = value

    def clear(self) -> None:
        """Clear all cached entries."""
        self._cache.clear()

    @property
    def size(self) -> int:
        return len(self._cache)

    @staticmethod
    def make_key(prompt: str, system_message: str = "", model: str = "") -> str:
        """Generate a deterministic cache key from prompt parameters."""
        raw = f"{model}|{system_message}|{prompt}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]


# ═══════════════════════════════════════════════════════════════
# Retry Configuration
# ═══════════════════════════════════════════════════════════════

@dataclass
class RetryConfig:
    """Configuration for retry behavior."""
    max_retries: int = 3
    base_delay_seconds: float = 1.0
    max_delay_seconds: float = 30.0
    exponential_base: float = 2.0
    retryable_status_codes: tuple = (429, 500, 502, 503, 504)

    def get_delay(self, attempt: int) -> float:
        """Calculate exponential backoff delay for a given attempt."""
        delay = self.base_delay_seconds * (self.exponential_base ** attempt)
        return min(delay, self.max_delay_seconds)


# ═══════════════════════════════════════════════════════════════
# LLM Service
# ═══════════════════════════════════════════════════════════════

class LLMService:
    """
    Production-grade LLM client with retry, caching, and fallback.

    Usage:
        svc = LLMService()

        # Raw text generation
        response = await svc.generate("Explain Python")

        # JSON generation with auto-parsing
        data = await svc.generate_json(prompt)

        # Strongly typed response (Pydantic model)
        result = await svc.generate_typed(prompt, MyPydanticModel)

        # Render a prompt template, then generate
        text = await svc.generate_from_template(
            "roadmap", current_role="Student", target_role="ML Engineer"
        )
    """

    def __init__(
        self,
        retry_config: Optional[RetryConfig] = None,
        cache_size: int = 128,
        enable_cache: bool = True,
        timeout_seconds: float = 60.0,
    ):
        """
        Initialize the LLM service.

        Args:
            retry_config:    Custom retry configuration.
            cache_size:      Max number of cached responses (0 to disable).
            enable_cache:    Whether to enable response caching.
            timeout_seconds: Per-request timeout in seconds.
        """
        settings = get_settings()

        # ── Configuration ────────────────────────────────────
        self.model = settings.OPENAI_MODEL
        self.temperature = settings.OPENAI_TEMPERATURE
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.timeout = timeout_seconds
        self.retry_config = retry_config or RetryConfig()

        self.client = None
        self.gemini_client = None
        self.provider = None

        # ── Gemini key rotation setup ─────────────────────────
        self._gemini_api_keys: list[str] = settings.gemini_api_keys
        self._current_key_index: int = 0
        # Once every configured key hits quota, we stop hammering the API
        # and fall back to canned answers — but only for this cooldown
        # window, after which we retry from the first key again. Without
        # this, a single burst of traffic permanently locks a warm
        # serverless instance into fallback mode until it cold-starts.
        self._gemini_cooldown_until: float = 0.0
        self._gemini_cooldown_seconds: float = 60.0

        if self._gemini_api_keys:
            if genai:
                try:
                    self.gemini_client = genai.Client(api_key=self._gemini_api_keys[0])
                    self.provider = "gemini"
                    self.model = settings.GEMINI_MODEL
                    logger.info(
                        f"Gemini async client initialized — model={self.model}, "
                        f"temp={self.temperature}, timeout={self.timeout}s, "
                        f"keys_available={len(self._gemini_api_keys)}"
                    )
                except Exception as e:
                    logger.error(f"Failed to initialize Gemini async client: {e}")
            else:
                logger.error("google-genai package not installed, cannot use Gemini.")
        
        if not self.provider and settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your_api_key_here":
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    timeout=self.timeout,
                )
                self.provider = "openai"
                logger.info(
                    f"OpenAI async client initialized — model={self.model}, "
                    f"temp={self.temperature}, timeout={self.timeout}s"
                )
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI async client: {e}")

        if not self.provider:
            logger.info(
                "LLM Service: No API key configured. "
                "All agents will use intelligent fallback mode."
            )

        # ── Cache ────────────────────────────────────────────
        self._cache = LRUCache(max_size=cache_size) if enable_cache else None
        if self._cache:
            logger.debug(f"Response cache enabled (max_size={cache_size})")

        # ── Statistics ───────────────────────────────────────
        self.stats = LLMStats()

    # ─── Properties ───────────────────────────────────────────

    @property
    def is_available(self) -> bool:
        """Check if the LLM is available for real inference."""
        return self.provider is not None

    # ═══════════════════════════════════════════════════════════
    # GENERATE — Raw text
    # ═══════════════════════════════════════════════════════════

    async def generate(
        self,
        prompt: str,
        system_message: str = None,
        temperature: float = None,
        max_tokens: int = None,
        use_cache: bool = True,
    ) -> LLMResponse:
        """
        Generate a text response from the LLM.

        Args:
            prompt:         User prompt text.
            system_message: Optional system instruction.
            temperature:    Override default temperature.
            max_tokens:     Override default max tokens.
            use_cache:      Whether to check/populate cache.

        Returns:
            LLMResponse with content, token counts, and metadata.
        """
        self.stats.total_requests += 1

        if not self.is_available:
            logger.debug("LLM not available — returning empty response.")
            return LLMResponse(content="", model=self.model)

        # ── Check cache ──────────────────────────────────────
        cache_key = None
        if use_cache and self._cache:
            cache_key = LRUCache.make_key(
                prompt, system_message or "", self.model,
            )
            cached = self._cache.get(cache_key)
            if cached is not None:
                self.stats.total_cached += 1
                logger.debug(f"Cache hit (key={cache_key[:8]})")
                return LLMResponse(
                    content=cached, model=self.model, cached=True,
                )

        # ── Build messages ───────────────────────────────────
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})

        # ── Call with retry ──────────────────────────────────
        response = await self._call_with_retry(
            messages=messages,
            temperature=temperature or self.temperature,
            max_tokens=max_tokens or self.max_tokens,
        )

        # ── Populate cache ───────────────────────────────────
        if cache_key and self._cache and not response.is_empty:
            self._cache.put(cache_key, response.content)

        return response

    # ═══════════════════════════════════════════════════════════
    # GENERATE — JSON parsed
    # ═══════════════════════════════════════════════════════════

    async def generate_json(
        self,
        prompt: str,
        system_message: str = None,
        use_cache: bool = True,
    ) -> dict | list:
        """
        Generate a JSON response from the LLM with auto-parsing.

        Handles markdown-wrapped JSON (```json ... ```),
        plain JSON, and partial extraction.

        Args:
            prompt:         User prompt (should request JSON output).
            system_message: Optional system instruction.
            use_cache:      Whether to use response cache.

        Returns:
            Parsed dict or list. Returns {} on failure.
        """
        if not system_message:
            system_message = "You are a helpful assistant. Return ONLY valid JSON."

        response = await self.generate(
            prompt, system_message, use_cache=use_cache,
        )

        if response.is_empty:
            return {}

        return self._parse_json(response.content)

    # ═══════════════════════════════════════════════════════════
    # GENERATE — Strongly typed (Pydantic)
    # ═══════════════════════════════════════════════════════════

    async def generate_typed(
        self,
        prompt: str,
        response_model: Type[T],
        system_message: str = None,
        use_cache: bool = True,
    ) -> Optional[T]:
        """
        Generate a response and parse it into a Pydantic model.

        Args:
            prompt:          User prompt.
            response_model:  Pydantic model class to parse into.
            system_message:  Optional system instruction.
            use_cache:       Whether to use response cache.

        Returns:
            Instance of response_model, or None on failure.
        """
        data = await self.generate_json(
            prompt, system_message, use_cache=use_cache,
        )

        if not data or not isinstance(data, dict):
            logger.warning(f"Cannot parse into {response_model.__name__}: empty or non-dict response")
            return None

        try:
            return response_model.model_validate(data)
        except Exception as e:
            logger.warning(f"Pydantic validation failed for {response_model.__name__}: {e}")
            return None

    # ═══════════════════════════════════════════════════════════
    # GENERATE — From prompt template
    # ═══════════════════════════════════════════════════════════

    async def generate_from_template(
        self,
        template_name: str,
        system_message: str = None,
        use_cache: bool = True,
        **kwargs,
    ) -> LLMResponse:
        """
        Render a named prompt template and generate a response.

        Args:
            template_name:  Key in prompts.templates (e.g. "ROADMAP_PROMPT").
            system_message: Optional system instruction.
            use_cache:      Whether to use response cache.
            **kwargs:       Variables to format into the template.

        Returns:
            LLMResponse with the generated content.
        """
        from prompts import templates as tmpl

        # Look up the template by name
        attr_name = template_name.upper()
        if not attr_name.endswith("_PROMPT"):
            attr_name = f"{attr_name}_PROMPT"

        template_str = getattr(tmpl, attr_name, None)
        if template_str is None:
            logger.error(f"Prompt template '{attr_name}' not found.")
            return LLMResponse(content="", model=self.model)

        try:
            rendered = template_str.format(**kwargs)
        except KeyError as e:
            logger.error(f"Template '{attr_name}' missing variable: {e}")
            return LLMResponse(content="", model=self.model)

        return await self.generate(
            rendered, system_message, use_cache=use_cache,
        )

    # ═══════════════════════════════════════════════════════════
    # RETRY ENGINE
    # ═══════════════════════════════════════════════════════════

    async def _call_with_retry(
        self,
        messages: list[dict],
        temperature: float,
        max_tokens: int,
    ) -> LLMResponse:
        """
        Call the OpenAI API with exponential backoff retry.

        Retries on rate limits (429), server errors (5xx),
        and timeout errors.

        Args:
            messages:     Chat messages array.
            temperature:  Sampling temperature.
            max_tokens:   Max tokens in response.

        Returns:
            LLMResponse on success, empty response on exhausted retries.
        """
        last_error = None

        if self.provider == "gemini" and self._gemini_api_keys:
            now = time.time()
            if now < self._gemini_cooldown_until:
                # Still cooling down from exhausting every key — don't
                # waste a call, go straight to fallback.
                logger.info(
                    f"Gemini cooldown active for another "
                    f"{self._gemini_cooldown_until - now:.0f}s, skipping call."
                )
                return LLMResponse(content="", model=self.model)
            
            # Reset to first key for any fresh request if not already there
            if self._current_key_index != 0:
                self._current_key_index = 0
                self._gemini_cooldown_until = 0.0
                try:
                    self.gemini_client = genai.Client(api_key=self._gemini_api_keys[0])
                    logger.info("Resetting Gemini client to first API key for fresh request.")
                except Exception as e:
                    logger.error(f"Failed to re-initialize Gemini client: {e}")

        for attempt in range(self.retry_config.max_retries + 1):
            try:
                start_time = time.perf_counter()

                # ── API Call ─────────────────────────────────
                if self.provider == "gemini":
                    response = await self._call_gemini(messages, temperature, max_tokens)
                else:
                    completion = await self.client.chat.completions.create(
                        model=self.model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        timeout=self.timeout,
                    )
                    elapsed_ms = (time.perf_counter() - start_time) * 1000
                    content = completion.choices[0].message.content or ""
                    usage = completion.usage

                    response = LLMResponse(
                        content=content,
                        model=completion.model,
                        prompt_tokens=usage.prompt_tokens if usage else 0,
                        completion_tokens=usage.completion_tokens if usage else 0,
                        total_tokens=usage.total_tokens if usage else 0,
                        latency_ms=round(elapsed_ms, 1),
                    )

                # Ensure elapsed_ms is captured if it was Gemini
                elapsed_ms = (time.perf_counter() - start_time) * 1000
                if response.latency_ms == 0.0:
                    response.latency_ms = round(elapsed_ms, 1)

                # ── Update stats ────────────────────────────
                self.stats.total_tokens_used += response.total_tokens
                self.stats.total_latency_ms += elapsed_ms

                logger.info(
                    f"LLM response: {response.total_tokens} tokens, "
                    f"{response.latency_ms}ms, model={response.model}"
                )
                return response

            except Exception as e:
                last_error = e
                error_name = type(e).__name__

                # ── Key rotation on quota exhaustion ────────
                is_quota_error = (
                    "ResourceExhausted" in error_name
                    or getattr(e, "code", None) == 429
                )
                if is_quota_error and self.provider == "gemini":
                    if self._rotate_gemini_key():
                        self.stats.total_retries += 1
                        # Retry immediately with the new key — no sleep needed
                        continue
                    else:
                        self.stats.total_errors += 1
                        logger.error(
                            "All Gemini API keys exhausted. "
                            "No more keys to rotate. Giving up."
                        )
                        break

                # ── Check if retryable ──────────────────────
                is_retryable = self._is_retryable(e)

                if is_retryable and attempt < self.retry_config.max_retries:
                    delay = self.retry_config.get_delay(attempt)
                    self.stats.total_retries += 1
                    logger.warning(
                        f"LLM call failed ({error_name}), "
                        f"retrying in {delay:.1f}s "
                        f"(attempt {attempt + 1}/{self.retry_config.max_retries})"
                    )
                    await asyncio.sleep(delay)
                else:
                    self.stats.total_errors += 1
                    logger.error(
                        f"LLM call failed permanently after "
                        f"{attempt + 1} attempt(s): {error_name}: {e}"
                    )
                    break

        return LLMResponse(content="", model=self.model)

    def _rotate_gemini_key(self) -> bool:
        """
        Switch to the next available Gemini API key.

        Returns:
            True if a new key was activated, False if all keys are exhausted.
        """
        next_index = self._current_key_index + 1
        if next_index < len(self._gemini_api_keys):
            self._current_key_index = next_index
            new_key = self._gemini_api_keys[next_index]
            self.gemini_client = genai.Client(api_key=new_key)
            logger.warning(
                f"Gemini ResourceExhausted — rotated to API key "
                f"#{next_index + 1} of {len(self._gemini_api_keys)}"
            )
            return True
        logger.error(
            f"All {len(self._gemini_api_keys)} Gemini API key(s) exhausted. "
            f"Falling back for {self._gemini_cooldown_seconds:.0f}s before retrying."
        )
        self._gemini_cooldown_until = time.time() + self._gemini_cooldown_seconds
        return False

    def _is_retryable(self, error: Exception) -> bool:
        """Determine if an error is retryable."""
        error_name = type(error).__name__

        # Timeout errors
        if "timeout" in error_name.lower() or "Timeout" in str(error):
            return True

        # Rate limit / quota — handled via key rotation, still retryable
        if "RateLimitError" in error_name or "ResourceExhausted" in error_name:
            return True
        if getattr(error, "code", None) == 429:
            return True

        # Server errors
        if "APIStatusError" in error_name:
            status = getattr(error, "status_code", 0)
            return status in self.retry_config.retryable_status_codes

        # Gemini / Google API errors (google-genai SDK: ClientError/ServerError,
        # both subclasses of APIError, expose an HTTP `code` attribute)
        if "GoogleAPIError" in error_name or "InternalServerError" in error_name:
            return True
        if "ServerError" in error_name and self.provider == "gemini":
            return True
        if "ClientError" in error_name and getattr(error, "code", 0) in self.retry_config.retryable_status_codes:
            return True

        # Connection errors
        if "APIConnectionError" in error_name or "ConnectionError" in error_name or "ReadError" in error_name:
            return True

        return False

    async def _call_gemini(
        self,
        messages: list[dict],
        temperature: float,
        max_tokens: int,
    ) -> LLMResponse:
        """Call the Gemini API using the google-genai SDK."""

        # Convert OpenAI messages format to Gemini format
        system_instruction = None
        gemini_messages = []

        for msg in messages:
            if msg["role"] == "system":
                system_instruction = msg["content"]
            elif msg["role"] == "user":
                gemini_messages.append(
                    genai_types.Content(role="user", parts=[genai_types.Part(text=msg["content"])])
                )
            elif msg["role"] == "assistant":
                gemini_messages.append(
                    genai_types.Content(role="model", parts=[genai_types.Part(text=msg["content"])])
                )

        generation_config = genai_types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens,
            system_instruction=system_instruction,
        )

        completion = await self.gemini_client.aio.models.generate_content(
            model=self.model,
            contents=gemini_messages,
            config=generation_config,
        )

        content = completion.text or ""

        # Extract token usage if available
        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0
        if getattr(completion, "usage_metadata", None):
            prompt_tokens = completion.usage_metadata.prompt_token_count or 0
            completion_tokens = completion.usage_metadata.candidates_token_count or 0
            total_tokens = completion.usage_metadata.total_token_count or 0

        return LLMResponse(
            content=content,
            model=self.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
        )

    # ═══════════════════════════════════════════════════════════
    # JSON PARSER
    # ═══════════════════════════════════════════════════════════

    @staticmethod
    def _parse_json(text: str) -> dict | list:
        """
        Extract and parse JSON from LLM response text.

        Handles:
            - Clean JSON
            - Markdown-wrapped (```json ... ```)
            - JSON embedded in surrounding text
            - Arrays and objects

        Args:
            text: Raw LLM response text.

        Returns:
            Parsed dict or list. Returns {} on failure.
        """
        if not text or not text.strip():
            return {}

        raw = text.strip()

        # ── Strategy 1: Direct parse ─────────────────────────
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # ── Strategy 2: Extract from markdown code block ─────
        if "```json" in raw:
            try:
                block = raw.split("```json", 1)[1].split("```", 1)[0]
                return json.loads(block.strip())
            except (json.JSONDecodeError, IndexError):
                pass

        if "```" in raw:
            try:
                block = raw.split("```", 1)[1].split("```", 1)[0]
                return json.loads(block.strip())
            except (json.JSONDecodeError, IndexError):
                pass

        # ── Strategy 3: Find JSON object boundaries ──────────
        # Find the first { or [ and match to the last } or ]
        for open_char, close_char in [("{", "}"), ("[", "]")]:
            start = raw.find(open_char)
            end = raw.rfind(close_char)
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(raw[start:end + 1])
                except json.JSONDecodeError:
                    pass

        logger.warning(
            f"Failed to parse JSON from LLM response "
            f"(length={len(raw)}, preview='{raw[:80]}...')"
        )
        return {}

    # ═══════════════════════════════════════════════════════════
    # CACHE MANAGEMENT
    # ═══════════════════════════════════════════════════════════

    def clear_cache(self) -> int:
        """Clear the response cache. Returns number of entries cleared."""
        if self._cache:
            size = self._cache.size
            self._cache.clear()
            logger.info(f"Cache cleared ({size} entries)")
            return size
        return 0

    @property
    def cache_size(self) -> int:
        """Current number of cached responses."""
        return self._cache.size if self._cache else 0

    # ═══════════════════════════════════════════════════════════
    # STATISTICS
    # ═══════════════════════════════════════════════════════════

    def get_stats(self) -> dict:
        """Get usage statistics as a dict."""
        return {
            "is_available": self.is_available,
            "model": self.model,
            "total_requests": self.stats.total_requests,
            "total_cached": self.stats.total_cached,
            "cache_hit_rate": f"{self.stats.cache_hit_rate}%",
            "total_errors": self.stats.total_errors,
            "total_retries": self.stats.total_retries,
            "total_tokens_used": self.stats.total_tokens_used,
            "avg_latency_ms": self.stats.avg_latency_ms,
            "cache_entries": self.cache_size,
        }
