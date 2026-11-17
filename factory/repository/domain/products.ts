import {
  type ProductEntry,
  type ProjectConfig,
} from "../../shared/domain/config.ts";
import type { FactoryConfig } from "../../shared/domain/types.ts";
/**
 * One product of the project: a folder governed by one schema, with its configuration resolved.
 * A project that declares no products has one, unnamed, at its root.
 */
export type Product = {
  /** The key it is declared under in `products`; empty for the one product of a project that declares none. */
  name: string;
  /** Its folder, relative to the repository root (`.` for the implicit product). */
  root: string;
  schema: string;
  config: FactoryConfig;
  /** The folders of the other products, as globs: what this product's checks leave alone. */
  elsewhere: string[];
};
/** The environment variable that names the product a run of the command works on. */
export declare const PRODUCT_VARIABLE = "FACTORY_PRODUCT";
/**
 * The environment variable that names, in the repository the command is developed in, the holder
 * of workstreams (a core or a schema) whose defaults a run uses: its examples are verified with them.
 */
export declare const HOLDER_VARIABLE = "FACTORY_HOLDER";
/** The project's `factory.config.ts`, when it has one. */
export declare const readProjectConfig: (
  project: string,
) => Promise<ProjectConfig | undefined>;
/**
 * The configuration of the product `name` at `root`: its schema's defaults, then the project's top
 * level, then its own entry. Its roots are read relative to its folder; its specs default to
 * `openspec/specs/<name>/<module>/<use-case>/spec.md`. What may stay outside every zone adds the
 * same patterns under its folder and every other product's folder.
 */
export declare const resolveProduct: (
  defaults: FactoryConfig,
  top: ProjectConfig | undefined,
  name: string,
  entry: ProductEntry,
  others?: string[],
) => FactoryConfig;
/**
 * The products of the project at `project`: each entry of `products` in its `factory.config.ts`,
 * or the one product at its root when it declares none.
 */
export declare const projectProducts: (
  project: string,
  root?: string,
) => Promise<Product[]>;
/** Whether the project at `project` declares products. */
export declare const declaresProducts: (project: string) => Promise<boolean>;
/** The product `name` of the project, failing with the products it has when there is none by that name. */
export declare const productNamed: (
  project: string,
  name: string,
  root?: string,
) => Promise<Product>;
/**
 * The product a run works on: the one named by `FACTORY_PRODUCT`, or the only one. In a project with
 * several products and none named, fails saying how to name one.
 */
export declare const currentProduct: (
  project: string,
  root?: string,
) => Promise<Product>;
/** The product whose folder holds `path` (relative to the repository root), if any. */
export declare const productHolding: (
  products: Product[],
  path: string,
) => Product | undefined;
/** The configuration of the product a run works on (see `currentProduct`). */
export declare const projectConfig: (project: string) => Promise<FactoryConfig>;
/**
 * The product a change builds: the one it names in a project that declares products, or the
 * product a run works on otherwise.
 */
export declare const productOf: (
  project: string,
  named?: string,
) => Promise<Product>;
/** The folders that hold product code: the module root and the roots of both kinds of test. */
export declare const productRoots: (config: FactoryConfig) => string[];

/** Collaborators supplied by the composition root. */
export type ProductsPorts = {
  environment: () => NodeJS.ProcessEnv;
  existsSync: (typeof import("node:fs"))["existsSync"];
  join: (typeof import("node:path"))["join"];
  posix: (typeof import("node:path"))["posix"];
  resolve: (typeof import("node:path"))["resolve"];
  pathToFileURL: (typeof import("node:url"))["pathToFileURL"];
  resolveConfig: (typeof import("../../shared/domain/config.ts"))["resolveConfig"];
  PACKAGE_ROOT: (typeof import("../../shared/domain/paths.ts"))["PACKAGE_ROOT"];
  loadDefinition: (typeof import("./schema.ts"))["loadDefinition"];
  loadHolder: (typeof import("./schema.ts"))["loadHolder"];
  projectSchemaName: (typeof import("./schema.ts"))["projectSchemaName"];
  loadModule: (specifier: string) => Promise<unknown>;
};
