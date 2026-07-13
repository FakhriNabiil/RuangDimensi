"""Cart controller — HTTP endpoints for the shopping cart.

This module ONLY handles request parsing and response formatting.
All business logic lives in services.cart_service.
"""

from flask import Blueprint
from middleware.auth_middleware import token_required
from services import cart_service
from utils.response import success_response

cart_bp = Blueprint("cart", __name__)


@cart_bp.route("/api/cart", methods=["GET"])
@token_required
def get_cart(current_user: str):
    """Get the authenticated user's cart, with live prices."""
    result = cart_service.get_cart(current_user)
    return success_response(result)


@cart_bp.route("/api/cart/<asset_id>", methods=["POST"])
@token_required
def add_to_cart(current_user: str, asset_id: str):
    """Add an asset to the authenticated user's cart."""
    result = cart_service.add_to_cart(current_user, asset_id)
    return success_response(result, 201)


@cart_bp.route("/api/cart/<asset_id>", methods=["DELETE"])
@token_required
def remove_from_cart(current_user: str, asset_id: str):
    """Remove a single asset from the authenticated user's cart."""
    result = cart_service.remove_from_cart(current_user, asset_id)
    return success_response(result)


@cart_bp.route("/api/cart", methods=["DELETE"])
@token_required
def clear_cart(current_user: str):
    """Empty the authenticated user's entire cart."""
    result = cart_service.clear_cart(current_user)
    return success_response(result)


@cart_bp.route("/api/cart/checkout", methods=["POST"])
@token_required
def checkout(current_user: str):
    """Turn the current cart into an Order and empty the cart."""
    result = cart_service.checkout(current_user)
    return success_response(result, 201)
