import { existsSync } from "node:fs";
import { join, posix, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { EngineeringException } from "../../domain/exceptions/engineering.exceptions.ts";

import type {
  FactoryConfig, Product, ProductConfiguration, ProductDefinitions, ProductEntry, ProjectConfig,
} from "../acl/plant.acl.ts";

export function createProductCatalog(
  PACKAGE_ROOT: string,
  { loadDefinition, loadHolder, projectSchemaName }: ProductDefinitions,
  environment: () => Record<string, string | undefined>,
  resolveConfig: ProductConfiguration,
  loadModule: (specifier: string) => Promise<unknown>,
) {
  const PRODUCT_VARIABLE = "FACTORY_PRODUCT";

  const HOLDER_VARIABLE = "FACTORY_HOLDER";

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
      unit: under(root, merged.unit),
      entry: merged.entry.map((e) => under(root, e)),
      productSpecs,
      allowUnmatched: [
        ...new Set([
          ...merged.allowUnmatched,
          ...merged.allowUnmatched.map((p) => under(root, p)),
          ...others.map((o) => `${o}/**`),
        ]),
      ],
    };
  };

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
        throw new EngineeringException(
          `the product ${name} in factory.config.ts needs both a root and a schema`,
          { cause: { project } },
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

  const declaresProducts = async (project: string): Promise<boolean> =>
    Object.keys((await readProjectConfig(project))?.products ?? {}).length > 0;

  const productNamed = async (
    project: string,
    name: string,
    root = PACKAGE_ROOT,
  ): Promise<Product> => {
    const products = await projectProducts(project, root);
    const found = products.find((p) => p.name === name);

    if (!found)
      throw new EngineeringException(
        `this project has no product called ${name}; products: ${products.map((p) => p.name || "(the root)").join(", ")}`,
        { cause: { project } },
      );

    return found;
  };

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

    throw new EngineeringException(
      `this project has ${products.length} products (${products.map((p) => p.name).join(", ")}): name the one to work on with --product <name>`,
      { cause: { project } },
    );
  };

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

  const projectConfig = async (project: string): Promise<FactoryConfig> =>
    (await currentProduct(project)).config;

  const productOf = async (
    project: string,
    named?: string,
  ): Promise<Product> =>
    named ? productNamed(project, named) : currentProduct(project);

  const productRoots = (config: FactoryConfig): string[] => [
    config.modules.replace(/\/\*$/, ""),
    config.acceptance,
    config.integration,
    config.unit,
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
}
