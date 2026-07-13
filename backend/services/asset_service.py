"""Asset service — business logic for asset CRUD.

Handles validation, ownership checks, S3 orchestration, and presigned URL
generation.  NEVER touches Flask request/response objects.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from pydantic import ValidationError as PydanticValidationError

from config.settings import settings
from repositories import asset_repo, s3_repo
from services import worker_service
from services.validators import AssetCreateInput, AssetUpdateInput
from utils.exceptions import (
    ForbiddenError,
    NotFoundError,
    ValidationError,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _attach_presigned_urls(asset: dict) -> dict:

    if asset.get("ThumbnailKey"):
        asset["ThumbnailURL"] = s3_repo.generate_presigned_url(asset["ThumbnailKey"])
    if asset.get("File3DKey"):
        asset["File3DURL"] = s3_repo.generate_presigned_url(asset["File3DKey"])
    return asset


def _validate_file(file_obj, allowed_types: set[str], max_size: int, label: str):
    if file_obj is None:
        return

    content_type = file_obj.content_type or ""
    if content_type not in allowed_types:
        raise ValidationError(
            f"{label}: unsupported file type '{content_type}'. "
            f"Allowed: {', '.join(allowed_types)}"
        )

    # Check size by seeking to end
    file_obj.seek(0, 2)  # seek to end
    size = file_obj.tell()
    file_obj.seek(0)     # reset
    if size > max_size:
        raise ValidationError(
            f"{label}: file too large ({size / 1024 / 1024:.1f} MB). "
            f"Max: {max_size / 1024 / 1024:.0f} MB"
        )


def _convert_decimals(item: dict) -> dict:
    """Convert DynamoDB Decimal values to int/float for JSON serialisation."""
    result = {}
    for k, v in item.items():
        if isinstance(v, Decimal):
            result[k] = float(v) if v % 1 else int(v)
        else:
            result[k] = v
    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def create_asset(
    current_user: str,
    data: dict,
    thumbnail_file=None,
    file_3d=None,
) -> dict:
    """Create a new asset with uploaded files.

    Returns the created asset data.
    """
    # Validate metadata
    try:
        validated = AssetCreateInput(**data)
    except PydanticValidationError as e:
        raise ValidationError(str(e.errors()[0]["msg"]))

    # Validate files
    _validate_file(
        thumbnail_file,
        settings.ALLOWED_THUMBNAIL_TYPES,
        settings.MAX_THUMBNAIL_SIZE,
        "Thumbnail",
    )
    _validate_file(
        file_3d,
        settings.ALLOWED_3D_TYPES,
        settings.MAX_FILE3D_SIZE,
        "3D File",
    )

    asset_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    # Upload files to S3, "processed" via a simulated EC2 worker
    thumbnail_key = ""
    file_3d_key = ""

    def _upload_files():
        nonlocal thumbnail_key, file_3d_key
        if thumbnail_file:
            thumbnail_key = f"thumbnails/{asset_id}/{thumbnail_file.filename}"
            s3_repo.upload_file(thumbnail_file, thumbnail_key, thumbnail_file.content_type)
        if file_3d:
            file_3d_key = f"models/{asset_id}/{file_3d.filename}"
            s3_repo.upload_file(file_3d, file_3d_key, file_3d.content_type)

    processed_by, _ = worker_service.run_job(_upload_files)

    # Build DynamoDB item
    asset_item = {
        "AssetID": asset_id,
        "OwnerUsername": current_user,
        "NamaAset": validated.NamaAset,
        "Deskripsi": validated.Deskripsi,
        "Kategori": validated.Kategori.value,
        "HargaJuta": Decimal(str(validated.HargaJuta)),
        "ThumbnailKey": thumbnail_key,
        "File3DKey": file_3d_key,
        "ProcessedByWorker": processed_by,
        "CreatedAt": now,
        "UpdatedAt": now,
    }
    asset_repo.create_asset(asset_item)

    return _convert_decimals(_attach_presigned_urls(asset_item))


def get_asset(asset_id: str) -> dict:
    """Fetch a single asset by ID, with presigned URLs."""
    asset = asset_repo.get_asset_by_id(asset_id)
    if not asset:
        raise NotFoundError(f"Asset '{asset_id}' not found")
    return _convert_decimals(_attach_presigned_urls(asset))


def get_all_assets(
    category: str | None = None,
    search: str | None = None,
    sort: str | None = None,
) -> list[dict]:
    
    items = asset_repo.get_all_assets()

    # Filter by category
    if category:
        items = [a for a in items if a.get("Kategori") == category]

    # Search by name (case-insensitive substring)
    if search:
        search_lower = search.lower()
        items = [
            a for a in items
            if search_lower in a.get("NamaAset", "").lower()
            or search_lower in a.get("Deskripsi", "").lower()
        ]

    # Sort
    if sort == "price_asc":
        items.sort(key=lambda a: float(a.get("HargaJuta", 0)))
    elif sort == "price_desc":
        items.sort(key=lambda a: float(a.get("HargaJuta", 0)), reverse=True)
    elif sort == "oldest":
        items.sort(key=lambda a: a.get("CreatedAt", ""))
    else:
        # Default: newest first
        items.sort(key=lambda a: a.get("CreatedAt", ""), reverse=True)

    return [_convert_decimals(_attach_presigned_urls(a)) for a in items]


def get_my_assets(username: str) -> list[dict]:
    """Fetch assets owned by the current user (via GSI)."""
    items = asset_repo.get_assets_by_owner(username)
    items.sort(key=lambda a: a.get("CreatedAt", ""), reverse=True)
    return [_convert_decimals(_attach_presigned_urls(a)) for a in items]


def update_asset(
    current_user: str,
    asset_id: str,
    data: dict,
    thumbnail_file=None,
    file_3d=None,
) -> dict:
    """Update an existing asset.  Ownership check is mandatory."""
    asset = asset_repo.get_asset_by_id(asset_id)
    if not asset:
        raise NotFoundError(f"Asset '{asset_id}' not found")

    # Ownership check
    if asset["OwnerUsername"] != current_user:
        raise ForbiddenError("You are not the owner of this asset")

    # Validate metadata (only provided fields)
    try:
        validated = AssetUpdateInput(**data)
    except PydanticValidationError as e:
        raise ValidationError(str(e.errors()[0]["msg"]))

    updates: dict = {}
    if validated.NamaAset is not None:
        updates["NamaAset"] = validated.NamaAset
    if validated.Deskripsi is not None:
        updates["Deskripsi"] = validated.Deskripsi
    if validated.Kategori is not None:
        updates["Kategori"] = validated.Kategori.value
    if validated.HargaJuta is not None:
        updates["HargaJuta"] = Decimal(str(validated.HargaJuta))

    # Handle file replacements
    if thumbnail_file:
        _validate_file(
            thumbnail_file,
            settings.ALLOWED_THUMBNAIL_TYPES,
            settings.MAX_THUMBNAIL_SIZE,
            "Thumbnail",
        )
        # Delete old file
        if asset.get("ThumbnailKey"):
            s3_repo.delete_file(asset["ThumbnailKey"])
        new_key = f"thumbnails/{asset_id}/{thumbnail_file.filename}"
        s3_repo.upload_file(thumbnail_file, new_key, thumbnail_file.content_type)
        updates["ThumbnailKey"] = new_key

    if file_3d:
        _validate_file(
            file_3d,
            settings.ALLOWED_3D_TYPES,
            settings.MAX_FILE3D_SIZE,
            "3D File",
        )
        if asset.get("File3DKey"):
            s3_repo.delete_file(asset["File3DKey"])
        new_key = f"models/{asset_id}/{file_3d.filename}"
        s3_repo.upload_file(file_3d, new_key, file_3d.content_type)
        updates["File3DKey"] = new_key


    if updates:
        updates["UpdatedAt"] = datetime.now(timezone.utc).isoformat()
        asset_repo.update_asset(asset_id, updates)

    # Return full updated asset
    return get_asset(asset_id)


def delete_asset(current_user: str, asset_id: str) -> None:
    """Delete an asset and its S3 files.  Ownership check is mandatory."""
    asset = asset_repo.get_asset_by_id(asset_id)
    if not asset:
        raise NotFoundError(f"Asset '{asset_id}' not found")

    # Ownership check
    if asset["OwnerUsername"] != current_user:
        raise ForbiddenError("You are not the owner of this asset")

    # Delete S3 files
    if asset.get("ThumbnailKey"):
        s3_repo.delete_file(asset["ThumbnailKey"])
    if asset.get("File3DKey"):
        s3_repo.delete_file(asset["File3DKey"])

    # Delete DynamoDB item
    asset_repo.delete_asset(asset_id)
