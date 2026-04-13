import boto3
from ..config import settings

_s3_client = None

def get_s3_client():
    """Get a reusable boto3 S3 client."""
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
        )
    return _s3_client

def get_bucket_name() -> str:
    return settings.S3_BUCKET_NAME

def upload_file_to_s3(file_bytes: bytes, s3_key: str) -> str:
    """Upload file bytes to S3. Returns the S3 key."""
    client = get_s3_client()
    client.put_object(
        Bucket=get_bucket_name(),
        Key=s3_key,
        Body=file_bytes,
    )
    return s3_key

def download_file_from_s3(s3_key: str, local_path: str):
    """Download a file from S3 to a local path."""
    client = get_s3_client()
    client.download_file(
        Bucket=get_bucket_name(),
        Key=s3_key,
        Filename=local_path,
    )

def delete_file_from_s3(s3_key: str):
    """Delete a single file from S3."""
    client = get_s3_client()
    client.delete_object(
        Bucket=get_bucket_name(),
        Key=s3_key,
    )

def delete_all_files_from_s3():
    """Delete ALL files in the bucket (used by reset route)."""
    client = get_s3_client()
    bucket = get_bucket_name()

    # List and delete in batches (S3 allows max 1000 per list call)
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        objects = page.get("Contents", [])
        if not objects:
            continue
        delete_keys = [{"Key": obj["Key"]} for obj in objects]
        client.delete_objects(
            Bucket=bucket,
            Delete={"Objects": delete_keys},
        )
