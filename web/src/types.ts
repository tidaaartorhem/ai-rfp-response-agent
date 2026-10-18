import type { Action, Disposition, LibraryEntry } from "./rules";

export interface Requirement {
  id: string;
  category: string;
  section: string;
  priority: string;
  text: string;
}

export interface MatchRow {
  requirement_id: string;
  section: string;
  category: string;
  priority: string;
  requirement_text: string;
  entry_id: string;
  entry_owner: string;
  entry_title: string;
  confidence: number;
  action: Action;
  disposition: Disposition;
  needs_gate: boolean;
  score_breakdown: {
    keyword_overlap: number;
    exact_phrase_hit: boolean;
    category_boost_applied: boolean;
    shared_keywords: string[];
  };
}

export interface SectionStat {
  total: number;
  answered: number;
  comply: number;
  partially_comply: number;
  deviate: number;
  unaddressed: number;
  coverage_pct: number;
  avg_confidence: number;
  gaps: string[];
}

export interface Summary {
  total_requirements: number;
  answered: number;
  coverage_pct: number;
  deviate_needs_gate: number;
  unaddressed: number;
  avg_confidence_answered: number;
  sections: number;
}

export interface EvalResult {
  rows: number;
  correct: number;
  routing_accuracy: number;
  entry_precision: number;
  entry_recall: number;
  per_row: { requirement_id: string; expected: string; predicted: string; confidence: number; correct: boolean }[];
}

export interface Stamp {
  repo: string;
  git_sha: string;
  built_utc: string;
}

export type { Action, Disposition, LibraryEntry };
