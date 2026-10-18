import { useState } from "react";
import { useBidboardData } from "./data";
import MatrixView from "./views/MatrixView";
import QueueView from "./views/QueueView";
import LibraryView from "./views/LibraryView";
import PasteView from "./views/PasteView";
import "./styles.css";

const REPO_URL = "https://github.com/tidaaartorhem/ai-rfp-response-agent";
const LIVE_URL = "https://ai-rfp-response-agent.web.app";

type Tab = "matrix" | "queue" | "library" | "paste";

const TABS: { id: Tab; label: string }[] = [
  { id: "matrix", label: "Compliance matrix" },
  { id: "queue", label: "SME queue" },
  { id: "library", label: "Answer library" },
  { id: "paste", label: "Paste a requirement" },
];

export default function App() {
  const { data, error } = useBidboardData();
  const [tab, setTab] = useState<Tab>("matrix");

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>
            <span className="mark">Bb</span>Bidboard
          </h1>
          <p className="sub">
            The RFP response desk: 78 real requirements from Shenandoah County's
            ERP RFP matched against an approved answer library with disclosed
            scoring. Below the bar goes to a human, never auto-filled.
          </p>
          <div className="badges">
            <span className="badge neutral">
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                GitHub repo
              </a>
            </span>
            <span className="badge neutral">
              <a href={LIVE_URL} target="_blank" rel="noreferrer">
                Live site
              </a>
            </span>
          </div>
        </div>
      </header>

      <div className="disclosure banner">
        <b>Deterministic, no LLM.</b> Keyword overlap (55) + exact phrase (20) +
        bigram (10) + category boost (15), capped at 100. Thresholds: ≥80
        submit as-is · 60–79 edit then submit · 40–59 SME queue (human-gated) ·
        &lt;40 no answer. The in-browser matcher mirrors the Python pipeline
        exactly.
      </div>

      {error && <div className="card error">Failed to load data: {error}</div>}
      {!data && !error && <div className="card">Loading…</div>}

      {data && (
        <>
          <div className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? "active" : ""}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === "queue" && (
                  <span className="count">
                    {data.matches.filter(
                      (m) => m.action === "SME_NEEDED" || m.action === "NO_ANSWER"
                    ).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "matrix" && <MatrixView data={data} />}
          {tab === "queue" && <QueueView data={data} />}
          {tab === "library" && <LibraryView data={data} />}
          {tab === "paste" && <PasteView data={data} />}

          <footer className="footer muted small">
            Requirements extracted from Shenandoah County, VA RFP 2025-002
            (public procurement document). Answer library is seeded vendor
            content — the product's input, disclosed as such. Built{" "}
            {data.stamp ? `from ${data.stamp.git_sha} at ${data.stamp.built_utc}` : "locally"} ·
            no LLMs were used.
          </footer>
        </>
      )}
    </div>
  );
}
