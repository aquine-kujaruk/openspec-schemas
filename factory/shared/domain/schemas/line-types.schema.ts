import type { FileConditionBuilder } from "archunit";
import { z } from "zod";
import type { Platform } from "./platform.schema.ts";
import type { Review } from "./review.schema.ts";

export type { Platform } from "./platform.schema.ts";
export type { Review } from "./review.schema.ts";

export type LintRules = Record<string, unknown>;
export type OxlintOverride = { files?: string[]; rules?: LintRules };

export type Layer = {
  name: string;
  fallow?: Fallow;
  oxlint?: Oxlint;
  archunit?: Archunit;
};

export const VetoedSchema = z.object({ packages: z.array(z.string()), patterns: z.array(z.string()) });
export type Vetoed = z.infer<typeof VetoedSchema>;

export const ZoneSchema = z.object({ name: z.string(), patterns: z.array(z.string()) });
export type Zone = z.infer<typeof ZoneSchema>;

export const BoundarySchema = z.object({
  id: z.string().optional(),
  from: z.string(),
  allow: z.union([z.array(z.string()), z.literal("*")]),
});

export type Boundary = z.infer<typeof BoundarySchema>;

export const ForbiddenCallsSchema = z.object({
  id: z.string(),
  from: z.string(),
  what: z.enum(["all", "persistence"]),
});

export type ForbiddenCalls = z.infer<typeof ForbiddenCallsSchema>;

export const FallowSchema = z.object({
  zones: z.array(ZoneSchema),
  boundaries: z.array(BoundarySchema),
  forbiddenCalls: z.array(ForbiddenCallsSchema),
});

export type Fallow = z.infer<typeof FallowSchema>;

export type Oxlint = (platform: Platform) => OxlintOverride[];

export type RuleContext = {
  files: () => FileConditionBuilder;
  opts: { allowEmptyTests: true };
};

export type Rule = {
  id: string;
  title: string;
  check: () => Promise<unknown[]>;
};

export type Archunit = (ctx: RuleContext) => Rule[];


export type Check = {
  id: string;
  args: string[];
  config: (o: Options) => Record<string, unknown>;
};

export type WorkstreamDeclaration = {
  layers: (o: Options) => Layer[];
  checks?: Check[];
  tests?: Array<"acceptance" | "integration" | "unit">;
};

export type Workstream = {
  id: string;
  layers: Layer[];
  checks: Check[];
  dependsOn: string[];
};

export type Options = {
  modules: string;
  acceptance: string;
  productSpecs: string;
  integration: string;
  unit: string;
  e2e: string;
  base?: string[];
  entry: string[];
  frameworks: { core: Vetoed; infrastructure: Vetoed };
  schemaPackage: string;
  emergent?: Record<string, string>;
};

export const TopologySchema = z.record(z.string(), z.object({ dependsOn: z.array(z.string()) }));
export type Topology = z.infer<typeof TopologySchema>;

export type FactoryConfig = Options & {
  platform: Platform;
  review: Review;
  ignore: string[];
  allowUnmatched: string[];
  workstreams: Topology;
};

export type Architecture = {
  platform: Platform;
  workstreams: Workstream[];
  folders?: Record<string, string>;
  review: Review;
  ignore: string[];
  allowUnmatched: string[];
  checks?: Check[];
};

export type ArtifactDefinition = {
  id: string;
  generates: string;
  description: string;
  template: string;
  instruction: string;
  requires: string[];
  decides?: true;
};

export type SchemaDefinition = {
  name: string;
  description: string;
  artifacts: ArtifactDefinition[];
  apply: { requires: string[]; tracks: string; instruction: string };
  core?: string;
  workstreams: string[];
  validator: string;
  questions: string;
  defaults: FactoryConfig;
  checks?: Check[];
  spike?: { workstream: string };
};

export type CoreDefinition = {
  name: string;
  description: string;
  workstreams: string[];
  topology: Topology;
  checks?: Check[];
  examples?: Partial<FactoryConfig>;
};

export type SchemaVariant = { name: string; extends: string } & Partial<
  Omit<SchemaDefinition, "name">
>;

export const LanguageServerSchema = z.object({
  name: z.string(),
  command: z.string(),
  args: z.array(z.string()),
  extensionToLanguage: z.record(z.string(), z.string()),
});

export type LanguageServer = z.infer<typeof LanguageServerSchema>;

export type PackageManifest = {
  name: string;
  description: string;
  schemas: string[];
  agents: string[];
  tools: Record<string, string>;
  skills: Array<
    | { tool: string; path: string }
    | { repository: string; commit?: string; path: string }
  >;
  languageServers: LanguageServer[];
  packageManager: { name: string; version: string };
  /**
   * What a project supplies itself: its test runner, its type checker at the version the language
   * server needs, and, for a package that builds a web frontend, the end-to-end packages at their
   * pinned versions with the oldest Node they run on.
   */
  project: {
    testRunner: string;
    typeChecker: { name: string; version: string };
    e2e?: { packages: Record<string, string>; node: string };
  };
};

export type Installed = {
  package: string;
  version: string;
  command: string;
  agents: string[];
  schemas: string[];
  phases: string[];
  instructions: Record<string, string>;
  guards: string[];
  packageManager: PackageManifest["packageManager"];
  project: PackageManifest["project"];
};
