from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

class UploadSignatureRequest(BaseModel):
    fileName: str = Field(..., description="Original name of the file")
    fileType: str = Field(..., description="MIME type of the file, e.g., image/jpeg, video/mp4")
    fileSize: int = Field(..., gt=0, description="Size of the file in bytes")
    quizId: Optional[int] = Field(None, gt=0)

    @field_validator("fileType")
    @classmethod
    def normalize_content_type(cls, value: str) -> str:
        return value.strip().lower()

class UploadSignatureResponse(BaseModel):
    signature: str
    timestamp: int
    api_key: str
    cloud_name: str
    folder: str
    public_id: str
    asset_id: int
    resource_type: str


class UploadCompleteRequest(BaseModel):
    asset_id: int = Field(..., gt=0)
    public_id: str = Field(..., min_length=1, max_length=255)
    secure_url: str = Field(..., min_length=1, max_length=2048)
    resource_type: str = Field(..., pattern=r"^(image|video)$")
    bytes: int = Field(..., gt=0)
    format: Optional[str] = Field(None, max_length=20)


class UploadAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    secure_url: Optional[str] = None
    public_id: Optional[str] = None
    resource_type: Optional[str] = None
    bytes: Optional[int] = None
    status: str
