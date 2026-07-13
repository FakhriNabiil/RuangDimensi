"""JWT authentication middleware.

Provides the ``@token_required`` decorator used by protected endpoints.
"""

from functools import wraps
from flask import request
from services.auth_service import decode_token
from utils.exceptions import UnauthorizedError


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise UnauthorizedError("Missing or malformed Authorization header")

        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)  # raises UnauthorizedError on failure
        current_user: str = payload["username"]

        return f(current_user, *args, **kwargs)

    return decorated
