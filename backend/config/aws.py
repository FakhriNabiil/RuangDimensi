"""AWS resource initialisation — DynamoDB tables and S3 client."""

import boto3
from config.settings import settings

_common_kwargs: dict = {
    "region_name": settings.AWS_REGION,
    "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
    "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
}

if settings.AWS_ENDPOINT_URL:
    _common_kwargs["endpoint_url"] = settings.AWS_ENDPOINT_URL


# ---------------------------------------------------------------------------
# DynamoDB
# ---------------------------------------------------------------------------
_dynamodb_resource = boto3.resource("dynamodb", **_common_kwargs)


def get_users_table():
    """Return the Users DynamoDB Table resource."""
    return _dynamodb_resource.Table(settings.DYNAMODB_USERS_TABLE)


def get_assets_table():
    """Return the Assets DynamoDB Table resource."""
    return _dynamodb_resource.Table(settings.DYNAMODB_ASSETS_TABLE)


def get_cart_table():
    """Return the Cart DynamoDB Table resource."""
    return _dynamodb_resource.Table(settings.DYNAMODB_CART_TABLE)


def get_orders_table():
    """Return the Orders DynamoDB Table resource."""
    return _dynamodb_resource.Table(settings.DYNAMODB_ORDERS_TABLE)


# ---------------------------------------------------------------------------
# S3
# ---------------------------------------------------------------------------
_s3_client = boto3.client("s3", **_common_kwargs)


def get_s3_client():
    """Return the shared S3 client."""
    return _s3_client


# ---------------------------------------------------------------------------
# EC2 (worker simulation)
# ---------------------------------------------------------------------------
_ec2_client = boto3.client("ec2", **_common_kwargs)


def get_ec2_client():
    """Return the shared EC2 client."""
    return _ec2_client


def init_infrastructure() -> None:
    """Ensure S3 bucket, DynamoDB tables, and worker EC2 instances exist.

    Safe to call on every app start — every step checks for existence
    first, so re-running never duplicates resources.
    """
    _init_storage()
    _init_workers()


def _init_storage() -> None:
    """Create the S3 bucket and DynamoDB tables if they don't exist yet."""
    s3 = get_s3_client()
    try:
        s3.create_bucket(Bucket=settings.S3_BUCKET_NAME)
    except s3.exceptions.BucketAlreadyOwnedByYou:
        pass

    existing_tables = [t.name for t in _dynamodb_resource.tables.all()]

    if settings.DYNAMODB_USERS_TABLE not in existing_tables:
        _dynamodb_resource.create_table(
            TableName=settings.DYNAMODB_USERS_TABLE,
            KeySchema=[{"AttributeName": "Username", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "Username", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )

    if settings.DYNAMODB_ASSETS_TABLE not in existing_tables:
        _dynamodb_resource.create_table(
            TableName=settings.DYNAMODB_ASSETS_TABLE,
            KeySchema=[{"AttributeName": "AssetID", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "AssetID", "AttributeType": "S"},
                {"AttributeName": "OwnerUsername", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "OwnerUsername-index",
                    "KeySchema": [{"AttributeName": "OwnerUsername", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            BillingMode="PAY_PER_REQUEST",
        )

    if settings.DYNAMODB_CART_TABLE not in existing_tables:
        # Composite key: one item per (Username, AssetID) pair = one cart line.
        _dynamodb_resource.create_table(
            TableName=settings.DYNAMODB_CART_TABLE,
            KeySchema=[
                {"AttributeName": "Username", "KeyType": "HASH"},
                {"AttributeName": "AssetID", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "Username", "AttributeType": "S"},
                {"AttributeName": "AssetID", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

    if settings.DYNAMODB_ORDERS_TABLE not in existing_tables:
        _dynamodb_resource.create_table(
            TableName=settings.DYNAMODB_ORDERS_TABLE,
            KeySchema=[{"AttributeName": "OrderID", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "OrderID", "AttributeType": "S"},
                {"AttributeName": "Username", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "Username-index",
                    "KeySchema": [{"AttributeName": "Username", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                }
            ],
            BillingMode="PAY_PER_REQUEST",
        )


def _init_workers() -> None:
    """Create a VPC/subnet plus N worker EC2 instances, tagged for discovery.

    Idempotent: counts existing instances tagged ``Purpose=asset-worker``
    before creating more, so restarting the app never piles up instances.
    """
    ec2 = get_ec2_client()

    existing = ec2.describe_instances(
        Filters=[
            {"Name": "tag:Purpose", "Values": ["asset-worker"]},
            {"Name": "instance-state-name", "Values": ["running", "pending"]},
        ]
    )
    already_running = sum(len(r["Instances"]) for r in existing["Reservations"])
    if already_running >= settings.WORKER_COUNT:
        return

    vpc_id = ec2.create_vpc(CidrBlock="10.0.0.0/16")["Vpc"]["VpcId"]
    subnet_id = ec2.create_subnet(
        VpcId=vpc_id,
        CidrBlock="10.0.1.0/24",
        AvailabilityZone=f"{settings.AWS_REGION}a",
    )["Subnet"]["SubnetId"]

    for i in range(settings.WORKER_COUNT - already_running):
        ec2.run_instances(
            ImageId="ami-mock-ubuntu",
            InstanceType="t2.micro",
            MinCount=1,
            MaxCount=1,
            SubnetId=subnet_id,
            TagSpecifications=[{
                "ResourceType": "instance",
                "Tags": [
                    {"Key": "Name", "Value": f"asset-worker-{already_running + i + 1}"},
                    {"Key": "Purpose", "Value": "asset-worker"},
                    {"Key": "Status", "Value": "idle"},
                ],
            }],
        )
