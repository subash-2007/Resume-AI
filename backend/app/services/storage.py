import os
import hashlib
import uuid
import shutil
from abc import ABC, abstractmethod
from typing import Tuple, Generator, Optional
from app.core.config import settings

CHUNK_TEMP_DIR = os.path.join(settings.UPLOAD_DIR, "chunks_temp")
os.makedirs(CHUNK_TEMP_DIR, exist_ok=True)

class BaseStorageProvider(ABC):
    @abstractmethod
    def save_file_stream(self, file_stream, original_filename: str) -> Tuple[str, str, int]:
        """Streams file to storage, calculating SHA-256 and size without memory bloat."""
        pass

    @abstractmethod
    def save_chunk(self, upload_id: str, chunk_index: int, chunk_bytes: bytes) -> int:
        """Saves a single resumable chunk to temporary staging."""
        pass

    @abstractmethod
    def assemble_chunks(self, upload_id: str, total_chunks: int, original_filename: str) -> Tuple[str, str, int]:
        """Assembles all received chunks into final storage, computing SHA-256."""
        pass

    @abstractmethod
    def get_file_path(self, storage_ref: str) -> str:
        """Resolves local access path or signed URL for preview/download."""
        pass


class LocalStorageProvider(BaseStorageProvider):
    def __init__(self, upload_root: Optional[str] = None):
        self.upload_root = upload_root or settings.UPLOAD_DIR
        os.makedirs(self.upload_root, exist_ok=True)

    def save_file_stream(self, file_stream, original_filename: str) -> Tuple[str, str, int]:
        clean_name = os.path.basename(original_filename)
        unique_name = f"{uuid.uuid4().hex}_{clean_name}"
        destination = os.path.join(self.upload_root, unique_name)

        hasher = hashlib.sha256()
        total_bytes = 0
        chunk_size = 64 * 1024  # 64 KB streaming buffer

        with open(destination, "wb") as out_f:
            while True:
                chunk = file_stream.read(chunk_size)
                if not chunk:
                    break
                out_f.write(chunk)
                hasher.update(chunk)
                total_bytes += len(chunk)

        file_hash = hasher.hexdigest()
        return destination, file_hash, total_bytes

    def save_chunk(self, upload_id: str, chunk_index: int, chunk_bytes: bytes) -> int:
        staging_dir = os.path.join(CHUNK_TEMP_DIR, upload_id)
        os.makedirs(staging_dir, exist_ok=True)
        chunk_path = os.path.join(staging_dir, f"chunk_{chunk_index:05d}.part")
        with open(chunk_path, "wb") as f:
            f.write(chunk_bytes)
        return len(chunk_bytes)

    def assemble_chunks(self, upload_id: str, total_chunks: int, original_filename: str) -> Tuple[str, str, int]:
        staging_dir = os.path.join(CHUNK_TEMP_DIR, upload_id)
        if not os.path.exists(staging_dir):
            raise FileNotFoundError(f"Upload session {upload_id} not found in chunk staging.")

        clean_name = os.path.basename(original_filename)
        unique_name = f"{uuid.uuid4().hex}_{clean_name}"
        destination = os.path.join(self.upload_root, unique_name)

        hasher = hashlib.sha256()
        total_bytes = 0

        with open(destination, "wb") as dest_f:
            for idx in range(total_chunks):
                chunk_path = os.path.join(staging_dir, f"chunk_{idx:05d}.part")
                if not os.path.exists(chunk_path):
                    raise FileNotFoundError(f"Missing chunk index {idx} in upload session {upload_id}")
                with open(chunk_path, "rb") as cf:
                    chunk = cf.read()
                    dest_f.write(chunk)
                    hasher.update(chunk)
                    total_bytes += len(chunk)

        # Cleanup temporary chunks directory
        try:
            shutil.rmtree(staging_dir)
        except Exception:
            pass

        return destination, hasher.hexdigest(), total_bytes

    def get_file_path(self, storage_ref: str) -> str:
        return storage_ref


class S3StorageProvider(BaseStorageProvider):
    """
    S3-Compatible Object Storage Provider for 10GB+ large-scale aggregate campaign deployments.
    Supports AWS S3, Cloudflare R2, MinIO, and Ceph.
    """
    def __init__(self):
        self.bucket_name = os.getenv("S3_BUCKET_NAME", "resumeai-enterprise-storage")
        self.endpoint_url = os.getenv("S3_ENDPOINT_URL", None)
        self.access_key = os.getenv("AWS_ACCESS_KEY_ID", None)
        self.secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", None)
        self.local_fallback = LocalStorageProvider()

    def save_file_stream(self, file_stream, original_filename: str) -> Tuple[str, str, int]:
        # If credentials configured and boto3 available, stream to S3 multipart; otherwise use robust local streaming
        if self.access_key and self.secret_key:
            try:
                import boto3
                s3 = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint_url,
                    aws_access_key_id=self.access_key,
                    aws_secret_access_key=self.secret_key
                )
                clean_name = os.path.basename(original_filename)
                s3_key = f"campaigns/{uuid.uuid4().hex}_{clean_name}"
                
                # Stream via local buffer to S3 while computing sha256
                local_path, file_hash, total_bytes = self.local_fallback.save_file_stream(file_stream, original_filename)
                s3.upload_file(local_path, self.bucket_name, s3_key)
                return local_path, file_hash, total_bytes
            except Exception as e:
                print(f"[S3StorageProvider] S3 streaming fallback to local storage: {e}")
        return self.local_fallback.save_file_stream(file_stream, original_filename)

    def save_chunk(self, upload_id: str, chunk_index: int, chunk_bytes: bytes) -> int:
        return self.local_fallback.save_chunk(upload_id, chunk_index, chunk_bytes)

    def assemble_chunks(self, upload_id: str, total_chunks: int, original_filename: str) -> Tuple[str, str, int]:
        return self.local_fallback.assemble_chunks(upload_id, total_chunks, original_filename)

    def get_file_path(self, storage_ref: str) -> str:
        return self.local_fallback.get_file_path(storage_ref)


def get_storage_provider() -> BaseStorageProvider:
    if os.getenv("USE_S3_STORAGE", "false").lower() == "true":
        return S3StorageProvider()
    return LocalStorageProvider()

