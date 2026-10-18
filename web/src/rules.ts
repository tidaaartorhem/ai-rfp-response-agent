/**
 * rules.ts — TypeScript mirror of the Bidboard Python engine
 * (src/bidboard/{text,matcher,actions}.py).
 *
 * Scoring is disclosed and deterministic: keyword overlap (55 pts) +
 * exact-phrase (20 pts, >=3 contiguous tokens) + bigram overlap (10 pts) +
 * category boost (15 pts), capped at 100, 1-decimal. Thresholds:
 * >=80 SUBMIT_AS_IS, >=60 EDIT_THEN_SUBMIT, >=40 SME_NEEDED, else NO_ANSWER.
 * Both implementations agree exactly on data/test-vectors.json.
 */

import config from "../../data/scoring-config.json";

const STOPWORDS: Set<string> = new Set(config.stopwords as string[]);
const MIN_TOKEN_LENGTH: number = config.min_token_length as number;
const KW_POINTS: number = config.keyword_overlap_points as number;
const PHRASE_POINTS: number = config.exact_phrase_points as number;
const PHRASE_MIN: number = config.exact_phrase_min_words as number;
const BIGRAM_POINTS: number = config.bigram_points as number;
const CAT_BOOST: number = config.category_boost as number;
const TH = config.thresholds as Record<string, number>;

export type Action =
  | "SUBMIT_AS_IS"
  | "EDIT_THEN_SUBMIT"
  | "SME_NEEDED"
  | "NO_ANSWER";

export type Disposition =
  | "COMPLY"
  | "PARTIALLY_COMPLY"
  | "DEVIATE"
  | "UNADDRESSED";

export interface LibraryEntry {
  id: string;
  owner: string;
  category: string;
  title: string;
  keywords: string[];
  answer: string;
}

export interface ScoreBreakdown {
  keyword_overlap: number;
  exact_phrase_hit: boolean;
  category_boost_applied: boolean;
  shared_keywords: string[];
}

export interface MatchResult {
  requirement_id: string;
  entry_id: string;
  entry_owner: string;
  entry_title: string;
  confidence: number;
  action: Action;
  disposition: Disposition;
  needs_gate: boolean;
  breakdown: ScoreBreakdown;
}

export const ACTION_LABELS: Record<Action, string> = {
  SUBMIT_AS_IS: "Submit as-is",
  EDIT_THEN_SUBMIT: "Edit, then submit",
  SME_NEEDED: "Send to SME queue",
  NO_ANSWER: "No approved answer",
};

export const DISPOSITION_LABELS: Record<Disposition, string> = {
  COMPLY: "Comply",
  PARTIALLY_COMPLY: "Partially comply",
  DEVIATE: "Deviate",
  UNADDRESSED: "Unaddressed",
};

/**
 * Round to 1 decimal exactly like Python's round(x, 1): correctly-rounded
 * decimal rounding of the exact binary value, ties to even. Confidence
 * scores are always in [0, 100], so no sign/exponent handling is needed.
 */
export function round1(x: number): number {
  const s = x.toPrecision(17); // exact round-trip decimal expansion
  const dot = s.indexOf(".");
  const intPart = dot === -1 ? s : s.slice(0, dot);
  const frac = (dot === -1 ? "" : s.slice(dot + 1)).padEnd(16, "0").slice(0, 16);
  const tenths = Number(frac[0]);
  const rest = frac.slice(1).padEnd(15, "0");
  const HALF = "5" + "0".repeat(14);
  let up = false;
  if (rest > HALF) up = true;
  else if (rest === HALF) up = tenths % 2 === 1; // tie -> even
  let t = tenths + (up ? 1 : 0);
  let ip = Number(intPart);
  if (t === 10) {
    t = 0;
    ip += 1;
  }
  return ip + t / 10;
}

function normalize(text: string): string {
  return (text ?? "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t) && t.length >= MIN_TOKEN_LENGTH);
}

function bigrams(tokens: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + 1 < tokens.length; i++) out.add(tokens[i] + " " + tokens[i + 1]);
  return out;
}

function longestSharedPhraseLen(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const bIndex = new Map<string, number[]>();
  b.forEach((tok, j) => {
    const arr = bIndex.get(tok);
    if (arr) arr.push(j);
    else bIndex.set(tok, [j]);
  });
  let best = 0;
  a.forEach((tok, i) => {
    for (const j of bIndex.get(tok) ?? []) {
      let run = 0;
      while (i + run < a.length && j + run < b.length && a[i + run] === b[j + run]) {
        run++;
      }
      if (run > best) best = run;
    }
  });
  return best;
}

function entryText(entry: LibraryEntry): string {
  return [entry.title, entry.keywords.join(" "), entry.answer].join(" ");
}

export function scoreRequirement(
  reqText: string,
  reqCategory: string,
  entry: LibraryEntry
): { confidence: number; breakdown: ScoreBreakdown } {
  const rToks = tokenize(reqText);
  const eToks = tokenize(entryText(entry));
  const rSet = new Set(rToks);
  const eSet = new Set(eToks);
  const shared = [...rSet].filter((t) => eSet.has(t));

  const overlap = rSet.size > 0 ? shared.length / rSet.size : 0;
  const base = KW_POINTS * overlap;

  const phraseHit = longestSharedPhraseLen(rToks, eToks) >= PHRASE_MIN;
  const phrase = phraseHit ? PHRASE_POINTS : 0;

  const rBi = bigrams(rToks);
  const eBi = bigrams(eToks);
  const biShared = [...rBi].filter((b) => eBi.has(b)).length;
  const bigram = rBi.size > 0 ? BIGRAM_POINTS * (biShared / rBi.size) : 0;

  const catApplied = entry.category === reqCategory;
  const cat = catApplied ? CAT_BOOST : 0;

  const confidence = round1(Math.min(100, base + phrase + bigram + cat));
  return {
    confidence,
    breakdown: {
      keyword_overlap: Math.round(overlap * 10000) / 10000,
      exact_phrase_hit: phraseHit,
      category_boost_applied: catApplied,
      shared_keywords: shared.sort(),
    },
  };
}

export function decideAction(confidence: number): Action {
  if (confidence >= TH.submit_as_is) return "SUBMIT_AS_IS";
  if (confidence >= TH.edit_then_submit) return "EDIT_THEN_SUBMIT";
  if (confidence >= TH.sme_needed) return "SME_NEEDED";
  return "NO_ANSWER";
}

export function dispositionFor(action: Action): Disposition {
  switch (action) {
    case "SUBMIT_AS_IS":
      return "COMPLY";
    case "EDIT_THEN_SUBMIT":
      return "PARTIALLY_COMPLY";
    case "SME_NEEDED":
      return "DEVIATE";
    case "NO_ANSWER":
      return "UNADDRESSED";
  }
}

export function matchRequirement(
  requirementId: string,
  reqText: string,
  reqCategory: string,
  library: LibraryEntry[]
): MatchResult {
  const scored = library.map((entry) => ({
    entry,
    ...scoreRequirement(reqText, reqCategory, entry),
  }));
  scored.sort((x, y) => {
    if (y.confidence !== x.confidence) return y.confidence - x.confidence;
    return x.entry.id < y.entry.id ? -1 : x.entry.id > y.entry.id ? 1 : 0;
  });
  const best = scored[0];
  const action = decideAction(best.confidence);
  const disposition = dispositionFor(action);
  return {
    requirement_id: requirementId,
    entry_id: best.entry.id,
    entry_owner: best.entry.owner,
    entry_title: best.entry.title,
    confidence: best.confidence,
    action,
    disposition,
    needs_gate: disposition === "DEVIATE",
    breakdown: best.breakdown,
  };
}
