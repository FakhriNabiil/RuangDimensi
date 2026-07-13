"""Auth controller — HTTP endpoints for registration and login.

This module ONLY handles request parsing and response formatting.
All business logic lives in services.auth_service.
"""

from flask import Blueprint, request
from services import auth_service
from utils.response import success_response

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/register", methods=["POST"])
def register():
    """Register a new user.

    Body (JSON): {"username": "...", "email": "...", "password": "..."}
    """
    data = request.get_json(force=True, silent=True) or {}
    result = auth_service.register_user(data)
    return success_response(result, 201)


@auth_bp.route("/api/login", methods=["POST"])
def login():
    """Authenticate and return a JWT.

    Body (JSON): {"username": "...", "password": "..."}
    Returns: {"token": "...", "username": "..."}
    """
    data = request.get_json(force=True, silent=True) or {}
    result = auth_service.login_user(data)
    return success_response(result)
