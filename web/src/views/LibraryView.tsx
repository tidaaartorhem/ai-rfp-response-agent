import { useMemo, useState } from "react";
import type { BidboardData } from "../data";

export default function LibraryView({ data }: { data: BidboardData }) {
  const entries = data.library.entries;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const cats = useMemo(() => ["all", ...new Set(entries.map((e) => e.category))], [entries]);
  const shown = entries.filter(
    (e) =>
      (cat === "all" || e.category === cat) &&
      (q === "" ||
        (e.title + " " + e.answer + " " + e.keywords.join(" "))
          .toLowerCase()
          .includes(q.toLowerCase()))
  );

  return (
    <div>
      <div className="card">
        <h2>Approved answer library</h2>
        <p className="muted">
          {entries.length} seeded vendor answers — the standing content a solutions
          team reuses across bids. Every match cites the entry id and owner.
        </p>
        <div className="filters">
          <input
            className="input"
            placeholder="Search answers…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            {cats.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      {shown.map((e) => (
        <div className="card" key={e.id}>
          <div className="match-head">
            <span className="req-id">{e.id}</span>
            <span className="pill neutral">{e.category}</span>
          </div>
          <p><b>{e.title}</b></p>
          <p className="req-text">{e.answer}</p>
          <div className="muted small">Owner: {e.owner} · Keywords: {e.keywords.join(", ")}</div>
        </div>
      ))}
    </div>
  );
}
