import type { FileConditionBuilder } from "archunit";
import { z } from "zod";
import type { Platform } from "./platform.schema.ts";
import type { Review } from "./review.schema.ts";

export type { Platform } from "./platform.schema.ts";
export type { Review } from "./review.schema.ts";

/** One `overrides` entry of the lint configuration: the files it covers and the rules it sets on them. */
export type LintRules = Record<string, unknown>;
export type OxlintOverride = { files?: string[]; rules?: LintRules };

/**
 * A layer: what it is and why lives in its spec (`openspec/specs/architecture/<layer>`). Here, per
 * tool, how each rule is checked. Its rules file sits in the folder of the workstream that owns it.
 */
export type Layer = {
  name: string;
  /** Imports and calls between zones. */
  fallow?: Fallow;
  /** Packages and globals. */
  oxlint?: Oxlint;
  /** Names and shape of the code. */
  archunit?: Archunit;
};

/** Framework packages vetoed in a zone: exact names and patterns (`express/*`). */
export const VetoedSchema = z.object({ packages: z.array(z.string()), patterns: z.array(z.string()) });
export type Vetoed = z.infer<typeof VetoedSchema>;

export const ZoneSchema = z.object({ name: z.string(), patterns: z.array(z.string()) });
export type Zone = z.infer<typeof ZoneSchema>;
/** `allow: "*"`: any zone. Importing itself is always allowed. `id` is the rule this boundary enforces; a boundary without one is structure nobody specifies. */
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
  /** archunit over the project's tsconfig (or an example's). */
  files: () => FileConditionBuilder;
  opts: { allowEmptyTests: true };
};
export type Rule = {
  id: string;
  title: string;
  check: () => Promise<unknown[]>;
};
export type Archunit = (ctx: RuleContext) => Rule[];


/**
 * A rule checked over the whole product by one run of the boundary tool, not per layer: the
 * subcommand with its arguments, and the configuration it runs under, composed from the project's roots.
 */
export type Check = {
  id: string;
  args: string[];
  config: (o: Options) => Record<string, unknown>;
};

/**
 * What a workstream folder declares in its `workstream.ts`: the layers it owns and its
 * whole-product checks. Who it waits for is not here: that is configuration (`workstreams`).
 */
export type WorkstreamDeclaration = {
  layers: (o: Options) => Layer[];
  checks?: Check[];
  /** The kinds of product tests that prove this workstream's work (`factory test <kind>`). */
  tests?: Array<"acceptance" | "integration" | "unit">;
};

/** A workstream once its declaration is joined with the configured topology. */
export type Workstream = {
  id: string;
  layers: Layer[];
  checks: Check[];
  dependsOn: string[];
};

/** What the layers need to know about the repository; defaults in the schema, overrides in `factory.config.ts`. */
export type Options = {
  /** Where the modules live (`src/*`); each one has domain/, application/, infrastructure/ and framework/. */
  modules: string;
  /** Where the acceptance tests live (`test/acceptance`): one folder per module, generated from the product specs. */
  acceptance: string;
  /**
   * Where the product specs live, one per use case, as a glob whose two `*` are the module and the
   * use case (`openspec/specs/*\/*\/spec.md`).
   */
  productSpecs: string;
  /** Where the integration tests live (`test/integration`): one folder per module, one test per repository implementation. */
  integration: string;
  /** Where unit tests live (`test/unit`): one folder per module, mirroring the domain and application files they test. */
  unit: string;
  /** Where the end-to-end tests of a web product live (`test/e2e`), run with `factory test e2e`. */
  e2e: string;
  /**
   * Directories `factory prepare` lays under the module root when it creates it (`["shared/domain"]`).
   * Without it, a `shared` module with `domain`, `application` and `infrastructure`.
   */
  base?: string[];
  /** The composition root (`src/main.ts`): builds the adapters, the repositories and the use cases over them. */
  entry: string[];
  /** Framework packages the core never imports; infrastructure may have its own list. */
  frameworks: { core: Vetoed; infrastructure: Vetoed };
  /** The package that declares shapes (`zod`): imported only in domain/schemas, infrastructure/acl and infrastructure/adapters. */
  schemaPackage: string;
  /** Emergent infrastructure folders the architect declares, folder → file suffix (`{ paginators: "paginator.ts" }`). */
  emergent?: Record<string, string>;
};

/** The topology: every workstream id with the workstreams it waits for. */
export const TopologySchema = z.record(z.string(), z.object({ dependsOn: z.array(z.string()) }));
export type Topology = z.infer<typeof TopologySchema>;

/** The whole configuration: the schema holds the defaults, the project's `factory.config.ts` overrides them. */
export type FactoryConfig = Options & {
  platform: Platform;
  review: Review;
  /** Paths fallow ignores entirely (`!x` re-includes a hidden folder). */
  ignore: string[];
  /** Paths that may stay outside every zone (whatever is not product). */
  allowUnmatched: string[];
  workstreams: Topology;
};

/** What every tool is composed from: the platform, the workstreams in order, and fallow's paths. */
export type Architecture = {
  platform: Platform;
  workstreams: Workstream[];
  /** The folder of each workstream, where its rules and examples are; a core's live apart from its schema's. */
  folders?: Record<string, string>;
  review: Review;
  /** Paths fallow ignores entirely. */
  ignore: string[];
  /** Paths that may stay outside every zone (whatever is not product). */
  allowUnmatched: string[];
  /** The whole-product checks, which no workstream owns; `factory check` runs them after every rule. */
  checks?: Check[];
};

/** One artifact of a schema, as the specification tool reads it. */
export type ArtifactDefinition = {
  id: string;
  generates: string;
  description: string;
  /** A file of `templates/`. */
  template: string;
  instruction: string;
  requires: string[];
  /**
   * The artifact where the change's decisions are taken. Its emitted instruction ends with the
   * workstreams a task may name and with the schema's question policy.
   */
  decides?: true;
};

/**
 * A schema as this repository defines it: what the specification tool sees (artifacts, apply) and
 * the resources it picks by name. The defaults are what a project configuration overrides.
 */
export type SchemaDefinition = {
  name: string;
  description: string;
  artifacts: ArtifactDefinition[];
  apply: { requires: string[]; tracks: string; instruction: string };
  /**
   * The core it builds through (a folder of `shared/cores/`). Its workstreams come first, then the
   * ones this definition names; `defaults.workstreams` adds to what the core's wait for.
   */
  core?: string;
  /** Folders of `workstreams/`, in the order the tools are composed. */
  workstreams: string[];
  /** A folder of `validators/`. */
  validator: string;
  /** A policy of `questions/`. */
  questions: string;
  defaults: FactoryConfig;
  /** The whole-product checks, which no workstream owns: those of its core. */
  checks?: Check[];
  /**
   * The workstream that builds, first in the implementation, the screens the plan spiked as
   * throwaway HTML and the person approved, and writes their end-to-end tests. Only a web schema
   * has one.
   */
  spike?: { workstream: string };
};

/**
 * A core: the workstreams several schemas build through, held in `schemas/shared/cores/<name>/`,
 * and which waits for which. It names no framework: a schema that names it adds that.
 */
export type CoreDefinition = {
  name: string;
  description: string;
  /** Folders of its `workstreams/`, in the order the tools are composed. */
  workstreams: string[];
  /** What each of its workstreams waits for, by default. */
  topology: Topology;
  /**
   * The checks that need every workstream's work joined (dead files, duplication): no workstream
   * owns them; `factory check` and verify run them.
   */
  checks?: Check[];
  /**
   * What its own examples are verified with over the defaults of the base every schema naming it
   * extends: a stand-in framework their counterexamples import. It vetoes nothing in a product.
   */
  examples?: Partial<FactoryConfig>;
};

/** A definition that starts from another one and sets only what it overrides. */
export type SchemaVariant = { name: string; extends: string } & Partial<
  Omit<SchemaDefinition, "name">
>;

/** A language server the agents start in the project. */
export const LanguageServerSchema = z.object({
  name: z.string(),
  command: z.string(),
  args: z.array(z.string()),
  extensionToLanguage: z.record(z.string(), z.string()),
});
export type LanguageServer = z.infer<typeof LanguageServerSchema>;

/** What one installable package carries. */
export type PackageManifest = {
  name: string;
  description: string;
  /** The schemas the package carries; the first is the default a project without one gets. */
  schemas: string[];
  /** The agents the package is installed for. */
  agents: string[];
  /** The tools the command runs, each at one exact version. */
  tools: Record<string, string>;
  /**
   * Skills the package declares and carries no copy of: one that ships inside a pinned tool (the
   * tool and the folder inside it, declared at the tool's pinned version), or one that lives in a
   * repository of its own (`owner/repo`, the folder inside it and the commit it is pinned at).
   */
  skills: Array<
    | { tool: string; path: string }
    | { repository: string; commit?: string; path: string }
  >;
  languageServers: LanguageServer[];
  /** The agent package manager the package was built against. */
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

/**
 * What an installed package says about itself to the project it is installed in. It travels in the
 * setup skill, next to the command, so it is read from wherever an agent's skills are.
 */
export type Installed = {
  package: string;
  version: string;
  /** The file name of the command's tarball, next to this record. */
  command: string;
  agents: string[];
  schemas: string[];
  phases: string[];
  /** The text of each instruction, by name. */
  instructions: Record<string, string>;
  /** The wiring files the package deploys; none means it ships no guard. */
  guards: string[];
  packageManager: PackageManifest["packageManager"];
  project: PackageManifest["project"];
};
