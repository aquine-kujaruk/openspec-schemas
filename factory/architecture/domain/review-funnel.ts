import type ts from "typescript";
import type { DecisionClient, Question } from "./review-client.ts";
import type { Row } from "./review-rubric.ts";
import {
  numbered,
  parse,
  partsOf,
  slice,
  type Span,
  unitsOf,
} from "./review-units.ts";

export type CoreFile = { path: string; content: string; folder: string };

export type Finding = {
  row: string;
  p: number;
  file: string;
  from: number;
  to: number;
  title: string;
};

export type FunnelOptions = {
  client: DecisionClient;
  rows: Row[];
  files: CoreFile[];
  /** A probability at or above this line is a yes. */
  threshold: number;
  /** A span at most this long is reported; a longer one is split further. */
  spanLines: number;
  batch: { files: number; chars: number };
};

type Unit = Span & { node: ts.Node };

const batches = (
  files: CoreFile[],
  cap: { files: number; chars: number },
): CoreFile[][] => {
  const out: CoreFile[][] = [];
  let current: CoreFile[] = [];
  let chars = 0;
  for (const f of files) {
    const size = f.content.length;
    if (
      current.length &&
      (current.length >= cap.files || chars + size > cap.chars)
    ) {
      out.push(current);
      current = [];
      chars = 0;
    }
    current.push(f);
    chars += size;
  }
  if (current.length) out.push(current);
  return out;
};

/**
 * The narrowing funnel. Stage 1: the touched files of one layer folder, in batches, with one
 * question per row and file ("consider only this file"). Stage 2: each file answered yes is split
 * into its top-level units with the AST and asked again, one question per row and unit. Stage 3:
 * a unit answered yes and longer than `spanLines` is split into its parts (class header and
 * members, statements of a body) and asked again until the span fits; every span answered yes is
 * a finding with its line range. A span answered no at a deeper stage is dropped: the funnel only
 * narrows, it never widens. A file may yield several ranges for one row.
 */
export const funnel = async (o: FunnelOptions): Promise<Finding[]> => {
  const rows = o.rows.filter((r) => !r.crossFile);
  const yes = (p: number | undefined): p is number =>
    p !== undefined && p >= o.threshold;
  const findings: Finding[] = [];
  // Stage 1, per folder: the rows of that folder over its files.
  const folders = [...new Set(rows.flatMap((r) => r.folders))];
  const candidates = new Map<string, Map<string, number>>(); // file path → row id → p
  for (const folder of folders) {
    const rowsHere = rows.filter((r) => r.folders.includes(folder));
    const filesHere = o.files.filter((f) => f.folder === folder);
    for (const batch of batches(filesHere, o.batch)) {
      const state = batch
        .map((f) => `=== ${f.path} ===\n${f.content}`)
        .join("\n\n");
      const questions: Question[] = [];
      for (const row of rowsHere)
        for (const [i, f] of batch.entries())
          questions.push({
            name: `${row.id}_f${i}`,
            instructions: `Consider only the file ${f.path}. ${row.question}`,
            excerpt: f.content,
          });
      const answers = await o.client.ask(state, questions);
      for (const row of rowsHere)
        for (const [i, f] of batch.entries()) {
          const p = answers.get(`${row.id}_f${i}`);
          if (yes(p))
            (
              candidates.get(f.path) ??
              candidates.set(f.path, new Map()).get(f.path)!
            ).set(row.id, p);
        }
    }
  }
  // Stage 2, per file: the rows that answered yes over its units.
  for (const [path, byRow] of candidates) {
    const file = o.files.find((f) => f.path === path)!;
    const parsed = parse(path, file.content);
    const state = numbered(file.content);
    const units = unitsOf(parsed);
    const rowsHere = rows.filter((r) => byRow.has(r.id));
    const ask = async (row: Row, spans: Unit[]) => {
      const questions = spans.map((s, i) => ({
        name: `${row.id}_s${i}`,
        instructions: `Consider only lines ${s.from}-${s.to} of the file (${s.label}). ${row.question}`,
        excerpt: slice(file.content, s),
      }));
      const answers = await o.client.ask(state, questions);
      return spans.flatMap((s, i) => {
        const p = answers.get(`${row.id}_s${i}`);
        return yes(p) ? [{ span: s, p }] : [];
      });
    };
    // Stage 3: narrow a span answered yes until it fits.
    const narrow = async (row: Row, span: Unit, p: number): Promise<void> => {
      const parts =
        span.to - span.from + 1 > o.spanLines ? partsOf(parsed, span) : [];
      if (!parts.length) {
        findings.push({
          row: row.id,
          p,
          file: path,
          from: span.from,
          to: span.to,
          title: row.title,
        });
        return;
      }
      for (const hit of await ask(row, parts))
        await narrow(row, hit.span, hit.p);
    };
    for (const row of rowsHere) {
      if (!units.length) {
        findings.push({
          row: row.id,
          p: byRow.get(row.id)!,
          file: path,
          from: 1,
          to: parsed.lines,
          title: row.title,
        });
        continue;
      }
      for (const hit of await ask(row, units))
        await narrow(row, hit.span, hit.p);
    }
  }
  return findings;
};
