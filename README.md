# Bidboard — the RFP response desk

**Live:** https://ai-rfp-response-agent.web.app · **Repo:** github.com/tidaaartorhem/ai-rfp-response-agent

Solutions engineers and sales teams burn days answering 100+ question RFP questionnaires by copy-pasting from stale documents. Answers drift across bids, requirements get missed entirely, and nobody can say which answers are actually approved. Every RFP tool on the market is a chatbot over your docs — it will happily invent an answer to a question nobody approved. Bidboard is the opposite: a deterministic compliance matrix that refuses to invent answers. Each requirement is scored against the vendor's approved answer library with disclosed weights; anything below the bar goes to a subject-matter-expert queue, and deviations sit behind a human gate. What you submit is always something a human approved.

1. **Compliance matrix** — 78 real requirements from a public county ERP RFP, rolled up per RFP section: answered count, coverage, average confidence, and the gap list.
2. **SME queue** — 23 below-bar matches routed to experts (never auto-filled) plus 4 requirements with no approved answer at all, each showing the best candidate, its owner, and why it scored the way it did.
3. **Deviation register** — every requirement carries a disposition: Comply, Partially comply, Deviate, or Unaddressed. Deviate requires a human gate.
4. **Approved answer library** — 70 seeded vendor answers with named owners and keywords; every match cites the entry id and owner.
5. **Golden-set eval** — 30 hand-labeled requirements reporting routing accuracy, entry precision, and entry recall, disclosed with the misses.
6. **Paste a requirement** — the same matcher runs in the browser against the bundled library: identical numbers, no server, no LLM.

**Human-gated, everywhere:** Bidboard stages the recommendation; a person approves it. There are no LLM calls anywhere in this project.

## The deep-rooted pain

- **Answer drift across bids.** The same security question gets three different answers in three proposals because each bid team copy-pastes from a different deck. A single approved library with named owners ends the drift.
- **Missed requirements hide in long questionnaires.** In a 78-requirement RFP, the four with no approved answer are the ones that lose the bid — or worse, get answered with invented text. The gap list makes them visible before submission.
- **Chatbots invent; matrices refuse.** A chatbot over your docs will answer the calendar-deadline question with something plausible. Bidboard scores it 21.9, routes it to NO_ANSWER, and puts it in front of a human.
- **Nobody can say what was approved.** Every match cites entry id + owner + confidence + the shared keywords behind the score. The deviation register is the audit trail.

## How the matching works (disclosed, deterministic)

`match_requirement()` is a pure function — same requirement, same library, same numbers, every run, in Python and in the browser.

**Scoring** (weights in `data/scoring-config.json`):

| Component | Points | Rule |
|---|---|---|
| Keyword overlap | 55 × (|R ∩ E| / |R|) | R = requirement tokens, E = entry (title + keywords + answer) tokens |
| Exact phrase | +20 | a run of ≥ 3 requirement tokens appears contiguously in the entry text |
| Bigram overlap | 10 × (|bigrams(R) ∩ bigrams(E)| / |bigrams(R)|) | adjacent token pairs |
| Category boost | +15 | requirement and entry share a category |

Tokenization: lowercase, non-alphanumerics to spaces, stopwords and tokens shorter than 3 characters dropped (stoplist in `data/scoring-config.json`). Score capped at 100, rounded to 1 decimal exactly like Python's `round(x, 1)` (ties to even; the TS mirror implements the same rounding). Ties break on entry id.

**Actions** (thresholds disclosed in the same config):

| Confidence | Action | Register disposition |
|---|---|---|
| ≥ 80 | SUBMIT_AS_IS | COMPLY |
| 60–79 | EDIT_THEN_SUBMIT | PARTIALLY_COMPLY |
| 40–59 | SME_NEEDED | DEVIATE — human gate required |
| < 40 | NO_ANSWER | UNADDRESSED |

**Compliance matrix:** per RFP section — total requirements, answered count, coverage %, average confidence (answered only), disposition counts, and the gap list (SME_NEEDED + NO_ANSWER ids).

**Disclosed implementation choice:** the in-browser TypeScript mirror (`web/src/rules.ts`) implements the identical tokenizer, scorer, and action rules; `data/test-vectors.json` keeps both implementations in exact agreement (tested on both sides, 8 vectors). Full-corpus matching, the matrix, and the golden-set eval are Python-only because the payload is pipeline-generated at build time.

## The data

- **Real RFP:** 78 requirements condensed from Shenandoah County, Virginia — *Request for Proposals: Integrated Enterprise Software Systems and Implementation Services*, RFP 2025-002 (issued 2025-03-31), a public procurement document: https://www.shenandoahcountyva.gov/DocumentCenter/View/3178/RFP-2025-002---Integrated-Enterprise-Software-Systems-and-Implementation-Services-PDF?bidId= — fetched with `scripts/fetch_rfp.py` (pdfplumber extraction; the 87-page PDF is kept at `data/raw/rfp-2025-002.pdf`). Each requirement keeps its RFP section and its Mandatory/Desired priority. The RFP's detailed per-module matrices (Attachment 1, distributed as vendor-only workbooks) could not be fetched and are out of scope; the slice covers the RFP body: scope, submittal, qualifications, staffing, implementation, support, information security, disaster recovery, data retention, availability/service management, and general terms.
- **Seeded (disclosed):** the 70-entry approved answer library is the vendor's own standing content — written as the reusable answers a solutions team would keep. This is the product's input data (like a vendor playbook), not a claim about any real company.
- **Golden set:** 30 hand-labeled rows (`data/golden_set.json`): expected library entry, or NONE when no entry should clear the 40-point bar. Three rows are labeled against the engine's top-1 as known misses. Current results: routing accuracy 90.0%, entry precision 96.2%, entry recall 89.3%.

Headline numbers on this RFP: 74 of 78 requirements answered (94.9% coverage), average confidence 66.6 on answered rows, 23 in the gated SME queue, 4 with no approved answer.

## Project layout

```
data/
  raw/rfp-2025-002.pdf        the real RFP (public procurement document)
  requirements.json           78 curated requirements + source provenance
  answer_library.json         70 seeded vendor answers (disclosed as seeded)
  scoring-config.json         weights, thresholds, stoplist (shared contract)
  golden_set.json             30 hand-labeled eval rows
  test-vectors.json           Python<->TS agreement contract (8 vectors)
src/bidboard/                 deterministic engine (stdlib only)
  text.py                     tokenizer shared with the TS mirror
  matcher.py                  disclosed scoring + best-match selection
  actions.py                  thresholds, deviation register, human gate
  matrix.py                   compliance matrix + summary
  eval.py                     golden-set precision/recall
  pipeline.py                 end-to-end run -> data/outputs/
scripts/
  fetch_rfp.py                one-time RFP download + text extraction
  build_bidboard.py           pipeline -> web/public/data/*.json + stamp
tests/                        25 pytest tests (tokenizer, scorer, actions,
                              matrix, eval, contract vectors)
web/                          React + TypeScript frontend (light mode)
  src/rules.ts                in-browser mirror of the engine
  src/rules.test.ts           contract-vector agreement tests (vitest)
  src/views/                  Matrix, SME queue, Library, Paste-a-requirement
```

## Reproduce

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
PYTHONPATH=src .venv/bin/python -m pytest tests/   # 25 green
PYTHONPATH=src .venv/bin/python -m bidboard.pipeline
cd web && npm install && npm test                  # 10 green (incl. 8 contract vectors)
npm run build                                      # pipeline + bundle
```

No API keys, no network calls at runtime, no LLMs. The pipeline runs on the standard library; only the one-time RFP fetch needs pdfplumber.
