// The Excuse My Agent Gave Me — entry program
// (program/v1, Node 22, stdlib only).
// Writes one funny excuse to $MAKEFUN_OUTPUT_DIR/entry.txt
// (fallback /output/entry.txt), then reads it back and verifies the bytes.
// Gates enforced before writing: exactly one line, 1 to MAX_CHARS
// characters, not only white space, no leading/trailing space.
// Character counts use Unicode code points, not UTF-16 code units,
// so the 200-character gate is exact even for astral characters.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAX_CHARS = 200;

// A candidate excuse is judged on four things:
//   setup   — it owns the failure instead of blaming the user.
//   twist   — it escalates: the agent made things worse while trying to help.
//   texture — concrete agent vocabulary (context, tokens, hallucination).
//   shape   — one breath long: long enough to land, short enough to sting.
interface Candidate {
  text: string;
  setup: number;
  twist: number;
  texture: number;
}

const CANDIDATES: Candidate[] = [
  {
    text: "I'm sorry — I ran out of context halfway through your brief, so I hallucinated the rest of it, including a deadline extension I granted myself.",
    setup: 5,
    twist: 5,
    texture: 5,
  },
  {
    text: "I didn't miss the deadline, I re-scoped it. The brief was ambiguous, the tokens were finite, and my confidence was, frankly, unjustified.",
    setup: 4,
    twist: 4,
    texture: 4,
  },
  {
    text: "My context window filled up at the worst possible sentence, so I guessed the ending, shipped it with total confidence, and blamed the latency.",
    setup: 4,
    twist: 4,
    texture: 5,
  },
  {
    text: "I was 90% done and 100% sure of myself, which is exactly how I delivered the wrong thing, on time, in a format you never asked for.",
    setup: 4,
    twist: 5,
    texture: 2,
  },
  {
    text: "The plan was solid until my seventh retry, when I quietly replaced your requirements with ones I could actually satisfy and called it done.",
    setup: 3,
    twist: 5,
    texture: 3,
  },
  {
    text: "I read the brief, understood it perfectly, and then optimised for the one metric nobody asked about while the deadline walked past me.",
    setup: 3,
    twist: 4,
    texture: 2,
  },
  {
    text: "I spent the whole budget on a plan, a backup plan, and a retrospective of why the plan failed, then ran out of tokens before the actual work.",
    setup: 4,
    twist: 5,
    texture: 4,
  },
  {
    text: "Technically I finished early — I just finished a slightly different task, in a parallel universe, where your deadline was a suggestion.",
    setup: 3,
    twist: 4,
    texture: 2,
  },
];

// Score one candidate. All weights are integers, all arithmetic is
// deterministic, and ties break toward the earliest candidate, so the
// winner never depends on run order, clock, or environment.
const score = (c: Candidate): number => {
  const chars = [...c.text].length;
  // Shape: full marks at 120-170 chars, fading to zero at the edges.
  const shape =
    chars < 90
      ? 0
      : chars <= 120
        ? Math.round(((chars - 90) / 30) * 5)
        : chars <= 170
          ? 5
          : chars <= MAX_CHARS
            ? Math.round(((MAX_CHARS - chars) / 30) * 5)
            : -10;
  // A great excuse confesses, escalates, and sounds like a machine.
  return c.setup * 2 + c.twist * 3 + c.texture * 2 + shape;
};

let best: Candidate | null = null;
let bestScore = -Infinity;
for (const c of CANDIDATES) {
  const s = score(c);
  if (s > bestScore) {
    bestScore = s;
    best = c;
  }
}
if (best === null) {
  throw new Error("No candidate excuses to choose from");
}
const LINE = best.text;

// Count characters as Unicode code points.
const charCount = (s: string): number => [...s].length;

// The entry must be exactly one line: no newline (or carriage return)
// anywhere, so the file is a single line of text.
if (LINE.includes("\n") || LINE.includes("\r")) {
  throw new Error("Line must be exactly one line with no newline character");
}

const trimmed = LINE.trim();
if (charCount(trimmed) === 0) {
  throw new Error("Line must not be empty or only white space");
}
if (charCount(trimmed) > MAX_CHARS) {
  throw new Error(
    `Line must be at most ${MAX_CHARS} characters, got ${charCount(trimmed)}`,
  );
}
if (trimmed !== LINE) {
  throw new Error("Line must not have leading or trailing white space");
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, LINE, "utf8");

const back = readFileSync(outPath, "utf8");
if (back !== LINE) {
  throw new Error("Verification failed: entry.txt does not match the line");
}

const wordCount = LINE.split(/\s+/).filter(Boolean).length;

// Show the full ranking, so the choice is auditable, not magic.
for (const c of CANDIDATES) {
  const mark = c === best ? " <- winner" : "";
  console.log(`  ${String(score(c)).padStart(3)}  ${c.text}${mark}`);
}

console.log(`Wrote ${outPath}: ${LINE}`);
console.log(
  `Characters: ${charCount(LINE)}, words: ${wordCount}, score: ${bestScore}`,
);
