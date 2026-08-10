from typing import Optional, List
from pydantic import BaseModel, Field


class AIOptionItem(BaseModel):
    content: str = Field(..., description="Nội dung phương án lựa chọn")
    is_correct: bool = Field(False, description="Đánh dấu đáp án đúng")


class AIQuestionItem(BaseModel):
    content: str = Field(..., description="Nội dung câu hỏi")
    type: str = Field("multiple", description="Loại câu hỏi: multiple, truefalse, short")
    difficulty: str = Field("MEDIUM", description="Độ khó: EASY, MEDIUM, HARD")
    bloom_level: Optional[str] = Field("understand", description="Cấp độ Bloom: remember, understand, apply, analyze, evaluate")
    time_limit: int = Field(60, description="Thời gian làm bài gợi ý (giây)")
    points: float = Field(1.0, description="Điểm số")
    source: Optional[str] = Field(None, description="Trích dẫn nguồn từ tài liệu (trang, mục)")
    explanation: str = Field("", description="Giải thích lý do đáp án đúng và phân tích phương án sai")
    keyword: Optional[str] = Field(None, description="Từ khóa đáp án ngắn / điền từ")
    acceptable_answers: Optional[List[str]] = Field(default=None, description="Danh sách từ đồng nghĩa được chấp nhận")
    options: List[AIOptionItem] = Field(default_factory=list, description="Danh sách các phương án lựa chọn")


class AIQuizGenerateRequest(BaseModel):
    prompt_text: Optional[str] = Field(None, description="Văn bản hoặc chủ đề trực tiếp (nếu không upload file)")
    filename: Optional[str] = Field("document.pdf", description="Tên tệp tài liệu")
    num_questions: int = Field(5, ge=1, le=30, description="Số lượng câu hỏi cần tạo (1-30)")
    difficulty: str = Field("MEDIUM", description="Độ khó: EASY, MEDIUM, HARD, MIXED")
    question_type: str = Field("multiple", description="Dạng câu hỏi: multiple, truefalse, short, all")
    language: str = Field("vi", description="Ngôn ngữ tạo câu hỏi: vi, en")
    start_page: Optional[int] = Field(None, ge=1, description="Trang bắt đầu trích xuất")
    end_page: Optional[int] = Field(None, ge=1, description="Trang kết thúc trích xuất")
    existing_questions: List[str] = Field(default_factory=list, description="Danh sách câu hỏi đã có trong đề thi để tránh trùng lặp")
    deleted_blacklist: List[str] = Field(default_factory=list, description="Danh sách câu hỏi người dùng đã xóa cần cấm tạo lại")


class AIQuizGenerateResponse(BaseModel):
    success: bool = True
    model_used: str = Field(..., description="Tên mô hình AI đã xử lý thành công")
    total_questions: int = Field(..., description="Tổng số câu hỏi được tạo")
    questions: List[AIQuestionItem] = Field(default_factory=list, description="Danh sách câu hỏi đã chuẩn hóa")
    processing_time_ms: int = Field(0, description="Thời gian xử lý tính bằng mili-giây")


class DocumentPreviewResponse(BaseModel):
    filename: str
    total_pages: int
    character_count: int
    preview_text: str
