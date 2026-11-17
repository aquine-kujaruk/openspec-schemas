import { readInstalled } from "../package/doctor.ts";
import { PROJECT_ROOT } from "../core/paths.ts";
import { loadDefinition, schemaNames } from "./schema.ts";
import { declaresProducts, projectProducts } from "./products.ts";

/** A schema of the package as the plan phase chooses among them: its name, when to use it, and what it builds through. */
export type Listed = { name: string; description: string; workstreams: string[]; spike?: string };

/** The schemas of the package the project at `root` has: those it installed, or all of them where the package is developed. */
export const listSchemas = async (root: string): Promise<Listed[]> => {
  const defined = schemaNames();
  const names = (readInstalled(root)?.installed.schemas ?? defined).filter((n) => defined.includes(n));
  const listed: Listed[] = [];
  for (const name of names) {
    const { description, workstreams, spike } = await loadDefinition(name);
    listed.push({ name, description, workstreams, ...(spike ? { spike: spike.workstream } : {}) });
  }
  return listed;
};

/** A product the project declares, as the plan phase picks the one a change builds. */
export type ListedProduct = { name: string; root: string; schema: string };

/** The products the project at `root` declares by folder; none when it declares none. */
export const listProducts = async (root: string): Promise<ListedProduct[]> =>
  (await declaresProducts(root))
    ? (await projectProducts(root)).map(({ name, root: folder, schema }) => ({ name, root: folder, schema }))
    : [];

/**
 * `factory schemas [--json]`: the schemas a change of this project can be opened with, and when each
 * is used, then the products it declares, each with its folder and its schema.
 */
export const run = async (args: string[]): Promise<number> => {
  const listed = await listSchemas(PROJECT_ROOT);
  const products = await listProducts(PROJECT_ROOT);
  if (args.includes("--json")) {
    console.log(JSON.stringify(products.length ? { schemas: listed, products } : listed, null, 2));
    return 0;
  }
  for (const { name, description, workstreams, spike } of listed)
    console.log(
      `${name}\n  ${description}\n  ${workstreams.length ? `workstreams: ${workstreams.join(", ")}` : "no workstreams: its tasks name none"}${spike ? `\n  spike: ${spike} builds the approved spikes first` : ""}`,
    );
  if (products.length) {
    console.log("\nproducts (a change builds one, made with its schema)");
    for (const { name, root, schema } of products) console.log(`${name}\n  folder: ${root}\n  schema: ${schema}`);
  }
  return 0;
};
