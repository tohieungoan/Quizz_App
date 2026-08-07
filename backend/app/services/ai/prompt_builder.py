from typing import List, Optional
import re


class PromptBuilder:
    """
    Prompt Builder enforcing assessment standards, Bloom's Taxonomy, and deduplication.
    Optimized for minimal token usage, multi-language support, and fast LLM response.
    """

    @classmethod
    def resolve_target_language(cls, language: str = "en", custom_prompt: Optional[str] = None) -> str:
        """
        Intelligently determine target language from user instructions or explicit parameter.
        Defaults to English unless another language is requested.
        """
        if custom_prompt:
            lower = custom_prompt.lower()
            # Japanese
            if any(w in lower for w in ["tiếng nhật", "japanese", "nihongo", "tiếng nhat", "in japanese", "tieng nhat"]):
                return "Japanese (日本語)"
            # French
            if any(w in lower for w in ["tiếng pháp", "french", "français", "francais", "tiếng phap", "in french", "tieng phap"]):
                return "French (Français)"
            # German
            if any(w in lower for w in ["tiếng đức", "tiếng duc", "german", "deutsch", "in german", "tieng duc"]):
                return "German (Deutsch)"
            # Korean
            if any(w in lower for w in ["tiếng hàn", "tiếng han", "korean", "한국어", "hangul", "in korean", "tieng han"]):
                return "Korean (한국어)"
            # Chinese
            if any(w in lower for w in ["tiếng trung", "chinese", "mandarin", "中文", "tiếng hoa", "in chinese", "tieng trung"]):
                return "Chinese (中文)"
            # Spanish
            if any(w in lower for w in ["tiếng tây ban nha", "spanish", "español", "espanol", "in spanish", "tieng tay ban nha"]):
                return "Spanish (Español)"
            # Vietnamese
            if any(w in lower for w in ["tiếng việt", "tiếng viet", "vietnamese", "in vietnamese", "tieng viet"]):
                return "Vietnamese (Tiếng Việt)"
            # Russian
            if any(w in lower for w in ["tiếng nga", "russian", "русский", "in russian", "tieng nga"]):
                return "Russian (Русский)"
            # Italian
            if any(w in lower for w in ["tiếng ý", "tiếng y", "italian", "italiano", "in italian", "tieng y"]):
                return "Italian (Italiano)"
            # Portuguese
            if any(w in lower for w in ["tiếng bồ đào nha", "portuguese", "português", "in portuguese", "tieng bo dao nha"]):
                return "Portuguese (Português)"

        lang_map = {
            "en": "English",
            "vi": "Vietnamese (Tiếng Việt)",
            "ja": "Japanese (日本語)",
            "fr": "French (Français)",
            "de": "German (Deutsch)",
            "ko": "Korean (한국어)",
            "zh": "Chinese (中文)",
            "es": "Spanish (Español)",
            "ru": "Russian (Русский)",
            "it": "Italian (Italiano)",
            "pt": "Portuguese (Português)"
        }
        return lang_map.get(language.lower().strip(), language)

    @classmethod
    def build_system_prompt(cls) -> str:
        return (
            "You are an expert assessment specialist. Generate rigorous quiz questions from the provided document/text.\n\n"
            "RULES:\n"
            "1. Grounding: Every question and answer must be strictly grounded in the provided content. Include a precise 'source' citation (e.g. 'Page 4, Section 2.3').\n"
            "2. Language: Output all questions, options, and explanations in the target language requested in the user prompt. If the user prompt requests Japanese, French, Vietnamese, German, or any other language, you MUST generate EVERYTHING in that language. Default to English only when no specific language is requested.\n"
            "3. Multiple Choice: Exactly 1 correct answer + 3 plausible, non-trivial distractors. NEVER use 'All/None of the above'.\n"
            "4. True/False: A clear factual statement in the target language. Options: [{'content':'True','is_correct':...},{'content':'False','is_correct':...}].\n"
            "5. Short Answer: 'keyword' = concise 1-4 word answer in the target language.\n"
            "6. Difficulty: EASY=recall/facts, MEDIUM=comprehension/application, HARD=analysis/evaluation.\n"
            "7. Explanation: Provide a concise 1-2 sentence explanation justifying the correct answer in the target language.\n"
            "8. Output Format: Return ONLY valid JSON: {\"questions\": [...]}. No markdown fences, no conversational text."
        )

    @classmethod
    def build_deduplication_block(
        cls,
        existing_questions: Optional[List[str]] = None,
        deleted_blacklist: Optional[List[str]] = None
    ) -> str:
        all_blacklist = []
        if existing_questions:
            all_blacklist.extend([q.strip() for q in existing_questions if q and q.strip()])
        if deleted_blacklist:
            all_blacklist.extend([q.strip() for q in deleted_blacklist if q and q.strip()])

        unique_items = list(dict.fromkeys(all_blacklist))[:30]

        if not unique_items:
            return ""

        formatted = "\n".join([f"- {item}" for item in unique_items])
        return f"BLACKLIST (do NOT repeat these questions or topics):\n{formatted}\n\n"

    @classmethod
    def build_user_prompt(
        cls,
        document_content: str,
        filename: str = "document.pdf",
        num_questions: int = 5,
        difficulty: str = "MEDIUM",
        question_type: str = "multiple",
        language: str = "en",
        existing_questions: Optional[List[str]] = None,
        deleted_blacklist: Optional[List[str]] = None,
        custom_prompt: Optional[str] = None
    ) -> str:
        dedup_block = cls.build_deduplication_block(existing_questions, deleted_blacklist)
        target_language = cls.resolve_target_language(language, custom_prompt)

        type_desc = {
            "multiple": "multiple choice (4 options)",
            "truefalse": "true/false",
            "short": "short answer / fill-in",
            "all": "mixed variety (multiple choice, true/false, short answer)"
        }.get(question_type, question_type)

        return (
            f"Generate {num_questions} {type_desc} questions.\n"
            f"Target difficulty: {difficulty}.\n"
            f"MANDATORY TARGET LANGUAGE: {target_language}. You MUST generate all question contents, options, and explanations in {target_language}.\n"
            f"Source: {filename}.\n\n"
            f"{dedup_block}"
            "Required JSON format: {\"questions\":[{\"content\":\"...\",\"type\":\"multiple|truefalse|short\","
            "\"difficulty\":\"EASY|MEDIUM|HARD\",\"bloom_level\":\"remember|understand|apply|analyze\","
            "\"time_limit\":60,\"points\":1.0,\"source\":\"Page X\",\"explanation\":\"...\","
            "\"options\":[{\"content\":\"...\",\"is_correct\":true/false}],"
            "\"keyword\":\"...(short only)\",\"acceptable_answers\":[\"...(short only)\"]}]}\n\n"
            "DOCUMENT & USER INSTRUCTIONS:\n"
            f"\"\"\"\n{document_content}\n\"\"\""
        )

