import { readdirSync } from "node:fs";
import { join } from "node:path";
import { type Folders, loadWorkstreams } from "./graph.ts";
import { PROJECT_ROOT, SOURCE_EXT, WORKSTREAMS_DIR } from "./paths.ts";
import { loadSchema, projectConfig, projectSchemaName } from "./schema.ts";
import type { Architecture, FactoryConfig } from "./types.ts";

/**
 * The schema over the project: its defaults under the project's `factory.config.ts`, and the
 * workstreams it declares joined with the configured topology. Every tool (fallow, oxlint, archunit,
 * the tests, the checks) is composed from here.
 */
export const schema = await loadSchema(projectSchemaName(PROJECT_ROOT));

export const DEFAULTS: FactoryConfig = schema.definition.defaults;

export const config = await projectConfig(PROJECT_ROOT);

const RULES = `.rules${SOURCE_EXT}`;
const folders: Folders = Object.fromEntries(
  Object.keys(schema.workstreams).map((id) => [
    id,
    {
      layerFiles: readdirSync(join(WORKSTREAMS_DIR, id))
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
