import { existsSync } from "node:fs";
import { join, posix } from "node:path";
import { pathToFileURL } from "node:url";
import { type ProductEntry, type ProjectConfig, resolveConfig } from "../core/config.ts";
import { PACKAGE_ROOT } from "../core/paths.ts";
import type { FactoryConfig } from "../core/types.ts";
import { loadDefinition, projectSchemaName } from "./schema.ts";

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
export const PRODUCT_VARIABLE = "FACTORY_PRODUCT";

/** The project's `factory.config.ts`, when it has one. */
export const readProjectConfig = async (project: string): Promise<ProjectConfig | undefined> => {
  const path = join(project, "factory.config.ts");
  if (!existsSync(path)) return undefined;
  return ((await import(pathToFileURL(path).href)) as { default: ProjectConfig }).default;
};

const under = (root: string, path: string): string =>
  root === "." ? path : posix.join(root, path);

/**
 * The configuration of the product `name` at `root`: its schema's defaults, then the project's top
 * level, then its own entry. Its roots are read relative to its folder; its specs default to
 * `openspec/specs/<name>/<module>/<use-case>/spec.md`. What may stay outside every zone adds the
 * same patterns under its folder and every other product's folder.
 */
export const resolveProduct = (
  defaults: FactoryConfig,
  top: ProjectConfig | undefined,
  name: string,
  entry: ProductEntry,
  others: string[] = [],
): FactoryConfig => {
  const { products: _products, schema: _schema, ...shared } = top ?? {};
  const { root, schema: _own, ...own } = entry;
  const merged = resolveConfig(resolveConfig(defaults, shared), own);
  const productSpecs =
    own.productSpecs ?? defaults.productSpecs.replace(/^openspec\/specs\//, `openspec/specs/${name}/`);
  return {
    ...merged,
    modules: under(root, merged.modules),
    acceptance: under(root, merged.acceptance),
    integration: under(root, merged.integration),
    entry: merged.entry.map((e) => under(root, e)),
    productSpecs,
    review: merged.review.modules
      ? { ...merged.review, modules: under(root, merged.review.modules) }
      : merged.review,
    allowUnmatched: [
      ...new Set([
        ...merged.allowUnmatched,
        ...merged.allowUnmatched.map((p) => under(root, p)),
        ...others.map((o) => `${o}/**`),
      ]),
    ],
  };
};

/**
 * The products of the project at `project`: each entry of `products` in its `factory.config.ts`,
 * or the one product at its root when it declares none.
 */
export const projectProducts = async (project: string, root = PACKAGE_ROOT): Promise<Product[]> => {
  const top = await readProjectConfig(project);
  const declared = Object.entries(top?.products ?? {});
  if (!declared.length) {
    const schema = await projectSchemaName(project, root);
    const { defaults } = await loadDefinition(schema, root);
    return [{ name: "", root: ".", schema, config: resolveConfig(defaults, top), elsewhere: [] }];
  }
  const products: Product[] = [];
  for (const [name, entry] of declared) {
    if (!entry?.root || !entry.schema)
      throw new Error(`the product ${name} in factory.config.ts needs both a root and a schema`);
    const { defaults } = await loadDefinition(entry.schema, root);
    const others = declared.filter(([n]) => n !== name).map(([, e]) => e.root);
    products.push({
      name,
      root: entry.root,
      schema: entry.schema,
      config: resolveProduct(defaults, top, name, entry, others),
      elsewhere: others.map((o) => `${o}/**`),
    });
  }
  return products;
};

/** Whether the project at `project` declares products. */
export const declaresProducts = async (project: string): Promise<boolean> =>
  Object.keys((await readProjectConfig(project))?.products ?? {}).length > 0;

/** The product `name` of the project, failing with the products it has when there is none by that name. */
export const productNamed = async (
  project: string,
  name: string,
  root = PACKAGE_ROOT,
): Promise<Product> => {
  const products = await projectProducts(project, root);
  const found = products.find((p) => p.name === name);
  if (!found)
    throw new Error(
      `this project has no product called ${name}; products: ${products.map((p) => p.name || "(the root)").join(", ")}`,
    );
  return found;
};

/**
 * The product a run works on: the one named by `FACTORY_PRODUCT`, or the only one. In a project with
 * several products and none named, fails saying how to name one.
 */
export const currentProduct = async (project: string, root = PACKAGE_ROOT): Promise<Product> => {
  const products = await projectProducts(project, root);
  const named = process.env[PRODUCT_VARIABLE];
  if (named) return productNamed(project, named, root);
  if (products.length === 1) return products[0]!;
  throw new Error(
    `this project has ${products.length} products (${products.map((p) => p.name).join(", ")}): name the one to work on with --product <name>`,
  );
};

/** The product whose folder holds `path` (relative to the repository root), if any. */
export const productHolding = (products: Product[], path: string): Product | undefined =>
  products
    .filter((p) => p.root === "." || path === p.root || path.startsWith(`${p.root}/`))
    .sort((a, b) => b.root.length - a.root.length)[0];

/** The configuration of the product a run works on (see `currentProduct`). */
export const projectConfig = async (project: string): Promise<FactoryConfig> =>
  (await currentProduct(project)).config;

/**
 * The product a change builds: the one it names in a project that declares products, or the
 * product a run works on otherwise.
 */
export const productOf = async (project: string, named?: string): Promise<Product> =>
  named ? productNamed(project, named) : currentProduct(project);
