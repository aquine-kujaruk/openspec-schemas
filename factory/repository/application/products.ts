import type { Product } from "../domain/products.ts";
import type {
  ProductEntry,
  ProjectConfig,
} from "../../shared/domain/config.ts";
import type { FactoryConfig } from "../../shared/domain/types.ts";
import type { ProductsPorts } from "../domain/products.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createProducts = ({
  environment,
  existsSync,
  join,
  posix,
  resolve,
  pathToFileURL,
  resolveConfig,
  PACKAGE_ROOT,
  loadDefinition,
  loadHolder,
  projectSchemaName,
  loadModule,
}: ProductsPorts): typeof import("../domain/products.ts") => {
  /**
   * One product of the project: a folder governed by one schema, with its configuration resolved.
   * A project that declares no products has one, unnamed, at its root.
   */

  /** The environment variable that names the product a run of the command works on. */
  const PRODUCT_VARIABLE = "FACTORY_PRODUCT";

  /**
   * The environment variable that names, in the repository the command is developed in, the holder
   * of workstreams (a core or a schema) whose defaults a run uses: its examples are verified with them.
   */
  const HOLDER_VARIABLE = "FACTORY_HOLDER";

  /** The project's `factory.config.ts`, when it has one. */
  const readProjectConfig = async (
    project: string,
  ): Promise<ProjectConfig | undefined> => {
    const path = join(project, "factory.config.ts");
    if (!existsSync(path)) return undefined;
    return (
      (await loadModule(pathToFileURL(path).href)) as { default: ProjectConfig }
    ).default;
  };

  const under = (root: string, path: string): string =>
    root === "." ? path : posix.join(root, path);

  /**
   * The configuration of the product `name` at `root`: its schema's defaults, then the project's top
   * level, then its own entry. Its roots are read relative to its folder; its specs default to
   * `openspec/specs/<name>/<module>/<use-case>/spec.md`. What may stay outside every zone adds the
   * same patterns under its folder and every other product's folder.
   */
  const resolveProduct = (
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
      own.productSpecs ??
      defaults.productSpecs.replace(
        /^openspec\/specs\//,
        `openspec/specs/${name}/`,
      );
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
  const projectProducts = async (
    project: string,
    root = PACKAGE_ROOT,
  ): Promise<Product[]> => {
    const top = await readProjectConfig(project);
    const declared = Object.entries(top?.products ?? {});
    if (!declared.length) {
      const schema = await projectSchemaName(project, root);
      const { defaults } = await loadDefinition(schema, root);
      return [
        {
          name: "",
          root: ".",
          schema,
          config: resolveConfig(defaults, top),
          elsewhere: [],
        },
      ];
    }
    const products: Product[] = [];
    for (const [name, entry] of declared) {
      if (!entry?.root || !entry.schema)
        throw new Error(
          `the product ${name} in factory.config.ts needs both a root and a schema`,
        );
      const { defaults } = await loadDefinition(entry.schema, root);
      const others = declared
        .filter(([n]) => n !== name)
        .map(([, e]) => e.root);
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
  const declaresProducts = async (project: string): Promise<boolean> =>
    Object.keys((await readProjectConfig(project))?.products ?? {}).length > 0;

  /** The product `name` of the project, failing with the products it has when there is none by that name. */
  const productNamed = async (
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
  const currentProduct = async (
    project: string,
    root = PACKAGE_ROOT,
  ): Promise<Product> => {
    const holder = environment()[HOLDER_VARIABLE];
    if (holder && resolve(project) === resolve(root)) {
      const { defaults } = (await loadHolder(holder, root)).definition;
      const config = resolveConfig(defaults, await readProjectConfig(project));
      return { name: "", root: ".", schema: holder, config, elsewhere: [] };
    }
    const products = await projectProducts(project, root);
    const named = environment()[PRODUCT_VARIABLE];
    if (named) return productNamed(project, named, root);
    if (products.length === 1) return products[0]!;
    throw new Error(
      `this project has ${products.length} products (${products.map((p) => p.name).join(", ")}): name the one to work on with --product <name>`,
    );
  };

  /** The product whose folder holds `path` (relative to the repository root), if any. */
  const productHolding = (
    products: Product[],
    path: string,
  ): Product | undefined =>
    products
      .filter(
        (p) =>
          p.root === "." || path === p.root || path.startsWith(`${p.root}/`),
      )
      .sort((a, b) => b.root.length - a.root.length)[0];

  /** The configuration of the product a run works on (see `currentProduct`). */
  const projectConfig = async (project: string): Promise<FactoryConfig> =>
    (await currentProduct(project)).config;

  /**
   * The product a change builds: the one it names in a project that declares products, or the
   * product a run works on otherwise.
   */
  const productOf = async (
    project: string,
    named?: string,
  ): Promise<Product> =>
    named ? productNamed(project, named) : currentProduct(project);

  /** The folders that hold product code: the module root and the roots of both kinds of test. */
  const productRoots = (config: FactoryConfig): string[] => [
    config.modules.replace(/\/\*$/, ""),
    config.acceptance,
    config.integration,
  ];
  return {
    PRODUCT_VARIABLE,
    HOLDER_VARIABLE,
    readProjectConfig,
    resolveProduct,
    projectProducts,
    declaresProducts,
    productNamed,
    currentProduct,
    productHolding,
    projectConfig,
    productOf,
    productRoots,
  };
};
