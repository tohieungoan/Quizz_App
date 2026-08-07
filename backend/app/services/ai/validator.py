from typing import Any, Dict, List
import logging
from app.schemas.ai_quiz import AIQuestionItem, AIOptionItem

logger = logging.getLogger(__name__)


class AIQuizValidator:
    """
    Enterprise Pydantic Validation & Normalization Service for AI-generated assessment questions.
    Ensures structural integrity, option counts, valid keys, and Bloom taxonomy defaults.
    """

    @classmethod
    def validate_and_normalize(cls, raw_dict: Dict[str, Any], default_source: str = "Tài liệu đính kèm") -> List[AIQuestionItem]:
        questions_raw = raw_dict.get("questions", [])
        if not isinstance(questions_raw, list):
            return []

        validated_items: List[AIQuestionItem] = []

        for idx, item in enumerate(questions_raw):
            if not isinstance(item, dict):
                continue

            try:
                # 1. Content
                content = str(item.get("content") or item.get("question") or item.get("stem") or "").strip()
                if not content or len(content) < 5:
                    continue

                # 2. Type normalization
                raw_type = str(item.get("type") or "multiple").lower().strip()
                if "true" in raw_type or "false" in raw_type:
                    q_type = "truefalse"
                elif "short" in raw_type or "fill" in raw_type:
                    q_type = "short"
                else:
                    q_type = "multiple"

                # 3. Difficulty normalization
                raw_diff = str(item.get("difficulty") or "MEDIUM").upper().strip()
                difficulty = raw_diff if raw_diff in ["EASY", "MEDIUM", "HARD"] else "MEDIUM"

                # 4. Bloom level
                raw_bloom = str(item.get("bloom_level") or "understand").lower().strip()
                bloom_level = raw_bloom if raw_bloom in ["remember", "understand", "apply", "analyze", "evaluate", "create"] else "understand"

                # 5. Time limit & Points
                time_limit = item.get("time_limit")
                if not isinstance(time_limit, int) or time_limit <= 0:
                    time_limit = 45 if difficulty == "EASY" else (60 if difficulty == "MEDIUM" else 90)

                points = float(item.get("points") or 1.0)
                source = str(item.get("source") or default_source).strip()
                explanation = str(item.get("explanation") or "").strip()
                keyword = str(item.get("keyword") or "").strip() if item.get("keyword") else None
                acceptable_answers = item.get("acceptable_answers") if isinstance(item.get("acceptable_answers"), list) else None

                # 6. Options Normalization
                raw_options = item.get("options") or item.get("answers") or []
                normalized_options: List[AIOptionItem] = []

                if q_type == "multiple":
                    if isinstance(raw_options, list):
                        for opt in raw_options:
                            if isinstance(opt, dict):
                                opt_content = str(opt.get("content") or opt.get("text") or "").strip()
                                is_corr = bool(opt.get("is_correct", False))
                                if opt_content:
                                    normalized_options.append(AIOptionItem(content=opt_content, is_correct=is_corr))
                            elif isinstance(opt, str) and opt.strip():
                                normalized_options.append(AIOptionItem(content=opt.strip(), is_correct=False))

                    # Ensure exactly 1 correct answer
                    correct_count = sum(1 for o in normalized_options if o.is_correct)
                    if correct_count == 0 and len(normalized_options) > 0:
                        normalized_options[0].is_correct = True
                    elif correct_count > 1:
                        # Keep only the first correct answer
                        first_found = False
                        for o in normalized_options:
                            if o.is_correct:
                                if not first_found:
                                    first_found = True
                                else:
                                    o.is_correct = False

                    if len(normalized_options) < 2:
                        continue

                elif q_type == "truefalse":
                    # Determine true/false correctness
                    tf_val = True
                    if isinstance(raw_options, list) and len(raw_options) >= 2:
                        for opt in raw_options:
                            if isinstance(opt, dict) and str(opt.get("content")).lower() == "true":
                                tf_val = bool(opt.get("is_correct", True))
                    elif "true" in str(item.get("correct_answer") or "").lower():
                        tf_val = True
                    elif "false" in str(item.get("correct_answer") or "").lower():
                        tf_val = False

                    normalized_options = [
                        AIOptionItem(content="True", is_correct=tf_val),
                        AIOptionItem(content="False", is_correct=not tf_val),
                    ]

                elif q_type == "short":
                    short_ans = keyword or ""
                    if not short_ans and isinstance(raw_options, list) and len(raw_options) > 0:
                        first_opt = raw_options[0]
                        short_ans = first_opt.get("content", "") if isinstance(first_opt, dict) else str(first_opt)

                    if not short_ans:
                        short_ans = "Đáp án"

                    keyword = short_ans
                    normalized_options = [AIOptionItem(content=short_ans, is_correct=True)]

                # Construct validated Pydantic model
                question_obj = AIQuestionItem(
                    content=content,
                    type=q_type,
                    difficulty=difficulty,
                    bloom_level=bloom_level,
                    time_limit=time_limit,
                    points=points,
                    source=source,
                    explanation=explanation,
                    keyword=keyword,
                    acceptable_answers=acceptable_answers,
                    options=normalized_options
                )
                validated_items.append(question_obj)

            except Exception as e:
                logger.warning(f"Bỏ qua câu hỏi {idx+1} do lỗi validation: {e}")
                continue

        return validated_items
