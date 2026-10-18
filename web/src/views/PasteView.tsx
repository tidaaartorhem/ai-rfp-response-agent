import { useMemo, useState } from "react";
import type { BidboardData } from "../data";
import { ACTION_LABELS, DISPOSITION_LABELS, matchRequirement } from "../rules";
import { ConfidenceBar } from "./shared";

const CATS = ["scope","submittal","qualifications","staffing","implementation","support","security","dr","retention","availability","contract"];

/** Paste a requirement; the same matcher runs in the browser against the bundled library. */
export default function PasteView({ data }: { data: BidboardData }) {
  const [text, setText] = useState(
    "The vendor must provide monthly uptime reports and real-time service status dashboards."
  );
  const [cat, setCat] = useState("availability");
  const library = data.library.entries;

  const result = useMemo(() => {
    if (!text.trim() || library.length === 0) return null;
    return matchRequirement("PASTE-1", text, cat, library);
  }, [text, cat, library]);

  const entry = result ? library.find((e) => e.id === result.entry_id) : null;

  return (
    <div>
      <div className="card">
        <h2>Paste a requirement</h2>
        <p className="muted">
          Runs the exact same deterministic matcher in your browser against the
          bundled answer library — no server, no LLM, same numbers as the Python pipeline.
        </p>
        <textarea
          className="input textarea"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste one RFP requirement…"
        />
        <div className="filters">
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            {CATS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {result && entry && (
        <div className="card">
          <div className="match-head">
            <span className="pill neutral">{result.confidence}% confidence</span>
            <span className="pill neutral">{ACTION_LABELS[result.action]}</span>
            <span className="pill neutral">{DISPOSITION_LABELS[result.disposition]}</span>
            {result.needs_gate && <span className="pill gate">human gate required</span>}
          </div>
          <ConfidenceBar value={result.confidence} />
          <p>
            <b>{result.entry_id}</b> — {entry.title}
          </p>
          <p className="req-text">{entry.answer}</p>
          <div className="muted small">Owner: {entry.owner}</div>
          <h3>Why this score</h3>
          <table className="table">
            <tbody>
              <tr><td>Keyword overlap</td><td>{(result.breakdown.keyword_overlap * 100).toFixed(1)}% of requirement tokens × 55 pts</td></tr>
              <tr><td>Exact phrase (≥3 words)</td><td>{result.breakdown.exact_phrase_hit ? "hit — +20 pts" : "no hit"}</td></tr>
              <tr><td>Category boost</td><td>{result.breakdown.category_boost_applied ? "same category — +15 pts" : "different category"}</td></tr>
              <tr><td>Shared keywords</td><td>{result.breakdown.shared_keywords.join(", ") || "—"}</td></tr>
            </tbody>
          </table>
          <p className="muted small">
            Thresholds: ≥80 submit as-is · 60–79 edit then submit · 40–59 SME queue (gated) · &lt;40 no answer.
          </p>
        </div>
      )}
    </div>
  );
}
