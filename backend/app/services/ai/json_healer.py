import json
import re
from typing import Any, Dict, List
import logging

logger = logging.getLogger(__name__)


class JSONHealingError(Exception):
    pass


class JSONHealingService:
    """
    Enterprise JSON Healing Service.
    Extracts, cleans, repairs, and parses unstructured LLM responses into valid JSON objects.
    """

    @classmethod
    def heal_and_parse(
        cls,
        raw_text: str,
        *,
        preserve_root: bool = False,
    ) -> Dict[str, Any]:
        """
        Parses raw LLM text into a normalized dictionary containing 'questions'.
        Applies multi-stage heuristic repair pipelines.
        """
        if not raw_text or not raw_text.strip():
            raise JSONHealingError("Chuỗi phản hồi từ AI rỗng.")

        cleaned = raw_text.strip()

        # Step 1: Strip Markdown code blocks
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

        # Step 2: Try direct standard JSON parsing first
        try:
            parsed = json.loads(cleaned)
            return cls._finalize_structure(parsed, preserve_root)
        except json.JSONDecodeError:
            pass

        # Step 3: Extract outer JSON block using Regex
        extracted = cls._extract_json_block(cleaned)

        # Step 4: Apply heuristic string repairs
        repaired = cls._repair_json_string(extracted)

        try:
            parsed = json.loads(repaired)
            return cls._finalize_structure(parsed, preserve_root)
        except json.JSONDecodeError as err:
            logger.warning(f"Lỗi JSONDecodeError sau khi sửa sơ bộ: {err}. Thử chế độ sửa nâng cao...")

            # Step 5: Advanced repair for unescaped newlines and unclosed structures
            advanced_repaired = cls._advanced_repair(repaired)
            try:
                parsed = json.loads(advanced_repaired)
                return cls._finalize_structure(parsed, preserve_root)
            except json.JSONDecodeError as final_err:
                logger.error(f"Không thể phục hồi JSON: {final_err}. Nội dung: {repaired[:300]}...")
                raise JSONHealingError(f"Không thể giải mã dữ liệu JSON từ AI: {final_err}")

    @classmethod
    def _extract_json_block(cls, text: str) -> str:
        """
        Extracts the largest outer JSON object {...} or array [...].
        """
        # Search for object
        obj_match = re.search(r"\{[\s\S]*\}", text)
        if obj_match:
            return obj_match.group(0)

        # Search for array
        arr_match = re.search(r"\[[\s\S]*\]", text)
        if arr_match:
            return arr_match.group(0)

        return text

    @classmethod
    def _repair_json_string(cls, text: str) -> str:
        """
        Fixes common LLM JSON syntax errors (trailing commas, quotes).
        """
        s = text

        # 1. Remove trailing commas before } or ]
        s = re.sub(r",\s*\}", "}", s)
        s = re.sub(r",\s*\]", "]", s)

        # 2. Fix double commas
        s = re.sub(r",\s*,", ",", s)

        # 3. Replace curly/smart quotes with standard quotes
        s = s.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")

        return s

    @classmethod
    def _advanced_repair(cls, text: str) -> str:
        """
        Attempts to close unclosed brackets and fix broken line breaks.
        """
        s = text.strip()

        # Count open/close braces
        open_braces = s.count("{")
        close_braces = s.count("}")
        open_brackets = s.count("[")
        close_brackets = s.count("]")

        if open_brackets > close_brackets:
            s += "]" * (open_brackets - close_brackets)
        if open_braces > close_braces:
            s += "}" * (open_braces - close_braces)

        # Remove trailing comma before newly added brackets
        s = re.sub(r",\s*\}", "}", s)
        s = re.sub(r",\s*\]", "]", s)

        return s

    @classmethod
    def _normalize_structure(cls, parsed_data: Any) -> Dict[str, Any]:
        """
        Normalizes any JSON structure to always have a root 'questions' list.
        """
        if isinstance(parsed_data, list):
            return {"questions": parsed_data}

        if isinstance(parsed_data, dict):
            if "questions" in parsed_data and isinstance(parsed_data["questions"], list):
                return parsed_data
            for alt_key in ["data", "items", "quiz", "result", "list"]:
                if alt_key in parsed_data and isinstance(parsed_data[alt_key], list):
                    return {"questions": parsed_data[alt_key]}
            return {"questions": [parsed_data]}

        return {"questions": []}

    @classmethod
    def _finalize_structure(
        cls,
        parsed_data: Any,
        preserve_root: bool,
    ) -> Dict[str, Any]:
        """Preserve typed contracts; normalize only legacy question output."""
        if preserve_root:
            if not isinstance(parsed_data, dict):
                raise JSONHealingError("Structured AI output must be a JSON object.")
            return parsed_data
        return cls._normalize_structure(parsed_data)
