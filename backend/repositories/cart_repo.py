"""Cart repository — pure DynamoDB CRUD, no business logic.

One item per (Username, AssetID) pair represents one line in a user's cart.
"""

from boto3.dynamodb.conditions import Key
from config.aws import get_cart_table


def add_item(username: str, asset_id: str, added_at: str) -> None:
    """Insert (or overwrite) a cart line for this user/asset pair."""
    table = get_cart_table()
    table.put_item(Item={"Username": username, "AssetID": asset_id, "AddedAt": added_at})


def get_item(username: str, asset_id: str) -> dict | None:
    """Fetch a single cart line, or None if the asset isn't in the cart."""
    table = get_cart_table()
    response = table.get_item(Key={"Username": username, "AssetID": asset_id})
    return response.get("Item")


def get_items_by_user(username: str) -> list[dict]:
    """Query all cart lines belonging to a user (PK query, cheap)."""
    table = get_cart_table()
    response = table.query(KeyConditionExpression=Key("Username").eq(username))
    return response.get("Items", [])


def remove_item(username: str, asset_id: str) -> None:
    """Delete a single cart line."""
    table = get_cart_table()
    table.delete_item(Key={"Username": username, "AssetID": asset_id})


def clear_cart(username: str) -> None:
    """Delete every cart line belonging to a user (used after checkout)."""
    table = get_cart_table()
    items = get_items_by_user(username)
    with table.batch_writer() as batch:
        for item in items:
            batch.delete_item(Key={"Username": username, "AssetID": item["AssetID"]})
