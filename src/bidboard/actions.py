"""Actions and the deviation register.

Thresholds come from data/scoring-config.json:
  confidence >= submit_as_is     -> SUBMIT_AS_IS     (COMPLY)
  confidence >= edit_then_submit  -> EDIT_THEN_SUBMIT (PARTIALLY_COMPLY)
  confidence >= sme_needed        -> SME_NEEDED       (DEVIATE, human-gated)
  otherwise                      -> NO_ANSWER        (UNADDRESSED)

Bidboard never invents an answer: below-threshold matches go to the SME
queue, and DEVIATE rows require a human gate before anything is submitted.
"""

from __future__ import annotations

from bidboard.text import load_config

_TH = load_config()["thresholds"]

SUBMIT_AS_IS = "SUBMIT_AS_IS"
EDIT_THEN_SUBMIT = "EDIT_THEN_SUBMIT"
SME_NEEDED = "SME_NEEDED"
NO_ANSWER = "NO_ANSWER"

DISPOSITION_FOR_ACTION = {
    SUBMIT_AS_IS: "COMPLY",
    EDIT_THEN_SUBMIT: "PARTIALLY_COMPLY",
    SME_NEEDED: "DEVIATE",
    NO_ANSWER: "UNADDRESSED",
}

ACTION_LABELS = {
    SUBMIT_AS_IS: "Submit the approved answer as-is",
    EDIT_THEN_SUBMIT: "Edit the approved answer, then submit",
    SME_NEEDED: "Route to a subject-matter expert — do not auto-fill",
    NO_ANSWER: "No approved answer exists — gap",
}


def decide_action(confidence: float) -> str:
    if confidence >= _TH["submit_as_is"]:
        return SUBMIT_AS_IS
    if confidence >= _TH["edit_then_submit"]:
        return EDIT_THEN_SUBMIT
    if confidence >= _TH["sme_needed"]:
        return SME_NEEDED
    return NO_ANSWER


def disposition_for(action: str) -> str:
    return DISPOSITION_FOR_ACTION[action]


def needs_human_gate(disposition: str) -> bool:
    """Only DEVIATE rows require a human gate; nothing auto-submits them."""
    return disposition == "DEVIATE"
