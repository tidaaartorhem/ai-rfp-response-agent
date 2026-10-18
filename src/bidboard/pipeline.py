"""End-to-end Bidboard pipeline: match every requirement, build the
compliance matrix, run the golden-set eval, write outputs."""

from __future__ import annotations

import json
from pathlib import Path

from bidboard.eval import evaluate
from bidboard.matrix import build_matches, build_matrix, summarize

ROOT = Path(__file__).resolve().parents[2]


def load_json(name: str) -> dict:
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


def run(out_dir: Path | None = None) -> dict:
    requirements = load_json("requirements.json")["requirements"]
    library = load_json("answer_library.json")["entries"]
    golden = json.loads((ROOT / "data" / "golden_set.json").read_text())["rows"]

    matches = build_matches(requirements, library)
    matrix = build_matrix(matches)
    summary = summarize(matches, matrix)
    by_req = {m["requirement_id"]: m for m in matches}
    eval_result = evaluate(golden, by_req)

    result = {
        "summary": summary,
        "matrix": matrix,
        "matches": matches,
        "eval": eval_result,
        "library_size": len(library),
    }
    if out_dir is not None:
        out_dir.mkdir(parents=True, exist_ok=True)
        for name in ("summary", "matrix", "matches", "eval"):
            (out_dir / f"{name}.json").write_text(
                json.dumps(result[name], indent=2), encoding="utf-8"
            )
    return result


if __name__ == "__main__":
    res = run(ROOT / "data" / "outputs")
    s = res["summary"]
    print(
        f"{s['total_requirements']} requirements, {s['answered']} answered "
        f"({s['coverage_pct']}%), {s['deviate_needs_gate']} gated, "
        f"{s['unaddressed']} unaddressed; eval routing accuracy "
        f"{res['eval']['routing_accuracy']}"
    )
