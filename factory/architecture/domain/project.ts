import { loadHolder } from "../../repository/domain/schema.ts";
import { currentProduct } from "../../repository/domain/products.ts";
import type { Architecture, FactoryConfig } from "../../shared/domain/types.ts";
/**
 * The product a run works on (the only one, or the one `--product` names) and its schema: the
 * schema's defaults under the project's `factory.config.ts`, and the workstreams it declares joined
 * with the configured topology. Every tool (fallow, oxlint, archunit, the tests, the checks) is
 * composed from here.
 */
export declare const product: Awaited<ReturnType<typeof currentProduct>>;
export declare const schema: Awaited<ReturnType<typeof loadHolder>>;
export declare const WORKSTREAM_DIRS: Record<string, string>;
export declare const RUBRICS: string[];
export declare const EXAMPLE_FILES: string[];
export declare const DEFAULTS: FactoryConfig;
export declare const config: FactoryConfig;
export declare const architecture: Architecture;
export declare const exampleArchitecture: Architecture;
export declare const initialize: () => Promise<void>;

/** Collaborators supplied by the composition root. */
export type ProjectPorts = {
  globSync: (typeof import("node:fs"))["globSync"];
  readdirSync: (typeof import("node:fs"))["readdirSync"];
  join: (typeof import("node:path"))["join"];
  loadWorkstreams: (typeof import("./graph.ts"))["loadWorkstreams"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  SOURCE_EXT: (typeof import("../../shared/domain/paths.ts"))["SOURCE_EXT"];
  loadHolder: (typeof import("../../repository/domain/schema.ts"))["loadHolder"];
  currentProduct: (typeof import("../../repository/domain/products.ts"))["currentProduct"];
};
