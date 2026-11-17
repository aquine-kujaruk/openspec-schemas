import type { RunInspectionTool } from "./inspection.acl.ts";

export type DrawingRecord = { path: string; file: string; gherkin: string };
export type GaugeRunRecord = { exitStatus: number; drawings: DrawingRecord[] };

export interface DrawingAcl {
  makeGauges(args: readonly string[]): Promise<GaugeRunRecord>;
}

/**
 * `factory generate [--check]`: the tests come from the specs.
 *
 * Every product spec the configured `productSpecs` glob finds
 * (`openspec/specs/<module>/<use-case>/spec.md` by default), as it will stand once the changes that
 * validation reports ready are archived, is converted to plain Gherkin in memory
 * (opsx-gherkin) and piped into feat2test, which writes
 * `<acceptance>/<module>/<use-case>.feature.test.ts` next to the step adapter the implementer writes
 * (`<use-case>.feature.steps.ts`, scaffolded on the first run and kept afterwards).
 *
 * In the repository that develops the schemas, its own tests are generated the same way: every
 * `openspec/specs/architecture/<layer>/spec.md` whose name is a layer of some workstream becomes
 * `workstreams/<workstream>/<layer>.feature.test.ts`, and any other capability is generated into
 * the folder that holds its adapter, `<capability>.feature.steps.ts` (`review/`, a validator's
 * folder). A capability with neither (`linting`) is verified by running the pipeline, not
 * generated.
 *
 * In this repository it also writes each schema under `openspec/schemas/<name>` as the specification
 * tool reads it, so the repository's own changes use the schemas it builds.
 *
 * `--check` only verifies the tests are fresh; `--product-specs <glob>` overrides the configured glob.
 */
export declare const generate: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type DrawingTools<Loaded> = {
  existsSync: (typeof import("node:fs"))["existsSync"];
  globSync: (typeof import("node:fs"))["globSync"];
  mkdirSync: (typeof import("node:fs"))["mkdirSync"];
  readFileSync: (typeof import("node:fs"))["readFileSync"];
  rmSync: (typeof import("node:fs"))["rmSync"];
  basename: (typeof import("node:path"))["basename"];
  dirname: (typeof import("node:path"))["dirname"];
  join: (typeof import("node:path"))["join"];
  relative: (typeof import("node:path"))["relative"];
  layoutOf(root: string): Promise<DrawingLayout>;
  productTestOf(spec: string, acceptance: string): string;
  testOf(spec: string, layout: DrawingLayout): string | undefined;
  mergedSpecs(root: string): Promise<{ root: string; dispose(): void } | undefined>;
  DEVELOPING: boolean;
  PROJECT_ROOT: string;
  runTool: RunInspectionTool;
  config: { productSpecs: string; acceptance: string };
  loadSchema(name: string): Promise<Loaded>;
  schemaNames(): string[];
  emitSchema(schema: Loaded, dir: string): void;
  schemaFiles(schema: Loaded): Record<string, string>;
};

export type DrawingLayout = {
  repository: boolean;
  acceptance: string;
  product?: string;
  adapterFolder(spec: string): string | undefined;
};
