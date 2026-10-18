import { useState } from "react";
import type { BidboardData } from "../data";
import { MatchCard } from "./shared";

/** The SME queue: below-bar matches are never auto-filled; DEVIATE needs a gate. */
export default function QueueView({ data }: { data: BidboardData }) {
  const [filter, setFilter] = useState<"all" | "SME_NEEDED" | "NO_ANSWER">("all");
  const rows = data.matches.filter(
    (m) => m.action === "SME_NEEDED" || m.action === "NO_ANSWER"
  );
  const shown = rows.filter((m) => filter === "all" || m.action === filter);

  return (
    <div>
      <div className="card">
        <h2>SME queue &amp; gaps</h2>
        <p className="muted">
          {rows.length} of {data.summary.total_requirements} requirements could not be
          answered confidently from the approved library. Bidboard refuses to invent
          answers: these go to a subject-matter expert, and DEVIATE rows require a
          human gate before anything is submitted.
        </p>
        <div className="seg">
          {(["all", "SME_NEEDED", "NO_ANSWER"] as const).map((f) => (
            <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
              {f === "all" ? `All (${rows.length})` : f === "SME_NEEDED" ? `SME review (${rows.filter((m) => m.action === "SME_NEEDED").length})` : `No answer (${rows.filter((m) => m.action === "NO_ANSWER").length})`}
            </button>
          ))}
        </div>
      </div>
      {shown.map((m) => (
        <MatchCard key={m.requirement_id} m={m} />
      ))}
    </div>
  );
}
