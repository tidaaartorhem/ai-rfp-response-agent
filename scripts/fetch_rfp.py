"""One-time fetch: downloads the real RFP PDF and extracts its text.

Source: Shenandoah County, Virginia — RFP 2025-002, Integrated Enterprise
Software Systems and Implementation Services (issued 2025-03-31).
Public DocumentCenter URL, no auth. Writes data/raw/rfp-2025-002.pdf and
data/raw/rfp-text.txt. Requirement curation from the extracted text is
documented in data/requirements.json.
"""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

RFP_URL = (
    "https://www.shenandoahcountyva.gov/DocumentCenter/View/3178/"
    "RFP-2025-002---Integrated-Enterprise-Software-Systems-and-"
    "Implementation-Services-PDF?bidId="
)
RAW = Path(__file__).resolve().parents[1] / "data" / "raw"


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    pdf_path = RAW / "rfp-2025-002.pdf"
    print(f"fetch_rfp: downloading {RFP_URL}")
    req = urllib.request.Request(RFP_URL, headers={"User-Agent": "bidboard-build/1.0"})
    with urllib.request.urlopen(req, timeout=120) as resp, open(pdf_path, "wb") as fh:
        fh.write(resp.read())
    print(f"fetch_rfp: wrote {pdf_path} ({pdf_path.stat().st_size} bytes)")
    try:
        import pdfplumber
    except ImportError:
        print("fetch_rfp: pdfplumber not installed; PDF saved, text extraction skipped")
        sys.exit(0)
    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    (RAW / "rfp-text.txt").write_text(text, encoding="utf-8")
    print(f"fetch_rfp: extracted {len(text)} chars to rfp-text.txt")


if __name__ == "__main__":
    main()
