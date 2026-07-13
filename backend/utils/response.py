"""Standardised API response helpers.

Every endpoint MUST use these helpers so the frontend receives a consistent
shape:

    Success → {"success": true,  "data": { ... }}
    Error   → {"success": false, "error": {"code": "...", "message": "..."}}
"""

from flask import jsonify


def success_response(data, status_code: int = 200):
    """Return a success JSON response."""
    return jsonify({"success": True, "data": data}), status_code


def error_response(code: str, message: str, status_code: int = 400):
    """Return an error JSON response."""
    return (
        jsonify({"success": False, "error": {"code": code, "message": message}}),
        status_code,
    )
