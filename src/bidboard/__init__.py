"""Bidboard — the RFP response desk.

Deterministic, disclosed matching of RFP requirements against an approved
answer library. No LLM calls anywhere.
"""

from bidboard.text import longest_shared_phrase_len, tokenize, token_bigrams
from bidboard.matcher import match_requirement, score_requirement
from bidboard.actions import decide_action, disposition_for, needs_human_gate

__all__ = [
    "tokenize",
    "token_bigrams",
    "longest_shared_phrase_len",
    "score_requirement",
    "match_requirement",
    "decide_action",
    "disposition_for",
    "needs_human_gate",
]
