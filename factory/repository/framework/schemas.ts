import type { SchemasPorts } from "../domain/schemas.ts";

/** Receives the invocation and presents the application's result. */
export const createSchemasCommand =
  ({
    PROJECT_ROOT,
    listSchemas,
    listProducts,
  }: SchemasPorts &
    Omit<
      typeof import("../domain/schemas.ts"),
      "run"
    >): (typeof import("../domain/schemas.ts"))["run"] =>
  async (args: string[]): Promise<number> => {
    const listed = await listSchemas(PROJECT_ROOT);
    const products = await listProducts(PROJECT_ROOT);
    if (args.includes("--json")) {
      console.log(
        JSON.stringify(
          products.length ? { schemas: listed, products } : listed,
          null,
          2,
        ),
      );
      return 0;
    }
    for (const { name, description, workstreams, spike } of listed)
      console.log(
        `${name}\n  ${description}\n  ${workstreams.length ? `workstreams: ${workstreams.join(", ")}` : "no workstreams: its tasks name none"}${spike ? `\n  spike: ${spike} builds the approved spikes first` : ""}`,
      );
    if (products.length) {
      console.log("\nproducts (a change builds one, made with its schema)");
      for (const { name, root, schema } of products)
        console.log(`${name}\n  folder: ${root}\n  schema: ${schema}`);
    }
    return 0;
  };
