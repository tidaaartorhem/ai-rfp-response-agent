"""Tests for actions, the deviation register, and the human gate."""

from bidboard.actions import (
    EDIT_THEN_SUBMIT,
    NO_ANSWER,
    SME_NEEDED,
    SUBMIT_AS_IS,
    decide_action,
    disposition_for,
    needs_human_gate,
)


def test_threshold_bands():
    assert decide_action(100) == SUBMIT_AS_IS
    assert decide_action(80) == SUBMIT_AS_IS
    assert decide_action(79.9) == EDIT_THEN_SUBMIT
    assert decide_action(60) == EDIT_THEN_SUBMIT
    assert decide_action(59.9) == SME_NEEDED
    assert decide_action(40) == SME_NEEDED
    assert decide_action(39.9) == NO_ANSWER
    assert decide_action(0) == NO_ANSWER


def test_disposition_register():
    assert disposition_for(SUBMIT_AS_IS) == "COMPLY"
    assert disposition_for(EDIT_THEN_SUBMIT) == "PARTIALLY_COMPLY"
    assert disposition_for(SME_NEEDED) == "DEVIATE"
    assert disposition_for(NO_ANSWER) == "UNADDRESSED"


def test_only_deviate_needs_human_gate():
    assert needs_human_gate("DEVIATE") is True
    assert needs_human_gate("COMPLY") is False
    assert needs_human_gate("PARTIALLY_COMPLY") is False
    assert needs_human_gate("UNADDRESSED") is False
