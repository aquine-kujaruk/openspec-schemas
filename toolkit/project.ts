import { globSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { type Folders, loadWorkstreams } from "./graph.ts";
import { PROJECT_ROOT, SOURCE_EXT } from "./paths.ts";
import { loadSchema, projectConfig, projectSchemaName } from "./schema.ts";
import type { Architecture, FactoryConfig } from "./types.ts";

/**
 * The schema over the project: its defaults under the project's `factory.config.ts`, and the
 * workstreams it declares joined with the configured topology. Every tool (fallow, oxlint, archunit,
 * the tests, the checks) is composed from here.
 */
export const schema = await loadSchema(await projectSchemaName(PROJECT_ROOT));

/** The folder of each workstream of the schema, and its rubric. */
export const WORKSTREAM_DIRS = schema.workstreamDirs;
export const RUBRIC = schema.rubric;

/** The example files of every layer, each in the folder of the workstream that owns it. */
export const EXAMPLE_FILES = Object.values(WORKSTREAM_DIRS)
  .flatMap((dir) => globSync(join(dir, "*.examples.md")))
  .sort();

export const DEFAULTS: FactoryConfig = schema.definition.defaults;

export const config = await projectConfig(PROJECT_ROOT);

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
