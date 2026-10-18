"""Tests for the compliance matrix and the golden-set eval."""

from bidboard.eval import evaluate, predict
from bidboard.matrix import build_matrix, summarize


def _m(rid, section, action, conf, disp):
    return {
        "requirement_id": rid,
        "section": section,
        "action": action,
        "confidence": conf,
        "disposition": disp,
        "needs_gate": disp == "DEVIATE",
    }


MATCHES = [
    _m("R1", "Security", "SUBMIT_AS_IS", 90.0, "COMPLY"),
    _m("R2", "Security", "EDIT_THEN_SUBMIT", 70.0, "PARTIALLY_COMPLY"),
    _m("R3", "Security", "SME_NEEDED", 50.0, "DEVIATE"),
    _m("R4", "Staffing", "NO_ANSWER", 20.0, "UNADDRESSED"),
]


def test_build_matrix_sections():
    matrix = build_matrix(MATCHES)
    sec = matrix["Security"]
    assert sec["total"] == 3
    assert sec["answered"] == 3
    assert sec["comply"] == 1 and sec["partially_comply"] == 1 and sec["deviate"] == 1
    assert sec["avg_confidence"] == 70.0
    assert sec["coverage_pct"] == 100.0
    assert sec["gaps"] == ["R3"]
    assert matrix["Staffing"]["unaddressed"] == 1
    assert matrix["Staffing"]["gaps"] == ["R4"]


def test_summarize():
    s = summarize(MATCHES, build_matrix(MATCHES))
    assert s["total_requirements"] == 4
    assert s["answered"] == 3
    assert s["coverage_pct"] == 75.0
    assert s["deviate_needs_gate"] == 1
    assert s["unaddressed"] == 1


def test_predict_uses_sme_bar():
    assert predict({"entry_id": "ANS-1", "confidence": 40.0}) == "ANS-1"
    assert predict({"entry_id": "ANS-1", "confidence": 39.9}) == "NONE"


def test_evaluate_metrics():
    golden = [
        {"requirement_id": "R1", "expected": "ANS-1"},
        {"requirement_id": "R2", "expected": "ANS-9"},  # engine said ANS-2
        {"requirement_id": "R4", "expected": "NONE"},
    ]
    by_req = {
        "R1": {"entry_id": "ANS-1", "confidence": 90.0},
        "R2": {"entry_id": "ANS-2", "confidence": 70.0},
        "R4": {"entry_id": "ANS-3", "confidence": 20.0},
    }
    e = evaluate(golden, by_req)
    assert e["rows"] == 3 and e["correct"] == 2
    assert e["routing_accuracy"] == round(2 / 3, 4)
    assert e["entry_precision"] == 0.5  # 1 right of 2 predicted entries
    assert e["entry_recall"] == 0.5  # 1 right of 2 labeled entries
