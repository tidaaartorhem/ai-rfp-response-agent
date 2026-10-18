import { describe, expect, it } from "vitest";
import {
  decideAction,
  dispositionFor,
  matchRequirement,
  round1,
  tokenize,
  type LibraryEntry,
} from "./rules";
import vectorsJson from "../../data/test-vectors.json";

/**
 * Contract vectors: the TypeScript mirror must reproduce the exact values
 * the Python engine pinned in data/test-vectors.json.
 */
describe("contract vectors (python <-> TS agreement)", () => {
  const vectors = (vectorsJson as { vectors: unknown[] }).vectors as {
    id: string;
    input: { requirement_text: string; category: string; library: LibraryEntry[] };
    expected: {
      entry_id: string;
      confidence: number;
      action: string;
      disposition: string;
      needs_gate: boolean;
    };
  }[];

  for (const v of vectors) {
    it(`${v.id}: matches the pinned contract`, () => {
      const m = matchRequirement(
        v.id,
        v.input.requirement_text,
        v.input.category,
        v.input.library
      );
      expect({
        entry_id: m.entry_id,
        confidence: m.confidence,
        action: m.action,
        disposition: m.disposition,
        needs_gate: m.needs_gate,
      }).toEqual(v.expected);
      // also verify the action/disposition helpers agree independently
      expect(decideAction(m.confidence)).toBe(v.expected.action);
      expect(dispositionFor(m.action)).toBe(v.expected.disposition);
    });
  }
});

describe("tokenizer parity with python", () => {
  it("lowercases, strips punctuation, drops stopwords and short tokens", () => {
    expect(tokenize("The vendor MUST provide Monthly Uptime Reports")).toEqual([
      "vendor",
      "provide",
      "monthly",
      "uptime",
      "reports",
    ]);
  });

  it("round1 matches python round(x, 1) half-to-even", () => {
    expect(round1(72.25)).toBe(72.2);
    expect(round1(72.35)).toBe(72.3); // binary 72.35 is 72.3499...: both sides round down
    expect(round1(79.149)).toBe(79.1);
  });
});
