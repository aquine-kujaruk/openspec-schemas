import type { Review } from "../../shared/domain/types.ts";
import type { DecisionClient } from "./review-client.ts";
import { type CoreFile, type Finding } from "./review-funnel.ts";
import { type PassRecord } from "./review-record.ts";
import type { LoadedRow } from "./review-rubric.ts";
export { DEFAULTS } from "./review-defaults.ts";
export type ReviewOptions = {
  root: string;
  rows: LoadedRow[];
  client: DecisionClient;
  config: Review;
  /** The last pass; none means every core file is judged. */
  record?: PassRecord;
  commit?: string | null;
};
export type ReviewResult = {
  /** What the command prints, in order: warnings sorted by file, then the summary. */
  lines: string[];
  findings: Finding[];
  /** The files sent to the model at stage 1. */
  judged: string[];
  skipped: {
    crossFile: string[];
    rejected: string[];
  };
  record: PassRecord;
};
/** The core files the rubric can ask about: one folder per row folder, under every module. */
export declare const coreFiles: (
  root: string,
  modules: string,
  folders: string[],
) => CoreFile[];
/** `S09 p=0.93 src/orders/domain/entities/order.entity.ts:12-19 — <row title>` */
export declare const formatFinding: (f: Finding) => string;
/**
 * One pass of `factory review`: the accepted, single-file rows asked over the touched core
 * files, narrowed to line ranges, printed as warnings. Returns the record of this pass; the caller
 * writes it.
 */
export declare const review: (o: ReviewOptions) => Promise<ReviewResult>;

/** Collaborators supplied by the composition root. */
export type ReviewReviewPorts = {
  globSync: (typeof import("node:fs"))["globSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  join: (typeof import("node:path"))["join"];
  relative: (typeof import("node:path"))["relative"];
  funnel: (typeof import("./review-funnel.ts"))["funnel"];
  emptyRecord: (typeof import("./review-record.ts"))["emptyRecord"];
  recordPass: (typeof import("./review-record.ts"))["recordPass"];
  rubricHash: (typeof import("./review-record.ts"))["rubricHash"];
  touched: (typeof import("./review-record.ts"))["touched"];
  DEFAULTS: (typeof import("./review-defaults.ts"))["DEFAULTS"];
};
