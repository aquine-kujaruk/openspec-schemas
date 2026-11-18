import type { Layout } from "./gauge-layout-contract.adapter.ts";
import type { GeneratedPorts } from "./gauge-layout-contract.adapter.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createGenerated = ({
  globSync,
  basename,
  dirname,
  join,
  relative,
  ARCHITECTURE_SPECS,
  PACKAGE_ROOT,
  SOURCE_EXT,
  productOf,
  holderNames,
  loadHolder,
}: GeneratedPorts): typeof import("./gauge-layout-contract.adapter.ts") => {
  const productTestOf = (spec: string, acceptance: string): string =>
    join(acceptance, basename(dirname(spec)), `${basename(spec)}.feature.test.ts`);

  const testOf = (spec: string, layout: Layout): string | undefined => {
    if (!layout.repository) return productTestOf(spec, layout.acceptance);
    const folder = layout.adapterFolder(spec);
    return folder === undefined
      ? undefined
      : join(folder, `${basename(spec)}.feature.test.ts`);
  };

  /** The layout of the project at `root`, for the product `named` when the project declares products. */
  const layoutOf = async (root: string, named?: string): Promise<Layout> => {
    const { config, name } = await productOf(root, named);
    const { acceptance } = config;
    if (root !== PACKAGE_ROOT)
      return {
        repository: false,
        acceptance,
        product: name || undefined,
        adapterFolder: () => undefined,
      };
    const owners = new Map<string, string>();
    for (const holder of await holderNames(root))
      for (const dir of Object.values(
        (await loadHolder(holder, root)).workstreamDirs,
      ))
        for (const rules of globSync(`*.rules${SOURCE_EXT}`, { cwd: dir }))
          owners.set(
            basename(rules, `.rules${SOURCE_EXT}`),
            relative(root, dir),
          );
    const adapters = new Map(
      globSync("**/*.feature.steps.ts", {
        cwd: root,
        exclude: (f) => ["node_modules", "dist", "workstreams"].includes(f),
      }).map((f) => [basename(f, ".feature.steps.ts"), dirname(f)]),
    );
    const layers = relative(
      join(root, "openspec/specs"),
      join(root, ARCHITECTURE_SPECS),
    );
    return {
      repository: true,
      acceptance,
      adapterFolder: (spec) =>
        (dirname(spec) === layers ? owners.get(basename(spec)) : undefined) ??
        adapters.get(basename(spec)),
    };
  };
  return { productTestOf, testOf, layoutOf };
};
