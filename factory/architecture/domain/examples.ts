import type { Architecture } from "../../shared/domain/types.ts";
import { type Files } from "./example-file.ts";
/** Files that break a rule, each with the tools that reported it. */
import type { Findings } from "./findings.ts";
export type { Findings, Tool } from "./findings.ts";
/**
 * The file an archunit violation points at, whatever its kind (custom condition, dependency, cycle,
 * path or name pattern). Anything else throws: a finding without a path cannot be recorded.
 */
export declare const fileOf: (v: any) => string;
declare const TOOLS: readonly ["fallow", "oxlint", "archunit"];

/**
 * Examples of one layer: `<dir>/<layer>.examples.md` holds a case per way of breaking each rule.
 * `dir` is a workstream folder; the `## reference` sections of every `*.examples.md` in it and in
 * the folders of the workstreams upstream of it form the workstream's reference module. A seam file
 * may be in several of them only with identical content. A case (or the reference) is written to a
 * temp directory with the configs composed from the architecture, and each tool reports the files
 * that violate each rule. A tool runs at most once per case, and only when a rule it owns is asked for.
 * `modules` adds named file sets checked like the reference, such as the scaffolds once rendered.
 */
export declare const examples: (
  a: Architecture,
  dir: string,
  layer: string,
  modules?: Record<string, Files>,
) => {
  /** Files of case `example` (under `## rule`) that violate `rule`, each with the owning tools that reported it. */
  violations: (example: string, rule: string) => Promise<Findings>;
  /** Every violation of the reference module, restricted to the given rule ids: `{ rule: [files] }`. */
  all: (
    example: string,
    rules: Set<string>,
  ) => Promise<Record<string, string[]>>;
};
export {};

/** Collaborators supplied by the composition root. */
export type ExamplesPorts = {
  workingDirectory: () => string;
  changeDirectory: (directory: string) => void;
  globSync: (typeof import("node:fs"))["globSync"];
  mkdirSync: (typeof import("node:fs"))["mkdirSync"];
  mkdtempSync: (typeof import("node:fs"))["mkdtempSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  tmpdir: (typeof import("node:os"))["tmpdir"];
  basename: (typeof import("node:path"))["basename"];
  dirname: (typeof import("node:path"))["dirname"];
  join: (typeof import("node:path"))["join"];
  clearGraphCache: (typeof import("archunit"))["clearGraphCache"];
  COVERAGE_RULE: (typeof import("./compose.ts"))["COVERAGE_RULE"];
  fallowConfig: (typeof import("./compose.ts"))["fallowConfig"];
  layersOf: (typeof import("./compose.ts"))["layersOf"];
  oxlintConfig: (typeof import("./compose.ts"))["oxlintConfig"];
  oxlintOverrides: (typeof import("./compose.ts"))["oxlintOverrides"];
  withUpstream: (typeof import("./graph.ts"))["withUpstream"];
  archunitRules: (typeof import("./rules.ts"))["archunitRules"];
  idsInMessages: (typeof import("./rules.ts"))["idsInMessages"];
  parseExampleFile: (typeof import("./example-file.ts"))["parseExampleFile"];
  jsonOf: (typeof import("../../shared/domain/paths.ts"))["jsonOf"];
  runTool: (typeof import("../../shared/domain/paths.ts"))["runTool"];
};
