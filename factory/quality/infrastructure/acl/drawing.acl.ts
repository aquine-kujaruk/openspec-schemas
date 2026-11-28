import type { RunInspectionTool } from "./inspection.acl.ts";

export type DrawingRecord = { path: string; file: string; gherkin: string };
export type GaugeRunRecord = { exitStatus: number; drawings: DrawingRecord[] };

export interface DrawingAcl {
  makeGauges(args: readonly string[]): Promise<GaugeRunRecord>;
}

export declare const generate: (args: string[]) => Promise<number>;

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
  rubricExamples(dir: string, layer: string): string;
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
