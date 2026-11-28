import { globSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Architecture, FactoryConfig, ActiveProjectDefinitions, WorkCenterFolders, BuildWorkstreams } from "../acl/plant.acl.ts";

export function createActiveProject<V>(
  PROJECT_ROOT: string,
  SOURCE_EXT: string,
  { loadHolder, currentProduct }: ActiveProjectDefinitions<V>,
  loadWorkstreams: BuildWorkstreams,
) {
  const product = {} as Awaited<ReturnType<typeof currentProduct>>;

  const schema = {} as Awaited<ReturnType<typeof loadHolder>>;

  const WORKSTREAM_DIRS: Record<string, string> = {};

  const RUBRICS: string[] = [];

  const EXAMPLE_FILES: string[] = [];

  const DEFAULTS = {} as FactoryConfig;

  const config = {} as FactoryConfig;

  const architecture = {} as Architecture;

  const exampleArchitecture = {} as Architecture;

  const initialize = async (): Promise<void> => {
    Object.assign(product, await currentProduct(PROJECT_ROOT));
    Object.assign(schema, await loadHolder(product.schema));

    Object.assign(WORKSTREAM_DIRS, schema.workstreamDirs);
    RUBRICS.splice(0, RUBRICS.length, ...schema.rubrics);

    EXAMPLE_FILES.splice(
      0,
      EXAMPLE_FILES.length,
      ...Object.values(WORKSTREAM_DIRS)
        .flatMap((dir) => globSync(join(dir, "*.examples.md")))
        .sort(),
    );

    Object.assign(DEFAULTS, schema.definition.defaults);

    Object.assign(config, product.config);

    const RULES = `.rules${SOURCE_EXT}`;

    const folders: WorkCenterFolders = Object.fromEntries(
      Object.keys(schema.workstreams).map((id) => [
        id,
        {
          layerFiles: readdirSync(schema.workstreamDirs[id]!)
            .filter((f) => f.endsWith(RULES))
            .map((f) => f.slice(0, -RULES.length)),
        },
      ]),
    );

    Object.assign(architecture, {
      platform: config.platform,
      workstreams: loadWorkstreams(
        schema.workstreams,
        folders,
        config.workstreams,
        config,
      ),
      folders: WORKSTREAM_DIRS,
      review: config.review,
      ignore: config.ignore,
      allowUnmatched: config.allowUnmatched,
      checks: schema.definition.checks ?? [],
    });

    Object.assign(exampleArchitecture, {
      ...architecture,
      workstreams: loadWorkstreams(
        schema.workstreams,
        folders,
        config.workstreams,
        {
          ...config,
          modules: DEFAULTS.modules,
          acceptance: DEFAULTS.acceptance,
          integration: DEFAULTS.integration,
          unit: DEFAULTS.unit,
          productSpecs: DEFAULTS.productSpecs,
          entry: DEFAULTS.entry,
        },
      ),
    });
  };

  return {
    product,
    schema,
    WORKSTREAM_DIRS,
    RUBRICS,
    EXAMPLE_FILES,
    DEFAULTS,
    config,
    architecture,
    exampleArchitecture,
    initialize,
  };
}
