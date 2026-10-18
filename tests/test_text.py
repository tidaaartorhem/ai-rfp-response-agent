"""Tests for tokenization (must stay identical to the TS mirror)."""

from bidboard.text import longest_shared_phrase_len, token_bigrams, tokenize


def test_tokenize_lowercases_and_drops_stopwords():
    assert tokenize("The vendor MUST provide Monthly Uptime Reports") == [
        "vendor",
        "provide",
        "monthly",
        "uptime",
        "reports",
    ]


def test_tokenize_drops_short_tokens_and_punctuation():
    assert tokenize("PCI DSS, HIPAA: ok!") == ["pci", "dss", "hipaa"]


def test_tokenize_empty():
    assert tokenize("") == []
    assert tokenize("the and of") == []


def test_bigrams():
    assert token_bigrams(["a", "b", "c"]) == {"a b", "b c"}
    assert token_bigrams(["a"]) == set()


def test_longest_shared_phrase_len():
    a = ["monthly", "uptime", "reports", "dashboard"]
    b = ["publish", "monthly", "uptime", "reports"]
    assert longest_shared_phrase_len(a, b) == 3
    assert longest_shared_phrase_len(a, ["nothing", "shared"]) == 0
    assert longest_shared_phrase_len([], b) == 0
