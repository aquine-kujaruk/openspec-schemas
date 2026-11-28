import type { Architecture, Check, FactoryConfig, Layer, OxlintOverride, Rule, Workstream } from "../../../shared/domain/schemas/line-types.schema.ts";

import type { QualityControlRunRecord } from "../../domain/schemas/quality-control-run.schema.ts";

export { QualityControlRunRecordSchema as InspectionRecordSchema } from "../../domain/schemas/quality-control-run.schema.ts";
export type InspectionRecord = QualityControlRunRecord;

export interface InspectionAcl {
  inspectLine(line: string, scope: readonly string[]): Promise<InspectionRecord>;
}

export type InspectionFinding = { file: string; standard: string; tool: string };
export type QualityCheck = (args: string[], record?: (finding: InspectionFinding) => void) => Promise<number>;

export type InspectionTools = {
  globSync: (typeof import("node:fs"))["globSync"];
  writeFileSync: (typeof import("node:fs"))["writeFileSync"];
  join: (typeof import("node:path"))["join"];
  resolve: (typeof import("node:path"))["resolve"];
  sep: string;
  COVERAGE_RULE: string;
  fallowConfig(architecture: Architecture): object;
  oxlintConfig(overrides: OxlintOverride[], root?: string): object;
  fileOf(violation: unknown): string;
  generate(args: string[]): Promise<number>;
  withUpstream(workstreams: Workstream[], id: string): Workstream[];
  cacheDir(root: string): string;
  jsonOf(stdout: string): unknown;
  PROJECT_ROOT: string;
  runTool: RunInspectionTool;
  architecture: Architecture;
  config: FactoryConfig;
  product: { elsewhere: string[] };
  archunitRules(architecture: Architecture): { rules: Rule[] }[];
};


export type RunInspectionTool = (
  pkg: string,
  args: string[],
  options?: { bin?: string; cwd?: string; env?: NodeJS.ProcessEnv; input?: string; show?: boolean },
) => { status: number; stdout: string; stderr: string };

export type { Architecture, Check, FactoryConfig, Layer, LintRules, OxlintOverride, Platform, Rule, RuleContext, Vetoed, Workstream } from "../../../shared/domain/schemas/line-types.schema.ts";
