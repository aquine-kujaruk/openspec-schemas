/** Where the tests generated from specs are written: what tells a project from the repository the command is developed in. */
export type Layout = {
  /** The repository the command is developed in, where a test is written next to its step adapter. */
  repository: boolean;
  /** The acceptance root of a project, or of the product a change builds. */
  acceptance: string;
  /** The product whose specs sit under `openspec/specs/<product>/`, in a project that declares products. */
  product?: string;
  /** In the repository, the folder that holds the step adapter of a spec; nothing when it has none. */
  adapterFolder: (spec: string) => string | undefined;
};
/** The generated product test for an OpenSpec capability id ending in <module>/<use-case>. */
export declare const productTestOf: (spec: string, acceptance: string) => string;
/**
 * The test generation writes for `spec` (`<area>/<name>`), from the root: under the acceptance
 * root in a project, next to the spec's step adapter in the repository, and none there for a spec
 * that has no step adapter.
 */
export declare const testOf: (
  spec: string,
  layout: Layout,
) => string | undefined;
/** The layout of the project at `root`, for the product `named` when the project declares products. */
export declare const layoutOf: (
  root: string,
  named?: string,
) => Promise<Layout>;

export type GeneratedPorts = {
  globSync: (typeof import("node:fs"))["globSync"];
  basename: (typeof import("node:path"))["basename"];
  dirname: (typeof import("node:path"))["dirname"];
  join: (typeof import("node:path"))["join"];
  relative: (typeof import("node:path"))["relative"];
  ARCHITECTURE_SPECS: string;
  PACKAGE_ROOT: string;
  SOURCE_EXT: string;
  productOf(root: string, named?: string): Promise<{ name: string; config: { acceptance: string } }>;
  holderNames(root: string): Promise<string[]>;
  loadHolder(name: string, root: string): Promise<{ workstreamDirs: Record<string, string> }>;
};
