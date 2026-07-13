"""Application settings loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Centralised application configuration."""

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me")
    JWT_EXPIRY_HOURS: int = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

    # AWS / MiniStack
    AWS_ENDPOINT_URL: str | None = os.getenv("AWS_ENDPOINT_URL")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "test")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "test")

    # DynamoDB
    DYNAMODB_USERS_TABLE: str = os.getenv("DYNAMODB_USERS_TABLE", "Users")
    DYNAMODB_ASSETS_TABLE: str = os.getenv("DYNAMODB_ASSETS_TABLE", "Assets")
    DYNAMODB_KATEGORI_TABLE: str = os.getenv("DYNAMO_KATEGORI_TABLE", "Kategori")
    DYNAMODB_CART_TABLE: str = os.getenv("DYNAMODB_CART_TABLE", "Cart")
    DYNAMODB_ORDERS_TABLE: str = os.getenv("DYNAMODB_ORDERS_TABLE", "Orders")

    # S3
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "3D_Assets_Store")

    # Upload limits
    MAX_THUMBNAIL_SIZE: int = 5 * 1024 * 1024    # 5 MB
    MAX_FILE3D_SIZE: int = 50 * 1024 * 1024       # 50 MB

    ALLOWED_THUMBNAIL_TYPES: set[str] = {"image/jpeg", "image/png", "image/webp"}
    ALLOWED_3D_TYPES: set[str] = {
        "model/gltf-binary",
        "application/octet-stream",
        "application/x-blender",
    }

    # EC2 worker simulation
    WORKER_COUNT: int = int(os.getenv("WORKER_COUNT", "3"))
    WORKER_FAULT_RATE: float = float(os.getenv("WORKER_FAULT_RATE", "0.2"))


settings = Settings()
