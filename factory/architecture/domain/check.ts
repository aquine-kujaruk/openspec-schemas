export declare const check: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type CheckPorts = {
  globSync: (typeof import("node:fs"))["globSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  join: (typeof import("node:path"))["join"];
  COVERAGE_RULE: (typeof import("./compose.ts"))["COVERAGE_RULE"];
  fallowConfig: (typeof import("./compose.ts"))["fallowConfig"];
  oxlintConfig: (typeof import("./compose.ts"))["oxlintConfig"];
  fileOf: (typeof import("./examples.ts"))["fileOf"];
  generate: (typeof import("./generate.ts"))["generate"];
  withUpstream: (typeof import("./graph.ts"))["withUpstream"];
  cacheDir: (typeof import("../../shared/domain/paths.ts"))["cacheDir"];
  jsonOf: (typeof import("../../shared/domain/paths.ts"))["jsonOf"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  runTool: (typeof import("../../shared/domain/paths.ts"))["runTool"];
  architecture: (typeof import("./project.ts"))["architecture"];
  config: (typeof import("./project.ts"))["config"];
  product: (typeof import("./project.ts"))["product"];
  archunitRules: (typeof import("./rules.ts"))["archunitRules"];
};
