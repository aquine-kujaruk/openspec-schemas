/**
 * The reviewer rubric (`RUBRIC.md`): one row per judgement rule (S05…), each carrying the
 * yes/no question the decision model is asked and the layer folders it applies to. A row marked
 * `across files` needs more than one file to be judged and is skipped by the command. The rubric
 * is the only source: a row added there is asked without touching code.
 */
export type Row = {
  id: string;
  /** The first sentence of the rule, for the warning line. */
  title: string;
  question: string;
  /** Layer folders (`domain`, `application`, …); empty when cross-file. */
  folders: string[];
  crossFile: boolean;
};
export type Verdict = "accepted" | "rejected";
export type LoadedRow = Row & {
  verdict: Verdict;
  reason?: string;
};
/** The rows of the rubric table and the product vocabulary its header lists. */
export declare const parseRubric: (markdown: string) => {
  rows: Row[];
  product: string[];
};
/**
 * A question is generic when it names no package of the harness and no word of the product
 * vocabulary; it then reads the same in every application built with the package.
 */
export declare const checkGeneric: (
  question: string,
  vocabulary: {
    packages: string[];
    product: string[];
  },
) => string | undefined;
/** Every row with its verdict: a row that is not generic, or has no question, is rejected and never asked. */
export declare const loadRubric: (
  markdown: string,
  packages: string[],
) => LoadedRow[];
/** Package names of a `package.json`: dependencies and devDependencies alike. */
export declare const packagesOf: (packageJson: string) => string[];
/** The rubric checked against the project's `package.json`, so no question names one of its packages. */
export declare const readRubric: (
  root: string,
  rubric: string | string[],
) => LoadedRow[];

/** Collaborators supplied by the composition root. */
export type ReviewRubricPorts = {
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  join: (typeof import("node:path"))["join"];
};
