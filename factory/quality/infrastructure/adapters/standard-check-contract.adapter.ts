import type { Architecture, Workstream, Rule } from "../acl/inspection.acl.ts";

export declare const archunitRules: (
  a: Architecture,
  tsconfig?: string,
) => Array<{
  layer: string;
  rules: Rule[];
}>;

export declare const idsInMessages: (text: string) => string[];

export declare const ownRuleIds: (
  a: Architecture,
  workstream: string,
) => Set<string>;

export declare const ruleIds: (
  a: Architecture,
  workstream: string,
) => Set<string>;

export declare const deterministicIds: (a: Architecture) => Set<string>;

export declare const ledger: (
  a: Architecture,
  exampleFiles: string[],
  rubricFiles: string[],
) => Record<string, string>;

export type RulesPorts = {
  workingDirectory: () => string;
  existsSync: (typeof import("node:fs"))["existsSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  join: (typeof import("node:path"))["join"];
  projectFiles: (typeof import("archunit"))["projectFiles"];
  COVERAGE_RULE: (typeof import("./inspection-config.adapter.ts"))["COVERAGE_RULE"];
  layersOf: (typeof import("./inspection-config.adapter.ts"))["layersOf"];
  oxlintOverrides: (typeof import("./inspection-config.adapter.ts"))["oxlintOverrides"];
  withUpstream: (workstreams: Workstream[], id: string) => Workstream[];
  cacheDir: (typeof import("../../../shared/infrastructure/adapters/paths-contract.adapter.ts"))["cacheDir"];
  product: { root: string };
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  digest: (text: string) => string;
};
