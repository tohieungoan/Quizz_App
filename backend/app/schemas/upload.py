from pydantic import BaseModel, Field

class UploadSignatureRequest(BaseModel):
    fileName: str = Field(..., description="Original name of the file")
    fileType: str = Field(..., description="MIME type of the file, e.g., image/jpeg, video/mp4")
    fileSize: int = Field(..., description="Size of the file in bytes")

class UploadSignatureResponse(BaseModel):
    signature: str
    timestamp: int
    api_key: str
    cloud_name: str
    folder: str
