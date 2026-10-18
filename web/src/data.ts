import { useEffect, useState } from "react";
import type {
  EvalResult,
  LibraryEntry,
  MatchRow,
  Requirement,
  SectionStat,
  Stamp,
  Summary,
} from "./types";

export interface BidboardData {
  summary: Summary;
  matrix: Record<string, SectionStat>;
  matches: MatchRow[];
  eval: EvalResult;
  requirements: { requirements: Requirement[] };
  library: { entries: LibraryEntry[] };
  stamp: Stamp | null;
}

async function get<T>(name: string): Promise<T> {
  const res = await fetch(`data/${name}.json`);
  if (!res.ok) throw new Error(`failed to load data/${name}.json`);
  return res.json() as Promise<T>;
}

async function tryGet<T>(name: string): Promise<T | null> {
  try {
    return await get<T>(name);
  } catch {
    return null;
  }
}

/** Loads the pipeline payloads (written by scripts/build_bidboard.py). */
export function useBidboardData() {
  const [data, setData] = useState<BidboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [summary, matrix, matches, evalRes, requirements, library, stamp] =
          await Promise.all([
            get<Summary>("summary"),
            get<Record<string, SectionStat>>("matrix"),
            get<MatchRow[]>("matches"),
            get<EvalResult>("eval"),
            get<{ requirements: Requirement[] }>("requirements"),
            get<{ entries: LibraryEntry[] }>("answer_library"),
            tryGet<Stamp>("stamp"),
          ]);
        setData({ summary, matrix, matches, eval: evalRes, requirements, library, stamp });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  return { data, error };
}
