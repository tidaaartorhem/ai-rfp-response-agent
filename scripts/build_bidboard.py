"""Build script: runs the Bidboard pipeline and assembles the web payload.

Reads the real RFP requirements (data/requirements.json, extracted from
Shenandoah County RFP 2025-002), the seeded vendor answer library, matches
every requirement, and writes web/public/data/*.json plus a build stamp.
Exits non-zero if the pipeline produced no matches.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
PUBLIC_DATA = WEB / "public" / "data"
SRC = ROOT / "src"


def fail(msg: str) -> None:
    print(f"build_bidboard: {msg}", file=sys.stderr)
    sys.exit(1)


def git_sha() -> str:
    try:
        return subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except Exception:
        return "unknown"


def main() -> None:
    sys.path.insert(0, str(SRC))
    from datetime import datetime, timezone

    from bidboard.pipeline import run

    res = run(ROOT / "data" / "outputs")
    if not res["matches"]:
        fail("pipeline produced no matches")

    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
    for name in ("summary", "matrix", "matches", "eval"):
        shutil.copy(ROOT / "data" / "outputs" / f"{name}.json", PUBLIC_DATA / f"{name}.json")
    shutil.copy(ROOT / "data" / "requirements.json", PUBLIC_DATA / "requirements.json")
    shutil.copy(ROOT / "data" / "answer_library.json", PUBLIC_DATA / "answer_library.json")
    shutil.copy(ROOT / "data" / "test-vectors.json", PUBLIC_DATA / "test-vectors.json")

    stamp = {
        "repo": "tidaaartorhem/ai-rfp-response-agent",
        "git_sha": git_sha(),
        "built_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    (PUBLIC_DATA / "stamp.json").write_text(json.dumps(stamp, indent=2), encoding="utf-8")
    s = res["summary"]
    print(
        f"build_bidboard: {s['total_requirements']} requirements matched, "
        f"{s['coverage_pct']}% coverage, eval routing accuracy "
        f"{res['eval']['routing_accuracy']} (sha {stamp['git_sha']})"
    )


if __name__ == "__main__":
    main()
