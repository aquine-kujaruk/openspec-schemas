import type { Architecture, Rule } from "../../shared/domain/types.ts";
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
  COVERAGE_RULE: (typeof import("./compose.ts"))["COVERAGE_RULE"];
  layersOf: (typeof import("./compose.ts"))["layersOf"];
  oxlintOverrides: (typeof import("./compose.ts"))["oxlintOverrides"];
  withUpstream: (typeof import("./graph.ts"))["withUpstream"];
  cacheDir: (typeof import("../../shared/domain/paths.ts"))["cacheDir"];
  product: (typeof import("./project.ts"))["product"];
};
