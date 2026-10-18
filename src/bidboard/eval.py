"""Golden-set evaluation: hand-labeled requirement -> expected outcome.

Each golden row labels a requirement with either an expected library entry
id or "NONE" (no library entry should clear the 40-point SME bar). The
engine predicts an entry only when the best match clears the SME bar.

Reported metrics:
  routing precision = correct predictions / predictions made
  routing recall    = correct predictions / golden rows
  entry precision   = correct entry predictions / rows where an entry was predicted
  entry recall      = correct entry predictions / rows labeled with an entry
"""

from __future__ import annotations

from bidboard.text import load_config

_SME_BAR = load_config()["thresholds"]["sme_needed"]


def predict(match: dict) -> str:
    """Engine's observable prediction for one requirement."""
    return match["entry_id"] if match["confidence"] >= _SME_BAR else "NONE"


def evaluate(golden: list[dict], matches_by_req: dict[str, dict]) -> dict:
    total = len(golden)
    correct = 0
    predicted_entry_rows = 0
    labeled_entry_rows = 0
    correct_entries = 0
    per_row = []
    for row in golden:
        req_id = row["requirement_id"]
        expected = row["expected"]
        got = predict(matches_by_req[req_id])
        ok = got == expected
        correct += ok
        if got != "NONE":
            predicted_entry_rows += 1
        if expected != "NONE":
            labeled_entry_rows += 1
        if ok and expected != "NONE":
            correct_entries += 1
        per_row.append(
            {
                "requirement_id": req_id,
                "expected": expected,
                "predicted": got,
                "confidence": matches_by_req[req_id]["confidence"],
                "correct": ok,
            }
        )
    return {
        "rows": total,
        "correct": correct,
        "routing_accuracy": round(correct / total, 4) if total else 0.0,
        "entry_precision": round(correct_entries / predicted_entry_rows, 4)
        if predicted_entry_rows
        else 0.0,
        "entry_recall": round(correct_entries / labeled_entry_rows, 4)
        if labeled_entry_rows
        else 0.0,
        "per_row": per_row,
    }
