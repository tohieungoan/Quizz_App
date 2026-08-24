"""Strict structural validation for untrusted LLM quiz-variant output."""

from __future__ import annotations

import ast
import math
import re
import unicodedata
from dataclasses import dataclass
from typing import Any


class QuizVariantValidationError(ValueError):
    pass


@dataclass(frozen=True)
class ValidatedVariantOption:
    source_option_id: int
    content: str


@dataclass(frozen=True)
class ValidatedVariantQuestion:
    variant_index: int
    original_question_id: int
    content: str
    options: tuple[ValidatedVariantOption, ...]


class QuizVariantPayloadValidator:
    """Validate mappings and deterministically verify simple numeric variants."""

    _ARITHMETIC_PATTERN = re.compile(
        r"(?<![\w.])(-?\d+(?:[.,]\d+)?(?:\s*(?:\+|-|\*|/|×|÷)\s*-?\d+(?:[.,]\d+)?)+)"
    )
    _NUMBER_PATTERN = re.compile(r"^\s*(-?\d+(?:[.,]\d+)?)\s*$")

    OUTPUT_SCHEMA: dict[str, Any] = {
        "type": "object",
        "additionalProperties": False,
        "required": ["variants"],
        "properties": {
            "variants": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "variant_index",
                        "original_question_id",
                        "content",
                        "options",
                    ],
                    "properties": {
                        "variant_index": {"type": "integer"},
                        "original_question_id": {"type": "integer"},
                        "content": {"type": "string", "minLength": 1},
                        "options": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "additionalProperties": False,
                                "required": ["source_option_id", "content"],
                                "properties": {
                                    "source_option_id": {"type": "integer"},
                                    "content": {"type": "string", "minLength": 1},
                                },
                            },
                        },
                    },
                },
            },
        },
    }

    @staticmethod
    def validate(
        payload: dict[str, Any],
        source_questions: list[dict[str, Any]],
        variant_indices: list[int],
    ) -> list[ValidatedVariantQuestion]:
        raw_variants = payload.get("variants")
        if not isinstance(raw_variants, list):
            raise QuizVariantValidationError("AI response must contain a variants list.")

        source_by_id = {int(question["id"]): question for question in source_questions}
        expected_pairs = {
            (variant_index, question_id)
            for variant_index in variant_indices
            for question_id in source_by_id
        }
        seen_pairs: set[tuple[int, int]] = set()
        validated: list[ValidatedVariantQuestion] = []
        numeric_answers: dict[int, list[float]] = {}
        question_fingerprints: dict[int, set[str]] = {
            question_id: {
                QuizVariantPayloadValidator._content_fingerprint(
                    str(question.get("content") or "")
                )
            }
            for question_id, question in source_by_id.items()
        }

        for raw in raw_variants:
            if not isinstance(raw, dict):
                raise QuizVariantValidationError("Every variant entry must be an object.")
            try:
                variant_index = int(raw["variant_index"])
                question_id = int(raw["original_question_id"])
            except (KeyError, TypeError, ValueError) as error:
                raise QuizVariantValidationError("Variant mappings are missing or invalid.") from error

            pair = (variant_index, question_id)
            if pair not in expected_pairs:
                raise QuizVariantValidationError("AI returned an unknown variant or question mapping.")
            if pair in seen_pairs:
                raise QuizVariantValidationError("AI returned a duplicate variant question.")
            seen_pairs.add(pair)

            content = str(raw.get("content") or "").strip()
            if not content:
                raise QuizVariantValidationError("A generated question is empty.")
            fingerprint = QuizVariantPayloadValidator._content_fingerprint(content)
            prior_fingerprints = question_fingerprints[question_id]
            if fingerprint in prior_fingerprints:
                raise QuizVariantValidationError(
                    "Every generated question must differ from the original and the other versions."
                )
            prior_fingerprints.add(fingerprint)

            raw_options = raw.get("options")
            if not isinstance(raw_options, list):
                raise QuizVariantValidationError("Generated options must be a list.")

            source_option_ids = {
                int(option["id"])
                for option in source_by_id[question_id].get("options", [])
            }
            options: list[ValidatedVariantOption] = []
            returned_option_ids: set[int] = set()
            for raw_option in raw_options:
                if not isinstance(raw_option, dict):
                    raise QuizVariantValidationError("Every generated option must be an object.")
                try:
                    source_option_id = int(raw_option["source_option_id"])
                except (KeyError, TypeError, ValueError) as error:
                    raise QuizVariantValidationError("A generated option lost its source mapping.") from error
                option_content = str(raw_option.get("content") or "").strip()
                if not option_content:
                    raise QuizVariantValidationError("A generated option is empty.")
                if source_option_id not in source_option_ids or source_option_id in returned_option_ids:
                    raise QuizVariantValidationError("Generated option mappings do not match the source question.")
                returned_option_ids.add(source_option_id)
                options.append(ValidatedVariantOption(source_option_id, option_content))

            if returned_option_ids != source_option_ids:
                raise QuizVariantValidationError("Generated options must preserve every source option exactly once.")

            QuizVariantPayloadValidator._validate_simple_arithmetic_variant(
                source_by_id[question_id],
                content,
                options,
                numeric_answers,
            )

            validated.append(
                ValidatedVariantQuestion(
                    variant_index=variant_index,
                    original_question_id=question_id,
                    content=content,
                    options=tuple(options),
                )
            )

        if seen_pairs != expected_pairs:
            raise QuizVariantValidationError("AI response is incomplete for the requested batch.")
        return validated

    @classmethod
    def _validate_simple_arithmetic_variant(
        cls,
        source: dict[str, Any],
        generated_content: str,
        generated_options: list[ValidatedVariantOption],
        numeric_answers: dict[int, list[float]],
    ) -> None:
        """Reject wrong or unchanged answers for directly evaluable arithmetic.

        Complex word problems remain subject to the normal strict mapping and AI
        quality checks. This deterministic guard intentionally handles only a
        small safe grammar instead of evaluating arbitrary model-produced text.
        """
        source_expression = cls._extract_arithmetic(str(source.get("content") or ""))
        source_correct = [
            option
            for option in source.get("options", [])
            if option.get("is_correct") is True
        ]
        if source_expression is None or len(source_correct) != 1:
            return
        source_correct_value = cls._parse_number(source_correct[0].get("content"))
        if source_correct_value is None or not math.isclose(
            source_expression[1], source_correct_value, rel_tol=1e-9, abs_tol=1e-9
        ):
            return

        generated_expression = cls._extract_arithmetic(generated_content)
        if generated_expression is None:
            raise QuizVariantValidationError(
                "A generated arithmetic question is no longer directly evaluable."
            )
        if generated_expression[0] == source_expression[0]:
            raise QuizVariantValidationError(
                "A generated arithmetic question must change its operands."
            )

        correct_source_id = int(source_correct[0]["id"])
        generated_by_source = {
            option.source_option_id: option for option in generated_options
        }
        generated_correct_value = cls._parse_number(
            generated_by_source[correct_source_id].content
        )
        expected_value = generated_expression[1]
        if generated_correct_value is None or not math.isclose(
            generated_correct_value, expected_value, rel_tol=1e-9, abs_tol=1e-9
        ):
            raise QuizVariantValidationError(
                "The generated correct option does not match the arithmetic result."
            )

        for source_option_id, option in generated_by_source.items():
            if source_option_id == correct_source_id:
                continue
            distractor_value = cls._parse_number(option.content)
            if distractor_value is not None and math.isclose(
                distractor_value, expected_value, rel_tol=1e-9, abs_tol=1e-9
            ):
                raise QuizVariantValidationError(
                    "A generated distractor duplicates the correct arithmetic result."
                )

        question_id = int(source["id"])
        prior_answers = numeric_answers.setdefault(
            question_id, [source_correct_value]
        )
        if any(
            math.isclose(expected_value, prior, rel_tol=1e-9, abs_tol=1e-9)
            for prior in prior_answers
        ):
            raise QuizVariantValidationError(
                "Equivalent arithmetic versions must have different correct results."
            )
        prior_answers.append(expected_value)

    @classmethod
    def _extract_arithmetic(cls, content: str) -> tuple[str, float] | None:
        match = cls._ARITHMETIC_PATTERN.search(content)
        if not match:
            return None
        expression = match.group(1).replace("×", "*").replace("÷", "/").replace(",", ".")
        canonical = re.sub(r"\s+", "", expression)
        try:
            tree = ast.parse(expression, mode="eval")
            value = cls._evaluate_node(tree.body)
        except (SyntaxError, TypeError, ValueError, ZeroDivisionError, OverflowError):
            return None
        if not math.isfinite(value) or abs(value) > 1_000_000_000_000:
            return None
        return canonical, value

    @classmethod
    def _evaluate_node(cls, node: ast.AST) -> float:
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = cls._evaluate_node(node.operand)
            return value if isinstance(node.op, ast.UAdd) else -value
        if isinstance(node, ast.BinOp) and isinstance(
            node.op, (ast.Add, ast.Sub, ast.Mult, ast.Div)
        ):
            left = cls._evaluate_node(node.left)
            right = cls._evaluate_node(node.right)
            if isinstance(node.op, ast.Add):
                return left + right
            if isinstance(node.op, ast.Sub):
                return left - right
            if isinstance(node.op, ast.Mult):
                return left * right
            return left / right
        raise ValueError("Unsupported arithmetic expression.")

    @classmethod
    def _parse_number(cls, value: Any) -> float | None:
        match = cls._NUMBER_PATTERN.fullmatch(str(value or ""))
        if not match:
            return None
        try:
            number = float(match.group(1).replace(",", "."))
        except ValueError:
            return None
        return number if math.isfinite(number) else None

    @staticmethod
    def _content_fingerprint(content: str) -> str:
        """Normalize cosmetic differences so punctuation-only edits do not pass."""
        normalized = unicodedata.normalize("NFKC", content).casefold()
        return re.sub(r"[^\w]+", " ", normalized, flags=re.UNICODE).strip()


quiz_variant_payload_validator = QuizVariantPayloadValidator()
