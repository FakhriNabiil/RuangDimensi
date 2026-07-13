"""Asset controller — HTTP endpoints for asset CRUD.

This module ONLY handles request parsing and response formatting.
All business logic lives in services.asset_service.
"""

from flask import Blueprint, request
from middleware.auth_middleware import token_required
from services import asset_service
from utils.response import success_response

asset_bp = Blueprint("assets", __name__)


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------

@asset_bp.route("/api/assets", methods=["GET"])
def list_assets():
    """Browse marketplace assets with optional filtering/sorting.

    Query params: ?category=&search=&sort=newest|oldest|price_asc|price_desc
    """
    category = request.args.get("category")
    search = request.args.get("search")
    sort = request.args.get("sort")

    result = asset_service.get_all_assets(category=category, search=search, sort=sort)
    return success_response(result)


@asset_bp.route("/api/assets/<asset_id>", methods=["GET"])
def get_asset(asset_id: str):
    """Get a single asset by ID."""
    result = asset_service.get_asset(asset_id)
    return success_response(result)


# ---------------------------------------------------------------------------
# Protected endpoints
# ---------------------------------------------------------------------------

@asset_bp.route("/api/assets", methods=["POST"])
@token_required
def create_asset(current_user: str):
    """Upload a new asset (multipart/form-data).

    Form fields: NamaAset, Deskripsi, Kategori, HargaJuta
    Files: thumbnail, file3d
    """
    data = {
        "NamaAset": request.form.get("NamaAset", ""),
        "Deskripsi": request.form.get("Deskripsi", ""),
        "Kategori": request.form.get("Kategori", ""),
        "HargaJuta": request.form.get("HargaJuta", "0"),
    }
    # Convert HargaJuta to float
    try:
        data["HargaJuta"] = float(data["HargaJuta"])
    except (ValueError, TypeError):
        data["HargaJuta"] = 0

    thumbnail = request.files.get("thumbnail")
    file_3d = request.files.get("file3d")

    result = asset_service.create_asset(
        current_user=current_user,
        data=data,
        thumbnail_file=thumbnail,
        file_3d=file_3d,
    )
    return success_response(result, 201)


@asset_bp.route("/api/assets/<asset_id>", methods=["PUT"])
@token_required
def update_asset(current_user: str, asset_id: str):
    """Update an existing asset (multipart/form-data).

    Ownership is checked in the service layer.
    """
    data = {}
    if request.form.get("NamaAset"):
        data["NamaAset"] = request.form["NamaAset"]
    if request.form.get("Deskripsi") is not None:
        data["Deskripsi"] = request.form["Deskripsi"]
    if request.form.get("Kategori"):
        data["Kategori"] = request.form["Kategori"]
    if request.form.get("HargaJuta"):
        try:
            data["HargaJuta"] = float(request.form["HargaJuta"])
        except (ValueError, TypeError):
            pass

    thumbnail = request.files.get("thumbnail")
    file_3d = request.files.get("file3d")


    result = asset_service.update_asset(
        current_user=current_user,
        asset_id=asset_id,
        data=data,
        thumbnail_file=thumbnail,
        file_3d=file_3d,
    )
    
    return success_response(result)


@asset_bp.route("/api/assets/<asset_id>", methods=["DELETE"])
@token_required
def delete_asset(current_user: str, asset_id: str):
    """Delete an asset and its S3 files.

    Ownership is checked in the service layer.
    """
    asset_service.delete_asset(current_user, asset_id)
    return success_response({"message": "Asset deleted successfully"})


@asset_bp.route("/api/my-assets", methods=["GET"])
@token_required
def my_assets(current_user: str):
    """List all assets owned by the authenticated user (via GSI)."""
    result = asset_service.get_my_assets(current_user)
    return success_response(result)
