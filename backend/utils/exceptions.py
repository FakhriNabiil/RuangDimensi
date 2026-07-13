"""Custom exception hierarchy.

Services raise these; the global error handler in app.py converts them into
standardised JSON responses via utils.response.
"""


class AppError(Exception):
    """Base application error."""

    status_code: int = 400
    code: str = "BAD_REQUEST"

    def __init__(self, message: str = "Bad request"):
        super().__init__(message)
        self.message = message


class ValidationError(AppError):
    """Input validation failure."""

    status_code = 400
    code = "VALIDATION_ERROR"

    def __init__(self, message: str = "Validation failed"):
        super().__init__(message)


class UnauthorizedError(AppError):
    """Authentication failure (missing / invalid / expired token)."""

    status_code = 401
    code = "UNAUTHORIZED"

    def __init__(self, message: str = "Authentication required"):
        super().__init__(message)


class ForbiddenError(AppError):
    """Authorisation failure (e.g. not the asset owner)."""

    status_code = 403
    code = "FORBIDDEN"

    def __init__(self, message: str = "You do not have permission"):
        super().__init__(message)


class NotFoundError(AppError):
    """Resource not found."""

    status_code = 404
    code = "NOT_FOUND"

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message)


class ConflictError(AppError):
    """Duplicate resource (e.g. username already exists)."""

    status_code = 409
    code = "CONFLICT"

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message)


class ServiceUnavailableError(AppError):
    """A dependent service/resource is temporarily unavailable (e.g. no
    EC2 worker instances)."""

    status_code = 503
    code = "SERVICE_UNAVAILABLE"

    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(message)
