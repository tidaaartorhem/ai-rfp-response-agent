"""Parity tests against the shared rule contract data/test-vectors.json.

The in-browser TypeScript mirror must reproduce the same expected values;
this file keeps the Python side pinned to the contract.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from bidboard.actions import decide_action, disposition_for
from bidboard.matcher import match_requirement

VECTORS = json.loads(
    (Path(__file__).resolve().parents[1] / "data" / "test-vectors.json")
    .read_text(encoding="utf-8"))["vectors"]


def evaluate(vector: dict) -> dict:
    inp = vector["input"]
    req = {
        "id": vector["id"],
        "text": inp["requirement_text"],
        "category": inp["category"],
    }
    m = match_requirement(req, inp["library"])
    action = decide_action(m["confidence"])
    disposition = disposition_for(action)
    return {
        "entry_id": m["entry_id"],
        "confidence": m["confidence"],
        "action": action,
        "disposition": disposition,
        "needs_gate": disposition == "DEVIATE",
    }


@pytest.mark.parametrize("vector", VECTORS, ids=[v["id"] for v in VECTORS])
def test_vector_matches_contract(vector):
    assert evaluate(vector) == vector["expected"]
