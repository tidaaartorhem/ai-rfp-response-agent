"""Tests for the disclosed scoring formula."""

from bidboard.matcher import match_requirement, score_requirement

ENTRY = {
    "id": "ANS-A",
    "owner": "Support Operations",
    "category": "availability",
    "title": "Monthly uptime reports and status dashboard",
    "keywords": ["uptime", "reports", "monthly", "status", "dashboard"],
    "answer": "We publish monthly uptime reports and maintain a real-time service status dashboard.",
}


def test_exact_phrase_and_category_boost_score_high():
    s = score_requirement("monthly uptime reports", "availability", ENTRY)
    assert s["confidence"] >= 80
    assert s["exact_phrase_hit"] is True
    assert s["category_boost_applied"] is True


def test_category_mismatch_drops_boost():
    s = score_requirement(
        "The vendor must provide monthly uptime reports.", "contract", ENTRY
    )
    assert s["category_boost_applied"] is False


def test_no_overlap_scores_zeroish():
    s = score_requirement("Purple elephants dance at midnight.", "scope", ENTRY)
    assert s["confidence"] < 40
    assert s["shared_keywords"] == []


def test_score_capped_at_100():
    entry = dict(ENTRY, answer="monthly uptime reports " * 20)
    s = score_requirement("monthly uptime reports", "availability", entry)
    assert s["confidence"] <= 100


def test_match_picks_best_and_breaks_ties_by_id():
    req = {"id": "R1", "text": "monthly uptime reports", "category": "availability"}
    other = dict(ENTRY, id="ANS-Z")
    m = match_requirement(req, [other, ENTRY])
    assert m["entry_id"] == "ANS-A"  # identical score -> lower id wins
    assert m["entry_owner"] == "Support Operations"
    assert "confidence" in m and "breakdown" in m
