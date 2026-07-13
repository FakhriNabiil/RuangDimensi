"""Order repository — pure DynamoDB CRUD, no business logic."""

from boto3.dynamodb.conditions import Key
from config.aws import get_orders_table


def create_order(order_data: dict) -> None:
    """Insert a new order item into the Orders table."""
    table = get_orders_table()
    table.put_item(Item=order_data)


def get_order_by_id(order_id: str) -> dict | None:
    """Fetch a single order by OrderID (PK)."""
    table = get_orders_table()
    response = table.get_item(Key={"OrderID": order_id})
    return response.get("Item")


def get_orders_by_user(username: str) -> list[dict]:
    """Query all orders placed by a user via the Username-index GSI."""
    table = get_orders_table()
    response = table.query(
        IndexName="Username-index",
        KeyConditionExpression=Key("Username").eq(username),
    )
    return response.get("Items", [])
