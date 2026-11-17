/** A schema of the package as the plan phase chooses among them: its name, when to use it, and what it builds through. */
export type Listed = {
  name: string;
  description: string;
  workstreams: string[];
  spike?: string;
};
/** The schemas of the package the project at `root` has: those it installed, or all of them where the package is developed. */
export declare const listSchemas: (root: string) => Promise<Listed[]>;
/** A product the project declares, as the plan phase picks the one a change builds. */
export type ListedProduct = {
  name: string;
  root: string;
  schema: string;
};
/** The products the project at `root` declares by folder; none when it declares none. */
export declare const listProducts: (root: string) => Promise<ListedProduct[]>;
/**
 * `factory schemas [--json]`: the schemas a change of this project can be opened with, and when each
 * is used, then the products it declares, each with its folder and its schema.
 */
export declare const run: (args: string[]) => Promise<number>;

/** Collaborators supplied by the composition root. */
export type SchemasPorts = {
  readInstalled: (typeof import("./installed.ts"))["readInstalled"];
  PROJECT_ROOT: (typeof import("../../shared/domain/paths.ts"))["PROJECT_ROOT"];
  loadDefinition: (typeof import("./schema.ts"))["loadDefinition"];
  schemaNames: (typeof import("./schema.ts"))["schemaNames"];
  declaresProducts: (typeof import("./products.ts"))["declaresProducts"];
  projectProducts: (typeof import("./products.ts"))["projectProducts"];
};
