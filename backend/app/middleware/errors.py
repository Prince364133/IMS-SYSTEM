from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger(__name__)

async def global_exception_handler(request: Request, exc: Exception):
    """
    Standardizes all unhandled exceptions into a consistent JSON format.
    """
    if isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "HTTPException",
                "message": exc.detail,
                "status_code": exc.status_code
            },
        )

    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "ValidationError",
                "message": "Validation failed for the request body or parameters.",
                "detail": exc.errors(),
                "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY
            },
        )

    # General fallback for unexpected system errors
    logger.exception(f"Unhandled exception occurred: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred on the server.",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR
        },
    )
