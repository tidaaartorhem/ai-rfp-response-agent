"""Disclosed requirement-to-answer scoring.

confidence = keyword_overlap_points * (|R cap E| / |R|)
           + exact_phrase_points   (if a run of >= exact_phrase_min_words
                                    requirement tokens appears contiguously
                                    in the entry text)
           + bigram_points         * (|bigrams(R) cap bigrams(E)| / |bigrams(R)|)
           + category_boost        (if requirement and entry share a category)
capped at 100, rounded to 1 decimal. Ties break on entry id for
determinism.
"""

from __future__ import annotations

from bidboard.text import (
    longest_shared_phrase_len,
    load_config,
    token_bigrams,
    token_set,
    tokenize,
)

_CONFIG = load_config()
KW_POINTS = _CONFIG["keyword_overlap_points"]
PHRASE_POINTS = _CONFIG["exact_phrase_points"]
PHRASE_MIN = _CONFIG["exact_phrase_min_words"]
BIGRAM_POINTS = _CONFIG["bigram_points"]
CAT_BOOST = _CONFIG["category_boost"]


def entry_text(entry: dict) -> str:
    return " ".join(
        [entry.get("title", ""), " ".join(entry.get("keywords", [])), entry.get("answer", "")]
    )


def score_requirement(req_text: str, req_category: str, entry: dict) -> dict:
    r_toks = tokenize(req_text)
    e_toks = tokenize(entry_text(entry))
    r_set, e_set = set(r_toks), set(e_toks)

    overlap = len(r_set & e_set) / len(r_set) if r_set else 0.0
    base = KW_POINTS * overlap

    phrase_hit = longest_shared_phrase_len(r_toks, e_toks) >= PHRASE_MIN
    phrase = PHRASE_POINTS if phrase_hit else 0.0

    r_bi, e_bi = token_bigrams(r_toks), token_bigrams(e_toks)
    bigram = BIGRAM_POINTS * (len(r_bi & e_bi) / len(r_bi)) if r_bi else 0.0

    cat = CAT_BOOST if entry.get("category") == req_category else 0.0

    confidence = round(min(100.0, base + phrase + bigram + cat), 1)
    return {
        "confidence": confidence,
        "keyword_overlap": round(overlap, 4),
        "exact_phrase_hit": phrase_hit,
        "category_boost_applied": entry.get("category") == req_category,
        "shared_keywords": sorted(r_set & e_set),
    }


def match_requirement(req: dict, library: list[dict]) -> dict:
    """Best library entry for one requirement, with full score breakdown."""
    scored = [
        (score_requirement(req["text"], req["category"], entry), entry)
        for entry in library
    ]
    scored.sort(key=lambda pair: (-pair[0]["confidence"], pair[1]["id"]))
    best_score, best_entry = scored[0]
    return {
        "requirement_id": req["id"],
        "entry_id": best_entry["id"],
        "entry_owner": best_entry["owner"],
        "entry_title": best_entry["title"],
        "confidence": best_score["confidence"],
        "breakdown": {
            "keyword_overlap": best_score["keyword_overlap"],
            "exact_phrase_hit": best_score["exact_phrase_hit"],
            "category_boost_applied": best_score["category_boost_applied"],
            "shared_keywords": best_score["shared_keywords"],
        },
    }
