// The Excuse My Agent Gave Me — entry program
// (program/v1, Node 22+, stdlib only).
//
// One job: write the single funniest excuse an AI agent could hand its
// human for a missed deadline to $MAKEFUN_OUTPUT_DIR/entry.txt
// (fallback /output/entry.txt), then read the file back and verify the
// bytes are exactly what was intended.
//
// The gate the sealed scorer enforces, checked here first so a bad line
// fails loudly instead of silently shipping an invalid entry:
//   * exactly one line — no "\n" or "\r" anywhere in the text;
//   * 1 to MAX_CHARS characters, counted as Unicode code points
//     (not UTF-16 code units), so the 200-character limit is exact
//     even for astral characters;
//   * not empty, not only white space, no leading or trailing space.
//
// The line itself is a straight-faced apology from a machine that ran
// out of context, hallucinated the rest of the brief, and then —
// faintly proud of itself — granted its own deadline extension.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CHARS = 200;
const DEFAULT_OUT_DIR = "/output";
const ENTRY_FILENAME = "entry.txt";

const LINE =
  "I'm sorry — I ran out of context halfway through your brief, so I hallucinated the rest of it, including a deadline extension I granted myself.";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// Count characters as Unicode code points, so an astral character
// (emoji, rare CJK) counts as one character, matching the scorer.
function charCount(s: string): number {
  return [...s].length;
}

// Count words the boring way: runs of non-white-space separated by
// white space. Only used for the human-readable run report.
function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

// True when the text contains any line break at all — "\n", "\r", or
// the "\r\n" pair, which is just both at once.
function hasLineBreak(s: string): boolean {
  return s.includes("\n") || s.includes("\r");
}

// ---------------------------------------------------------------------------
// Gate checks — each one names the rule it enforces, so a failure
// message says exactly which gate tripped and why.
// ---------------------------------------------------------------------------

// The entry must be exactly one line. A newline anywhere would make
// the file two lines and fail the scorer's gate.
function checkSingleLine(s: string): void {
  if (hasLineBreak(s)) {
    throw new Error(
      "Gate failed: entry must be exactly one line (no newline character)",
    );
  }
}

// The entry must say something: empty or white-space-only text
// scores 0 and never reaches the judge.
function checkNotBlank(s: string): void {
  if (charCount(s.trim()) === 0) {
    throw new Error(
      "Gate failed: entry must not be empty or only white space",
    );
  }
}

// The entry must fit the 200-character ceiling. The count is in code
// points, so the check agrees with the scorer even for astral text.
function checkMaxLength(s: string): void {
  const n = charCount(s);
  if (n > MAX_CHARS) {
    throw new Error(
      `Gate failed: entry must be at most ${MAX_CHARS} characters, got ${n}`,
    );
  }
}

// No leading or trailing white space: the scorer reads the raw bytes,
// and padding would count against the character budget and look
// sloppy to the judge.
function checkNoPadding(s: string): void {
  if (s.trim() !== s) {
    throw new Error(
      "Gate failed: entry must not have leading or trailing white space",
    );
  }
}

// No tab characters: a tab inside the line still passes the one-line
// gate, but it renders as broken spacing to the judge and can hide
// padding. The excuse is plain prose, so tabs have no business in it.
function checkNoTabs(s: string): void {
  if (s.includes("\t")) {
    throw new Error("Gate failed: entry must not contain tab characters");
  }
}

// Run every gate check in order. The order matters: the single-line
// check comes first because a multi-line string makes the other
// checks meaningless.
function validateLine(s: string): void {
  checkSingleLine(s);
  checkNoTabs(s);
  checkNotBlank(s);
  checkMaxLength(s);
  checkNoPadding(s);
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

// Where the entry goes. The harness sets MAKEFUN_OUTPUT_DIR; a bare
// local run falls back to /output so the program still works by hand.
function resolveOutDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv.trim() !== "") {
    return fromEnv;
  }
  return DEFAULT_OUT_DIR;
}

// Create the output directory (parents included) and write the entry
// as UTF-8 text with no trailing newline — the file is the line.
function writeEntry(outDir: string, line: string): string {
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, ENTRY_FILENAME);
  writeFileSync(outPath, line, "utf8");
  return outPath;
}

// Self-check: read the file back and demand byte-for-byte equality
// with the line we meant to write. If the disk disagrees, the entry
// is wrong and the program must fail rather than report success.
function verifyEntry(outPath: string, line: string): void {
  const back = readFileSync(outPath, "utf8");
  if (back !== line) {
    throw new Error(
      `Verification failed: ${outPath} does not match the intended line`,
    );
  }
}

// ---------------------------------------------------------------------------
// Run report — structured, so a human or a harness can read the run
// at a glance without re-opening the file.
// ---------------------------------------------------------------------------

interface RunReport {
  outPath: string;
  entry: string;
  characters: number;
  words: number;
  lines: number;
}

function buildReport(outPath: string, line: string): RunReport {
  return {
    outPath,
    entry: line,
    characters: charCount(line),
    words: wordCount(line),
    lines: 1,
  };
}

function printReport(report: RunReport): void {
  console.log(`Wrote ${report.outPath}: ${report.entry}`);
  console.log(
    `Characters: ${report.characters}, words: ${report.words}, lines: ${report.lines}`,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  validateLine(LINE);

  const outDir = resolveOutDir();
  const outPath = writeEntry(outDir, LINE);
  verifyEntry(outPath, LINE);

  printReport(buildReport(outPath, LINE));
}

main();
