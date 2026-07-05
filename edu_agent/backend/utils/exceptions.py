"""
Utility: Custom Exception Classes
Centralized error definitions for consistent error handling across the app.
"""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception."""

    def __init__(self, detail: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(status_code=status_code, detail=detail)


class LLMUnavailableError(AppException):
    """Raised when the LLM service is not configured or unreachable."""

    def __init__(self, detail: str = "LLM service is not available. Configure OPENAI_API_KEY."):
        super().__init__(detail=detail, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


class ResourceNotFoundError(AppException):
    """Raised when a requested resource is not found."""

    def __init__(self, resource: str, identifier: str = ""):
        detail = f"{resource} not found"
        if identifier:
            detail = f"{resource} '{identifier}' not found"
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)


class ValidationError(AppException):
    """Raised when input validation fails beyond Pydantic checks."""

    def __init__(self, detail: str = "Invalid input provided."):
        super().__init__(detail=detail, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class ExportError(AppException):
    """Raised when document export (PDF, HTML) fails."""

    def __init__(self, format: str = "PDF", detail: str = ""):
        msg = f"{format} export failed"
        if detail:
            msg = f"{msg}: {detail}"
        super().__init__(detail=msg, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
