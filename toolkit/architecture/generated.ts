import { globSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { ARCHITECTURE_SPECS, PACKAGE_ROOT } from "../core/paths.ts";
import { projectConfig } from "../repository/schema.ts";
import { ownerOf } from "./graph.ts";

/** Where the tests generated from specs are written: what tells a project from the repository the command is developed in. */
export type Layout = {
  /** The repository the command is developed in, where a test is written next to its step adapter. */
  repository: boolean;
  /** The acceptance root of a project. */
  acceptance: string;
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
  if (!layout.repository) return join(layout.acceptance, dirname(spec), file);
  const folder = layout.adapterFolder(spec);
  return folder === undefined ? undefined : join(folder, file);
};

/** The layout of the project at `root`. */
export const layoutOf = async (root: string): Promise<Layout> => {
  const { acceptance } = await projectConfig(root);
  if (root !== PACKAGE_ROOT) return { repository: false, acceptance, adapterFolder: () => undefined };
  // A layer's spec is proved in the folder of the workstream that owns the layer.
  const { architecture, WORKSTREAM_DIRS } = await import("./project.ts");
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
    adapterFolder: (spec) => {
      const owner =
        dirname(spec) === layers ? ownerOf(architecture.workstreams, basename(spec)) : undefined;
      return owner ? relative(root, WORKSTREAM_DIRS[owner.id]!) : adapters.get(basename(spec));
    },
  };
};
