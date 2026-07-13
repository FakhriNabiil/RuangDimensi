"""EC2 repository — pure describe/tag operations, no business logic."""

from config.aws import get_ec2_client


def list_workers() -> list[dict]:
    """Return raw EC2 instance dicts tagged as asset-worker.

    Returns all worker instances regardless of state (running, stopped,
    pending, etc.) — filtering by state is a service-layer concern.
    """
    client = get_ec2_client()
    response = client.describe_instances(
        Filters=[{"Name": "tag:Purpose", "Values": ["asset-worker"]}]
    )
    instances: list[dict] = []
    for reservation in response["Reservations"]:
        instances.extend(reservation["Instances"])
    return instances


def set_status(instance_id: str, status: str) -> None:
    """Set the ``Status`` tag on a worker instance (idle/busy/error)."""
    client = get_ec2_client()
    client.create_tags(
        Resources=[instance_id],
        Tags=[{"Key": "Status", "Value": status}],
    )


def extract_tags(instance: dict) -> dict:
    """Flatten an EC2 instance's ``Tags`` list into a ``{Key: Value}`` dict."""
    return {t["Key"]: t["Value"] for t in instance.get("Tags", [])}
