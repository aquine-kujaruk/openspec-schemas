export type Layout = {
  repository: boolean;
  acceptance: string;
  product?: string;
  adapterFolder: (spec: string) => string | undefined;
};

export declare const productTestOf: (spec: string, acceptance: string) => string;

export declare const testOf: (
  spec: string,
  layout: Layout,
) => string | undefined;

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
