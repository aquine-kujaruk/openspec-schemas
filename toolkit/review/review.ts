import { globSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Review } from "../types.ts";
import type { DecisionClient } from "./client.ts";
import { type CoreFile, type Finding, funnel } from "./funnel.ts";
import { emptyRecord, type PassRecord, recordPass, rubricHash, touched } from "./record.ts";
import type { LoadedRow } from "./rubric.ts";

export { DEFAULTS } from "./defaults.ts";

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
  skipped: { crossFile: string[]; rejected: string[] };
  record: PassRecord;
};

/** The core files the rubric can ask about: one folder per row folder, under every module. */
export const coreFiles = (root: string, modules: string, folders: string[]): CoreFile[] =>
  folders
    .flatMap((folder) =>
      globSync(`${modules}/${folder}/**/*.ts`, { cwd: root })
        .sort()
        .map((p) => ({
          path: relative(root, join(root, p)).split("\\").join("/"),
          content: readFileSync(join(root, p), "utf8"),
          folder,
        })),
    )
    .filter((f) => !/\.(test|spec)\.ts$/.test(f.path));

/** `S09 p=0.93 src/orders/domain/entities/order.entity.ts:12-19 — <row title>` */
export const formatFinding = (f: Finding): string =>
  `${f.row} p=${f.p.toFixed(2)} ${f.file}:${f.from}-${f.to} — ${f.title}`;

const byFile = (a: Finding, b: Finding) =>
  a.file.localeCompare(b.file) || a.from - b.from || a.to - b.to || a.row.localeCompare(b.row);

/**
 * One pass of `factory review`: the accepted, single-file rows asked over the touched core
 * files, narrowed to line ranges, printed as warnings. Returns the record of this pass; the caller
 * writes it.
 */
export const review = async (o: ReviewOptions): Promise<ReviewResult> => {
  const accepted = o.rows.filter((r) => r.verdict === "accepted");
  const asked = accepted.filter((r) => !r.crossFile);
  const folders = [...new Set(asked.flatMap((r) => r.folders))];
  const all = coreFiles(o.root, o.config.modules, folders);
  const record = o.record ?? emptyRecord();
  const rubric = rubricHash(asked);
  const files = touched(all, record, rubric);
  const findings = (
    await funnel({
      client: o.client,
      rows: asked,
      files,
      threshold: o.config.threshold,
      spanLines: o.config.spanLines,
      batch: o.config.batch,
    })
  ).sort(byFile);
  const skipped = {
    crossFile: accepted.filter((r) => r.crossFile).map((r) => r.id),
    rejected: o.rows.filter((r) => r.verdict === "rejected").map((r) => `${r.id} ${r.reason}`),
  };
  const judged = [...new Set(files.map((f) => f.path))];
  const lines = [
    ...findings.map(formatFinding),
    `${findings.length} warnings; ${judged.length} of ${all.length} core files judged (${
      o.record?.rubric && o.record.rubric !== rubric
        ? "the rubric changed: every file judged again"
        : "touched since the last pass"
    })`,
    ...(skipped.crossFile.length
      ? [`skipped as cross-file (for the human reviewer): ${skipped.crossFile.join(", ")}`]
      : []),
    ...(skipped.rejected.length ? [`skipped as not generic: ${skipped.rejected.join("; ")}`] : []),
  ];
  return {
    lines,
    findings,
    judged,
    skipped,
    record: recordPass(record, files, o.commit ?? null, rubric),
  };
};
