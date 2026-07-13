"""S3 repository — pure object-storage operations, no business logic."""

from config.aws import get_s3_client
from config.settings import settings


def upload_file(file_obj, key: str, content_type: str) -> None:
    """Upload a file-like object to S3.

    Parameters
    ----------
    file_obj : file-like
        The file data (e.g. ``request.files['thumbnail']``).
    key : str
        The S3 object key (path inside the bucket).
    content_type : str
        MIME type to set on the object.
    """
    client = get_s3_client()
    client.upload_fileobj(
        file_obj,
        settings.S3_BUCKET_NAME,
        key,
        ExtraArgs={"ContentType": content_type},
    )


def delete_file(key: str) -> None:
    """Delete a single object from S3."""
    client = get_s3_client()
    client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)


def generate_presigned_url(key: str, expiry: int = 3600) -> str:
    """Generate a time-limited presigned URL for GET access.

    Parameters
    ----------
    key : str
        The S3 object key.
    expiry : int
        URL validity in seconds (default 1 hour).

    Returns
    -------
    str
        The presigned URL.
    """
    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expiry,
    )
