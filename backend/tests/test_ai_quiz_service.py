import pytest
import json
from app.services.ai.document_parser import DocumentParserService
from app.services.ai.prompt_builder import PromptBuilder
from app.services.ai.json_healer import JSONHealingService
from app.services.ai.validator import AIQuizValidator
from app.schemas.ai_quiz import AIQuestionItem


def test_document_parser_plain_text():
    sample_text = "Python là ngôn ngữ lập trình bậc cao, thông dịch, hướng đối tượng."
    bytes_data = sample_text.encode("utf-8")
    extracted, pages = DocumentParserService.extract_text(bytes_data, "test.txt")
    assert "Python là ngôn ngữ" in extracted
    assert pages >= 1


def test_document_parser_smart_chunk():
    long_text = "Dòng dữ liệu kiểm thử. " * 2000
    chunked = DocumentParserService.smart_chunk_text(long_text, num_questions=5)
    assert len(chunked) <= 25000
    assert len(chunked) > 0


def test_prompt_builder_system_and_user():
    sys_prompt = PromptBuilder.build_system_prompt()
    assert "RULES:" in sys_prompt
    assert "Grounding:" in sys_prompt
    assert "All/None of the above" in sys_prompt  # Prohibited rule

    user_prompt = PromptBuilder.build_user_prompt(
        document_content="Nội dung test",
        filename="test.pdf",
        num_questions=3,
        existing_questions=["Câu hỏi 1 đã có?"],
        deleted_blacklist=["Câu hỏi đã xóa?"]
    )
    assert "Câu hỏi 1 đã có?" in user_prompt
    assert "Câu hỏi đã xóa?" in user_prompt
    assert "test.pdf" in user_prompt


def test_json_healer_with_markdown_and_trailing_commas():
    raw_markdown = """
    ```json
    {
      "questions": [
        {
          "content": "OOP có mấy tính chất?",
          "type": "multiple",
          "difficulty": "EASY",
          "options": [
            {"content": "4 tính chất", "is_correct": true},
            {"content": "3 tính chất", "is_correct": false},
          ],
        }
      ],
    }
    ```
    """
    parsed = JSONHealingService.heal_and_parse(raw_markdown)
    assert "questions" in parsed
    assert len(parsed["questions"]) == 1
    assert parsed["questions"][0]["content"] == "OOP có mấy tính chất?"


def test_validator_and_normalizer():
    raw_data = {
        "questions": [
            {
                "content": "Tính chất nào của OOP giúp che giấu dữ liệu?",
                "type": "multiple",
                "difficulty": "medium",
                "options": [
                    {"content": "Tính đóng gói", "is_correct": True},
                    {"content": "Tính kế thừa", "is_correct": False},
                    {"content": "Tính đa hình", "is_correct": False},
                    {"content": "Tính trừu tượng", "is_correct": False}
                ]
            },
            {
                "content": "Python là ngôn ngữ biên dịch.",
                "type": "truefalse",
                "difficulty": "easy",
                "options": [
                    {"content": "True", "is_correct": False},
                    {"content": "False", "is_correct": True}
                ]
            },
            {
                "content": "Từ khóa định nghĩa hàm trong Python là gì?",
                "type": "short",
                "keyword": "def",
                "options": [
                    {"content": "def", "is_correct": True}
                ]
            }
        ]
    }

    validated = AIQuizValidator.validate_and_normalize(raw_data, default_source="Test Unit")
    assert len(validated) == 3
    assert isinstance(validated[0], AIQuestionItem)
    assert validated[0].type == "multiple"
    assert validated[1].type == "truefalse"
    assert validated[2].type == "short"
    assert validated[2].keyword == "def"
