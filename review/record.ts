import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Row } from "./rubric.ts";

/**
 * The pass record, `.factory-review.json`: the hash of the rubric that judged, and per judged file the
 * hash of its content and the commit at the pass that judged it. A file whose hash is unchanged is
 * not sent to the model again; a different rubric (a question or its folders changed) is a new
 * judgement, so every file is sent again once. Per developer and git-ignored: a model answer is
 * not a project fact.
 */
export type PassRecord = {
  rubric?: string;
  files: Record<string, { hash: string; commit: string | null }>;
};

export const RECORD_FILE = ".factory-review.json";

export type SourceFile = { path: string; content: string };

export const hashOf = (content: string): string =>
  createHash("sha256").update(content).digest("hex").slice(0, 16);

/** What the model is asked: id, question and folders of every row; the rule text is prose for people. */
export const rubricHash = (rows: Row[]): string =>
  hashOf(
    JSON.stringify(
      rows
        .map((r) => [r.id, r.question, r.folders, r.crossFile])
        .sort((a, b) => (a[0] < b[0] ? -1 : 1)),
    ),
  );

export const emptyRecord = (): PassRecord => ({ files: {} });

export const readRecord = (root: string): PassRecord => {
  const file = join(root, RECORD_FILE);
  if (!existsSync(file)) return emptyRecord();
  const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<PassRecord>;
  return { ...(parsed.rubric ? { rubric: parsed.rubric } : {}), files: parsed.files ?? {} };
};

export const writeRecord = (root: string, record: PassRecord): void =>
  writeFileSync(join(root, RECORD_FILE), `${JSON.stringify(record, null, 2)}\n`);

/**
 * The files changed since the pass that last judged them; with an empty record, or one written
 * under another rubric, every file.
 */
export const touched = <F extends SourceFile>(
  files: F[],
  record: PassRecord,
  rubric?: string,
): F[] =>
  rubric !== undefined && record.rubric !== rubric
    ? files
    : files.filter((f) => record.files[f.path]?.hash !== hashOf(f.content));

/** The record after a pass that judged `judged` under `rubric`: those files are marked, the rest kept. */
export const recordPass = (
  record: PassRecord,
  judged: SourceFile[],
  commit: string | null,
  rubric?: string,
): PassRecord => {
  const files = { ...record.files };
  for (const f of judged) files[f.path] = { hash: hashOf(f.content), commit };
  const kept = rubric ?? record.rubric;
  return {
    ...(kept ? { rubric: kept } : {}),
    files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
  };
};
