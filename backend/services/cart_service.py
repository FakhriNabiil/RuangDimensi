"""Cart service — business logic for the shopping cart.

The Cart table only stores (Username, AssetID, AddedAt) references — never a
price/name snapshot — so it always reflects the asset's current price. The
snapshot only happens at checkout time, when it's baked into the Order.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from repositories import asset_repo, cart_repo, order_repo
from services.asset_service import _convert_decimals, _attach_presigned_urls
from utils.exceptions import ConflictError, NotFoundError, ValidationError


def _get_cart_lines_with_assets(username: str) -> list[dict]:
    """Join raw cart lines with their current asset data.

    Lines pointing at an asset that's since been deleted are dropped
    silently — there's nothing left to show or buy.
    """
    lines = cart_repo.get_items_by_user(username)
    lines.sort(key=lambda l: l.get("AddedAt", ""))

    result = []
    for line in lines:
        asset = asset_repo.get_asset_by_id(line["AssetID"])
        if not asset:
            continue
        asset = _convert_decimals(_attach_presigned_urls(asset))
        result.append({**asset, "AddedAt": line.get("AddedAt")})
    return result


def get_cart(username: str) -> dict:
    """Return the current user's cart items plus the running total."""
    items = _get_cart_lines_with_assets(username)
    total = sum(float(item.get("HargaJuta", 0)) for item in items)
    return {"items": items, "itemCount": len(items), "totalHargaJuta": total}


def add_to_cart(username: str, asset_id: str) -> dict:
    """Add an asset to the user's cart.

    Rejects: asset that doesn't exist, the user's own asset (can't buy your
    own listing), and an asset already sitting in the cart.
    """
    asset = asset_repo.get_asset_by_id(asset_id)
    if not asset:
        raise NotFoundError(f"Asset '{asset_id}' not found")

    if asset["OwnerUsername"] == username:
        raise ValidationError("Kamu tidak bisa membeli aset milik sendiri")

    if cart_repo.get_item(username, asset_id):
        raise ConflictError("Aset ini sudah ada di keranjang")

    now = datetime.now(timezone.utc).isoformat()
    cart_repo.add_item(username, asset_id, now)
    return get_cart(username)


def remove_from_cart(username: str, asset_id: str) -> dict:
    """Remove a single line from the user's cart."""
    if not cart_repo.get_item(username, asset_id):
        raise NotFoundError("Aset tidak ada di keranjang")
    cart_repo.remove_item(username, asset_id)
    return get_cart(username)


def clear_cart(username: str) -> dict:
    """Empty the user's entire cart."""
    cart_repo.clear_cart(username)
    return get_cart(username)


def checkout(username: str) -> dict:
    """Turn the current cart into an Order, then empty the cart.

    Order items are a frozen price/name snapshot at purchase time, so later
    edits or deletions of the source asset never rewrite purchase history.
    """
    items = _get_cart_lines_with_assets(username)
    if not items:
        raise ValidationError("Keranjang kosong")

    order_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    order_items = [
        {
            "AssetID": item["AssetID"],
            "NamaAset": item.get("NamaAset", ""),
            "OwnerUsername": item.get("OwnerUsername"),
            "HargaJuta": Decimal(str(item.get("HargaJuta", 0))),
        }
        for item in items
    ]
    total = sum(float(i["HargaJuta"]) for i in order_items)

    order_item = {
        "OrderID": order_id,
        "Username": username,
        "Items": order_items,
        "TotalHargaJuta": Decimal(str(total)),
        "Status": "completed",
        "CreatedAt": now,
    }
    order_repo.create_order(order_item)
    cart_repo.clear_cart(username)

    return _convert_decimals(order_item)


def get_my_orders(username: str) -> list[dict]:
    """Return the user's purchase history, newest first."""
    orders = order_repo.get_orders_by_user(username)
    orders.sort(key=lambda o: o.get("CreatedAt", ""), reverse=True)
    return [_convert_decimals(o) for o in orders]


def get_order(username: str, order_id: str) -> dict:
    """Fetch a single order — must belong to the requesting user."""
    order = order_repo.get_order_by_id(order_id)
    if not order or order.get("Username") != username:
        raise NotFoundError(f"Order '{order_id}' not found")
    return _convert_decimals(order)
