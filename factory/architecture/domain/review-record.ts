import type { Row } from "./review-rubric.ts";
/**
 * The pass record, `.factory-review.json`: the hash of the rubric that judged, and per judged file the
 * hash of its content and the commit at the pass that judged it. A file whose hash is unchanged is
 * not sent to the model again; a different rubric (a question or its folders changed) is a new
 * judgement, so every file is sent again once. Per developer and git-ignored: a model answer is
 * not a project fact.
 */
export type PassRecord = {
  rubric?: string;
  files: Record<
    string,
    {
      hash: string;
      commit: string | null;
    }
  >;
};
export declare const RECORD_FILE = ".factory-review.json";
export type SourceFile = {
  path: string;
  content: string;
};
export declare const hashOf: (content: string) => string;
/** What the model is asked: id, question and folders of every row; the rule text is prose for people. */
export declare const rubricHash: (rows: Row[]) => string;
export declare const emptyRecord: () => PassRecord;
export declare const readRecord: (root: string) => PassRecord;
export declare const writeRecord: (root: string, record: PassRecord) => void;
/**
 * The files changed since the pass that last judged them; with an empty record, or one written
 * under another rubric, every file.
 */
export declare const touched: <F extends SourceFile>(
  files: F[],
  record: PassRecord,
  rubric?: string,
) => F[];
/** The record after a pass that judged `judged` under `rubric`: those files are marked, the rest kept. */
export declare const recordPass: (
  record: PassRecord,
  judged: SourceFile[],
  commit: string | null,
  rubric?: string,
) => PassRecord;

/** Collaborators supplied by the composition root. */
export type ReviewRecordPorts = {
  createHash: (typeof import("node:crypto"))["createHash"];
  existsSync: (typeof import("node:fs"))["existsSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  join: (typeof import("node:path"))["join"];
};
