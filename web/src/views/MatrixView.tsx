import type { BidboardData } from "../data";
import { ConfidenceBar } from "./shared";

export default function MatrixView({ data }: { data: BidboardData }) {
  const { summary, matrix, eval: ev } = data;
  const sections = Object.entries(matrix).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div>
      <div className="stat-grid">
        <div className="stat"><div className="stat-num">{summary.total_requirements}</div><div className="stat-label">RFP requirements</div></div>
        <div className="stat"><div className="stat-num">{summary.coverage_pct}%</div><div className="stat-label">answered from library</div></div>
        <div className="stat"><div className="stat-num">{summary.avg_confidence_answered}</div><div className="stat-label">avg confidence (answered)</div></div>
        <div className="stat"><div className="stat-num">{summary.deviate_needs_gate}</div><div className="stat-label">in SME queue (gated)</div></div>
        <div className="stat"><div className="stat-num">{summary.unaddressed}</div><div className="stat-label">no approved answer</div></div>
      </div>

      <div className="card">
        <h2>Compliance matrix</h2>
        <p className="muted">Per-section rollup of the deterministic match. Rows below the 40-point bar are never auto-filled; DEVIATE rows sit behind a human gate.</p>
        <table className="table">
          <thead>
            <tr>
              <th>Section</th><th>Total</th><th>Answered</th><th>Coverage</th>
              <th>Avg conf</th><th>Comply</th><th>Partial</th><th>Deviate</th><th>Gaps</th>
            </tr>
          </thead>
          <tbody>
            {sections.map(([name, s]) => (
              <tr key={name}>
                <td><b>{name}</b></td>
                <td>{s.total}</td>
                <td>{s.answered}</td>
                <td>{s.coverage_pct}%</td>
                <td><ConfidenceBar value={s.avg_confidence} /></td>
                <td>{s.comply}</td>
                <td>{s.partially_comply}</td>
                <td>{s.deviate}</td>
                <td className="muted small">{s.gaps.length ? s.gaps.join(", ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Golden-set evaluation</h2>
        <p className="muted">
          30 hand-labeled requirements (expected library entry, or NONE when no
          entry should clear the 40-point bar). Three rows are labeled against
          the engine's top-1 as known misses.
        </p>
        <div className="stat-grid">
          <div className="stat"><div className="stat-num">{(ev.routing_accuracy * 100).toFixed(1)}%</div><div className="stat-label">routing accuracy ({ev.correct}/{ev.rows})</div></div>
          <div className="stat"><div className="stat-num">{(ev.entry_precision * 100).toFixed(1)}%</div><div className="stat-label">entry precision</div></div>
          <div className="stat"><div className="stat-num">{(ev.entry_recall * 100).toFixed(1)}%</div><div className="stat-label">entry recall</div></div>
        </div>
        <table className="table">
          <thead><tr><th>Req</th><th>Expected</th><th>Predicted</th><th>Conf</th><th>Result</th></tr></thead>
          <tbody>
            {ev.per_row.map((r) => (
              <tr key={r.requirement_id} className={r.correct ? "" : "row-miss"}>
                <td><b>{r.requirement_id}</b></td>
                <td>{r.expected}</td>
                <td>{r.predicted}</td>
                <td>{r.confidence}</td>
                <td>{r.correct ? <span className="pill ok">correct</span> : <span className="pill bad">miss</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
