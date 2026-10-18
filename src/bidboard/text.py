"""Tokenization shared by the Python engine and (via the mirrored logic) the
TypeScript implementation. Constants live in data/scoring-config.json."""

from __future__ import annotations

import json
import re
from pathlib import Path

_CONFIG_PATH = Path(__file__).resolve().parents[2] / "data" / "scoring-config.json"


def load_config(path: Path | None = None) -> dict:
    return json.loads((path or _CONFIG_PATH).read_text(encoding="utf-8"))


_CONFIG = load_config()
STOPWORDS: frozenset[str] = frozenset(_CONFIG["stopwords"])
MIN_TOKEN_LENGTH: int = _CONFIG["min_token_length"]
_PHRASE_MIN: int = _CONFIG["exact_phrase_min_words"]

_NON_ALNUM = re.compile(r"[^a-z0-9\s]")


def normalize(text: str) -> str:
    """Lowercase and drop every non-alphanumeric character to a space."""
    return _NON_ALNUM.sub(" ", (text or "").lower())


def tokenize(text: str) -> list[str]:
    """Ordered token list: normalized, stopwords and short tokens dropped.

    Order matters: the exact-phrase feature needs the token sequence.
    """
    return [
        tok
        for tok in normalize(text).split()
        if tok not in STOPWORDS and len(tok) >= MIN_TOKEN_LENGTH
    ]


def token_set(text: str) -> set[str]:
    return set(tokenize(text))


def token_bigrams(tokens: list[str]) -> set[str]:
    return {" ".join(pair) for pair in zip(tokens, tokens[1:])}


def longest_shared_phrase_len(a: list[str], b: list[str]) -> int:
    """Length of the longest contiguous token run shared by both sequences."""
    if not a or not b:
        return 0
    b_index: dict[str, list[int]] = {}
    for j, tok in enumerate(b):
        b_index.setdefault(tok, []).append(j)
    best = 0
    for i, tok in enumerate(a):
        for j in b_index.get(tok, ()):  # noqa: B007 (used via j)
            run = 0
            while i + run < len(a) and j + run < len(b) and a[i + run] == b[j + run]:
                run += 1
            if run > best:
                best = run
    return best
