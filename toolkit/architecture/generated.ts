import { globSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { ARCHITECTURE_SPECS, PACKAGE_ROOT, SOURCE_EXT } from "../core/paths.ts";
import { productOf } from "../repository/products.ts";
import { holderNames, loadHolder } from "../repository/schema.ts";

/** Where the tests generated from specs are written: what tells a project from the repository the command is developed in. */
export type Layout = {
  /** The repository the command is developed in, where a test is written next to its step adapter. */
  repository: boolean;
  /** The acceptance root of a project, or of the product a change builds. */
  acceptance: string;
  /** The product whose specs sit under `openspec/specs/<product>/`, in a project that declares products. */
  product?: string;
  /** In the repository, the folder that holds the step adapter of a spec; nothing when it has none. */
  adapterFolder: (spec: string) => string | undefined;
};

/**
 * The test generation writes for `spec` (`<area>/<name>`), from the root: under the acceptance
 * root in a project, next to the spec's step adapter in the repository, and none there for a spec
 * that has no step adapter.
 */
export const testOf = (spec: string, layout: Layout): string | undefined => {
  const file = `${basename(spec)}.feature.test.ts`;
  const own = layout.product ? spec.replace(new RegExp(`^${layout.product}/`), "") : spec;
  if (!layout.repository) return join(layout.acceptance, dirname(own), file);
  const folder = layout.adapterFolder(spec);
  return folder === undefined ? undefined : join(folder, file);
};

/** The layout of the project at `root`, for the product `named` when the project declares products. */
export const layoutOf = async (root: string, named?: string): Promise<Layout> => {
  const { config, name } = await productOf(root, named);
  const { acceptance } = config;
  if (root !== PACKAGE_ROOT)
    return { repository: false, acceptance, product: name || undefined, adapterFolder: () => undefined };
  // A layer's spec is proved in the folder of the workstream that owns the layer, whoever holds it.
  const owners = new Map<string, string>();
  for (const holder of await holderNames(root))
    for (const dir of Object.values((await loadHolder(holder, root)).workstreamDirs))
      for (const rules of globSync(`*.rules${SOURCE_EXT}`, { cwd: dir }))
        owners.set(basename(rules, `.rules${SOURCE_EXT}`), relative(root, dir));
  const adapters = new Map(
    globSync("**/*.feature.steps.ts", {
      cwd: root,
      exclude: (f) => ["node_modules", "dist", "workstreams"].includes(f),
    }).map((f) => [basename(f, ".feature.steps.ts"), dirname(f)]),
  );
  const layers = relative(join(root, "openspec/specs"), join(root, ARCHITECTURE_SPECS));
  return {
    repository: true,
    acceptance,
    adapterFolder: (spec) =>
      (dirname(spec) === layers ? owners.get(basename(spec)) : undefined) ?? adapters.get(basename(spec)),
  };
};
