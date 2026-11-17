import type { Listed, ListedProduct } from "../domain/schemas.ts";
import type { SchemasPorts } from "../domain/schemas.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createSchemas = ({
  readInstalled,
  PROJECT_ROOT,
  loadDefinition,
  schemaNames,
  declaresProducts,
  projectProducts,
}: SchemasPorts): Omit<typeof import("../domain/schemas.ts"), "run"> => {
  /** A schema of the package as the plan phase chooses among them: its name, when to use it, and what it builds through. */

  /** The schemas of the package the project at `root` has: those it installed, or all of them where the package is developed. */
  const listSchemas = async (root: string): Promise<Listed[]> => {
    const defined = schemaNames();
    const names = (readInstalled(root)?.installed.schemas ?? defined).filter(
      (n) => defined.includes(n),
    );
    const listed: Listed[] = [];
    for (const name of names) {
      const { description, workstreams, spike } = await loadDefinition(name);
      listed.push({
        name,
        description,
        workstreams,
        ...(spike ? { spike: spike.workstream } : {}),
      });
    }
    return listed;
  };

  /** A product the project declares, as the plan phase picks the one a change builds. */

  /** The products the project at `root` declares by folder; none when it declares none. */
  const listProducts = async (root: string): Promise<ListedProduct[]> =>
    (await declaresProducts(root))
      ? (await projectProducts(root)).map(({ name, root: folder, schema }) => ({
          name,
          root: folder,
          schema,
        }))
      : [];
  return { listSchemas, listProducts };
};
