import random
from typing import List, Tuple, Optional, Any


def format_question_options(
    options: List[Any],
    should_shuffle: bool = False,
    seed: Optional[int] = None
) -> Tuple[List[dict], Optional[str]]:
    """
    Formats a list of QuestionOption objects into live option dictionaries with keys ('A', 'B', 'C', 'D')
    and returns (options_live, correct_option_key).
    If should_shuffle is True, options order is randomized using the given seed.
    """
    KEYS = ["A", "B", "C", "D"]
    opts_list = sorted(options or [], key=lambda o: getattr(o, "id", 0))

    if should_shuffle and len(opts_list) > 1:
        if seed is not None:
            r = random.Random(seed)
            r.shuffle(opts_list)
        else:
            random.shuffle(opts_list)

    options_live = []
    correct_option_key = None
    for idx, opt in enumerate(opts_list):
        key = KEYS[idx] if idx < len(KEYS) else KEYS[idx % len(KEYS)]
        options_live.append({
            "id": getattr(opt, "id", None),
            "key": key,
            "label": getattr(opt, "content", "") or ""
        })
        if getattr(opt, "is_correct", False):
            correct_option_key = key

    return options_live, correct_option_key


def get_shuffle_seed(room_id: int, question_id: int, nickname: Optional[str] = None) -> int:
    """
    Calculates a normalized, consistent shuffle seed based on room_id, question_id, and nickname.
    """
    clean_nick = nickname.strip().lower() if nickname else ""
    seed_offset = sum(ord(c) for c in clean_nick) if clean_nick else 0
    return (room_id * 10007) + (question_id * 97) + seed_offset
