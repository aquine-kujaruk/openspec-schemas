import { globSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { type Folders, loadWorkstreams } from "./graph.ts";
import { PROJECT_ROOT, SOURCE_EXT } from "../core/paths.ts";
import { loadHolder } from "../repository/schema.ts";
import { currentProduct } from "../repository/products.ts";
import type { Architecture, FactoryConfig } from "../core/types.ts";

/**
 * The product a run works on (the only one, or the one `--product` names) and its schema: the
 * schema's defaults under the project's `factory.config.ts`, and the workstreams it declares joined
 * with the configured topology. Every tool (fallow, oxlint, archunit, the tests, the checks) is
 * composed from here.
 */
export const product = await currentProduct(PROJECT_ROOT);
export const schema = await loadHolder(product.schema);

/** The folder of each workstream of the schema, and its rubrics: its core's, then its own. */
export const WORKSTREAM_DIRS = schema.workstreamDirs;
export const RUBRICS = schema.rubrics;

/** The example files of every layer, each in the folder of the workstream that owns it. */
export const EXAMPLE_FILES = Object.values(WORKSTREAM_DIRS)
  .flatMap((dir) => globSync(join(dir, "*.examples.md")))
  .sort();

export const DEFAULTS: FactoryConfig = schema.definition.defaults;

export const config = product.config;

const RULES = `.rules${SOURCE_EXT}`;
const folders: Folders = Object.fromEntries(
  Object.keys(schema.workstreams).map((id) => [
    id,
    {
      layerFiles: readdirSync(schema.workstreamDirs[id]!)
        .filter((f) => f.endsWith(RULES))
        .map((f) => f.slice(0, -RULES.length)),
    },
  ]),
);

export const architecture: Architecture = {
  platform: config.platform,
  workstreams: loadWorkstreams(schema.workstreams, folders, config.workstreams, config),
  folders: WORKSTREAM_DIRS,
  review: config.review,
  ignore: config.ignore,
  allowUnmatched: config.allowUnmatched,
};

/**
 * The same workstreams over the default paths: the example files are written at `src/*`,
 * `test/acceptance` and `openspec/specs/<module>/<use-case>`, whatever this project configures.
 */
export const exampleArchitecture: Architecture = {
  ...architecture,
  workstreams: loadWorkstreams(schema.workstreams, folders, config.workstreams, {
    ...config,
    modules: DEFAULTS.modules,
    acceptance: DEFAULTS.acceptance,
    integration: DEFAULTS.integration,
    productSpecs: DEFAULTS.productSpecs,
    entry: DEFAULTS.entry,
  }),
};
