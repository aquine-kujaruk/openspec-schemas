import type { Folders } from "../domain/graph.ts";
import type { Architecture, FactoryConfig } from "../../shared/domain/types.ts";
import type { ProjectPorts } from "../domain/project.ts";

/** Builds these use cases from their capabilities; importing them touches no resources. */
export const createProject = ({
  globSync,
  readdirSync,
  join,
  loadWorkstreams,
  PROJECT_ROOT,
  SOURCE_EXT,
  loadHolder,
  currentProduct,
}: ProjectPorts): typeof import("../domain/project.ts") => {
  /**
   * The product a run works on (the only one, or the one `--product` names) and its schema: the
   * schema's defaults under the project's `factory.config.ts`, and the workstreams it declares joined
   * with the configured topology. Every tool (fallow, oxlint, archunit, the tests, the checks) is
   * composed from here.
   */
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

    /** The folder of each workstream of the schema, and its rubrics: its core's, then its own. */
    Object.assign(WORKSTREAM_DIRS, schema.workstreamDirs);
    RUBRICS.splice(0, RUBRICS.length, ...schema.rubrics);

    /** The example files of every layer, each in the folder of the workstream that owns it. */
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

    /**
     * The same workstreams over the default paths: the example files are written at `src/*`,
     * `test/acceptance` and `openspec/specs/<module>/<use-case>`, whatever this project configures.
     */
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
};
