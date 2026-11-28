import type { Architecture, Workstream } from "../acl/inspection.acl.ts";
import { type Files } from "./sample-file-contract.adapter.ts";
import type { Findings } from "./sample-findings.adapter.ts";
export type { Findings, Tool } from "./sample-findings.adapter.ts";
export declare const fileOf: (v: any) => string;
declare const TOOLS: readonly ["fallow", "oxlint", "archunit"];

export declare const examples: (
  a: Architecture,
  dir: string,
  layer: string,
  modules?: Record<string, Files>,
) => {
  violations: (example: string, rule: string) => Promise<Findings>;
  all: (
    example: string,
    rules: Set<string>,
  ) => Promise<Record<string, string[]>>;
};

export {};

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
  COVERAGE_RULE: (typeof import("./inspection-config.adapter.ts"))["COVERAGE_RULE"];
  fallowConfig: (typeof import("./inspection-config.adapter.ts"))["fallowConfig"];
  layersOf: (typeof import("./inspection-config.adapter.ts"))["layersOf"];
  oxlintConfig: (typeof import("./inspection-config.adapter.ts"))["oxlintConfig"];
  oxlintOverrides: (typeof import("./inspection-config.adapter.ts"))["oxlintOverrides"];
  withUpstream: (workstreams: Workstream[], id: string) => Workstream[];
  archunitRules: (typeof import("./standard-check-contract.adapter.ts"))["archunitRules"];
  idsInMessages: (typeof import("./standard-check-contract.adapter.ts"))["idsInMessages"];
  parseExampleFile: (typeof import("./sample-file-contract.adapter.ts"))["parseExampleFile"];
  jsonOf: (typeof import("../../../shared/infrastructure/adapters/paths-contract.adapter.ts"))["jsonOf"];
  runTool: (typeof import("../../../shared/infrastructure/adapters/paths-contract.adapter.ts"))["runTool"];
};
