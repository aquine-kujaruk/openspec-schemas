import type { Architecture, Workstream, Rule } from "../acl/inspection.acl.ts";
/** archunit side: every layer's rules over a tsconfig (the project's or an example's). */
export declare const archunitRules: (
  a: Architecture,
  tsconfig?: string,
) => Array<{
  layer: string;
  rules: Rule[];
}>;
/** Every rule id named in a text, in order. */
export declare const idsInMessages: (text: string) => string[];
/** Rule ids a workstream owns itself. */
export declare const ownRuleIds: (
  a: Architecture,
  workstream: string,
) => Set<string>;
/** Rule ids a workstream's check evaluates: its own and those of every workstream upstream of it. */
export declare const ruleIds: (
  a: Architecture,
  workstream: string,
) => Set<string>;

/** Collaborators supplied by the composition root. */
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
};
