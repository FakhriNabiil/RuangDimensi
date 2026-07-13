"""Asset repository — pure DynamoDB CRUD, no business logic."""

from boto3.dynamodb.conditions import Key
from config.aws import get_assets_table


def create_asset(asset_data: dict) -> None:
    """Insert a new asset item into the Assets table."""
    table = get_assets_table()
    table.put_item(Item=asset_data)


def get_asset_by_id(asset_id: str) -> dict | None:
    """Fetch a single asset by AssetID (PK).

    Returns the item dict or None if not found.
    """
    table = get_assets_table()
    response = table.get_item(
        Key={"AssetID": asset_id}, 
        ConsistentRead=True
    )
    return response.get("Item")


def get_assets_by_owner(owner_username: str) -> list[dict]:
    """Query assets owned by a specific user via the GSI."""
    table = get_assets_table()
    response = table.query(
        IndexName="OwnerUsername-index",
        KeyConditionExpression=Key("OwnerUsername").eq(owner_username),
    )
    return response.get("Items", [])


def get_all_assets() -> list[dict]:
    """Scan the entire Assets table (for marketplace browse).

    Note: scan is acceptable here because the browse page needs all items
    and filtering/sorting happens in the service layer.
    """
    table = get_assets_table()
    items: list[dict] = []
    response = table.scan()
    items.extend(response.get("Items", []))

    # Handle pagination for large datasets
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    return items


def update_asset(asset_id: str, updates: dict) -> None:
    """Update specific attributes of an asset.

    Parameters
    ----------
    asset_id : str
        The AssetID (PK) of the asset to update.
    updates : dict
        Key-value pairs of attributes to update.
    """
    table = get_assets_table()

    expr_parts: list[str] = []
    expr_names: dict[str, str] = {}
    expr_values: dict[str, object] = {}

    for i, (key, value) in enumerate(updates.items()):
        placeholder_name = f"#attr{i}"
        placeholder_value = f":val{i}"
        expr_parts.append(f"{placeholder_name} = {placeholder_value}")
        expr_names[placeholder_name] = key
        expr_values[placeholder_value] = value

    table.update_item(
        Key={"AssetID": asset_id},
        UpdateExpression="SET " + ", ".join(expr_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )


def delete_asset(asset_id: str) -> None:
    """Delete an asset item by AssetID (PK)."""
    table = get_assets_table()
    table.delete_item(Key={"AssetID": asset_id})
