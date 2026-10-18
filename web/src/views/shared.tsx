import type { MatchRow } from "../types";
import { ACTION_LABELS, DISPOSITION_LABELS } from "../rules";

const ACTION_CLASS: Record<string, string> = {
  SUBMIT_AS_IS: "ok",
  EDIT_THEN_SUBMIT: "warn",
  SME_NEEDED: "bad",
  NO_ANSWER: "gray",
};

export function ActionBadge({ action }: { action: string }) {
  return <span className={`pill ${ACTION_CLASS[action] ?? "gray"}`}>{ACTION_LABELS[action as keyof typeof ACTION_LABELS]}</span>;
}

export function DispositionBadge({ disposition }: { disposition: string }) {
  return (
    <span className="pill neutral">
      {DISPOSITION_LABELS[disposition as keyof typeof DISPOSITION_LABELS]}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const cls = value >= 80 ? "ok" : value >= 60 ? "warn" : value >= 40 ? "bad" : "gray";
  return (
    <span className="confbar" title={`${value}%`}>
      <span className="confbar-track">
        <span className={`confbar-fill ${cls}`} style={{ width: `${value}%` }} />
      </span>
      <span className="confbar-num">{value}</span>
    </span>
  );
}

export function MatchCard({ m }: { m: MatchRow }) {
  return (
    <div className="card match-card">
      <div className="match-head">
        <span className="req-id">{m.requirement_id}</span>
        <ActionBadge action={m.action} />
        <DispositionBadge disposition={m.disposition} />
        {m.needs_gate && <span className="pill gate">human gate required</span>}
      </div>
      <p className="req-text">{m.requirement_text}</p>
      <div className="match-body">
        <ConfidenceBar value={m.confidence} />
        <div className="match-detail">
          <div>
            <b>{m.entry_id}</b> — {m.entry_title}
          </div>
          <div className="muted">Owner: {m.entry_owner}</div>
          <div className="muted">
            Why: {m.score_breakdown.shared_keywords.slice(0, 8).join(", ") || "no shared keywords"}
            {m.score_breakdown.exact_phrase_hit ? " · exact phrase" : ""}
            {m.score_breakdown.category_boost_applied ? " · category boost" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
