"""Order controller — HTTP endpoints for purchase history.

This module ONLY handles request parsing and response formatting.
All business logic lives in services.cart_service.
"""

from flask import Blueprint
from middleware.auth_middleware import token_required
from services import cart_service
from utils.response import success_response

order_bp = Blueprint("orders", __name__)


@order_bp.route("/api/orders", methods=["GET"])
@token_required
def list_orders(current_user: str):
    """List the authenticated user's purchase history, newest first."""
    result = cart_service.get_my_orders(current_user)
    return success_response(result)


@order_bp.route("/api/orders/<order_id>", methods=["GET"])
@token_required
def get_order(current_user: str, order_id: str):
    """Get a single order — must belong to the authenticated user."""
    result = cart_service.get_order(current_user, order_id)
    return success_response(result)
