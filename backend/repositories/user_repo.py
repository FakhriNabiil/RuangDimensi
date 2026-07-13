"""User repository — pure DynamoDB CRUD, no business logic."""

from config.aws import get_users_table


def create_user(user_data: dict) -> None:
    """Insert a new user item into the Users table."""
    table = get_users_table()
    table.put_item(Item=user_data)


def get_user_by_username(username: str) -> dict | None:
    """Fetch a single user by Username (PK).

    Returns the item dict or None if not found.
    """
    table = get_users_table()
    response = table.get_item(Key={"Username": username})
    return response.get("Item")
