"""Compliance matrix: per-section rollup of the requirement-level matches."""

from __future__ import annotations

from bidboard.actions import NO_ANSWER, SME_NEEDED, decide_action, disposition_for


def build_matches(requirements: list[dict], library: list[dict]) -> list[dict]:
    from bidboard.matcher import match_requirement

    rows = []
    for req in requirements:
        m = match_requirement(req, library)
        action = decide_action(m["confidence"])
        disposition = disposition_for(action)
        rows.append(
            {
                "requirement_id": req["id"],
                "section": req["section"],
                "category": req["category"],
                "priority": req["priority"],
                "requirement_text": req["text"],
                "entry_id": m["entry_id"],
                "entry_owner": m["entry_owner"],
                "entry_title": m["entry_title"],
                "confidence": m["confidence"],
                "action": action,
                "disposition": disposition,
                "needs_gate": disposition == "DEVIATE",
                "score_breakdown": m["breakdown"],
            }
        )
    return rows


def build_matrix(matches: list[dict]) -> dict:
    """Per-section: counts, average confidence (answered only), and gaps."""
    sections: dict[str, dict] = {}
    for m in matches:
        sec = sections.setdefault(
            m["section"],
            {
                "total": 0,
                "answered": 0,
                "comply": 0,
                "partially_comply": 0,
                "deviate": 0,
                "unaddressed": 0,
                "confidence_sum": 0.0,
                "gaps": [],
            },
        )
        sec["total"] += 1
        if m["action"] != NO_ANSWER:
            sec["answered"] += 1
            sec["confidence_sum"] += m["confidence"]
        if m["disposition"] == "COMPLY":
            sec["comply"] += 1
        elif m["disposition"] == "PARTIALLY_COMPLY":
            sec["partially_comply"] += 1
        elif m["disposition"] == "DEVIATE":
            sec["deviate"] += 1
        else:
            sec["unaddressed"] += 1
        if m["action"] in (SME_NEEDED, NO_ANSWER):
            sec["gaps"].append(m["requirement_id"])
    for sec in sections.values():
        answered = sec["answered"]
        sec["coverage_pct"] = round(100.0 * answered / sec["total"], 1) if sec["total"] else 0.0
        sec["avg_confidence"] = (
            round(sec["confidence_sum"] / answered, 1) if answered else 0.0
        )
        del sec["confidence_sum"]
    return sections


def summarize(matches: list[dict], matrix: dict) -> dict:
    total = len(matches)
    answered = sum(1 for m in matches if m["action"] != NO_ANSWER)
    gated = sum(1 for m in matches if m["needs_gate"])
    return {
        "total_requirements": total,
        "answered": answered,
        "coverage_pct": round(100.0 * answered / total, 1) if total else 0.0,
        "deviate_needs_gate": gated,
        "unaddressed": sum(1 for m in matches if m["action"] == NO_ANSWER),
        "avg_confidence_answered": round(
            sum(m["confidence"] for m in matches if m["action"] != NO_ANSWER)
            / answered,
            1,
        )
        if answered
        else 0.0,
        "sections": len(matrix),
    }
