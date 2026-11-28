import type { Validator } from "./production/domain/services/work-order-assessment.service.ts";
import { ListProcessesUseCase } from "./engineering/application/use-cases/list-processes.use-case.ts";
import { PrepareLineUseCase } from "./engineering/application/use-cases/prepare-line.use-case.ts";
import { ProcessAggregate } from "./engineering/domain/aggregates/process.aggregate.ts";
import type { Product } from "./engineering/infrastructure/acl/plant.acl.ts";
import type { CatalogSchema } from "./engineering/infrastructure/acl/process.acl.ts";
import { createActiveProject } from "./engineering/infrastructure/adapters/active-project.adapter.ts";
import { PlantAdapter } from "./engineering/infrastructure/adapters/plant.adapter.ts";
import { createProcessCatalog } from "./engineering/infrastructure/adapters/process-catalog.adapter.ts";
import * as schemaYaml from "./engineering/infrastructure/adapters/process-drawing.adapter.ts";
import { createProductCatalog } from "./engineering/infrastructure/adapters/product-catalog.adapter.ts";
import { PlantRepositoryImplementation } from "./engineering/infrastructure/repository-implementations/plant.repository-implementation.ts";
import { ProcessRepositoryImplementation } from "./engineering/infrastructure/repository-implementations/process.repository-implementation.ts";
import { resolveConfig } from "./shared/domain/schemas/configuration.schema.ts";

import { PACKAGE_ROOT, PROJECT_ROOT, SOURCE_EXT } from "./shared/infrastructure/adapters/paths.adapter.ts";
import { runtime } from "./shared/infrastructure/adapters/runtime.adapter.ts";

export type Schema = CatalogSchema<Validator>;
export { schemaYaml };

export const schema = createProcessCatalog<Validator>(PACKAGE_ROOT, SOURCE_EXT, runtime.loadModule);

export const products = createProductCatalog(
  PACKAGE_ROOT, schema, runtime.environment, resolveConfig, runtime.loadModule,
);

export const graph = {
  loadWorkstreams: ProcessAggregate.loadWorkstreams,
  upstream: ProcessAggregate.upstream,
  runOrder: ProcessAggregate.runOrder,
  mayRunTogether: ProcessAggregate.mayRunTogether,
  ownerOf: ProcessAggregate.ownerOf,
  withUpstream: ProcessAggregate.withUpstream,
};

export const project = createActiveProject(
  PROJECT_ROOT, SOURCE_EXT, { loadHolder: schema.loadHolder, currentProduct: products.currentProduct }, graph.loadWorkstreams,
);

export const sdkLoadSchema = schema.loadSchema;

const plant = (root: string, readProducts: (root: string) => Promise<Product[]>) =>
  new PlantRepositoryImplementation(new PlantAdapter(root, readProducts));

async function listSchemas(root: string) {
  const { installed } = await import("./maintenance.ts");

  const processes = new ProcessRepositoryImplementation(async () => {
    const available = schema.schemaNames();
    const active = installed.readInstalled(root)?.installed.schemas ?? available;

    return Promise.all(active.filter((name) => available.includes(name)).map(async (name) => {
      const definition = await schema.loadDefinition(name);

      return {
        name,
        base: definition.core,
        description: definition.description,
        pilot: definition.spike?.workstream,
        workCenters: definition.workstreams.map((id) => ({
          id,
          waitsFor: definition.defaults.workstreams[id]?.dependsOn ?? [],
          parts: [],
        })),
      };
    }));
  });

  return (await new ListProcessesUseCase(processes).execute()).map((process) => ({
    name: process.name,
    description: process.description,
    workstreams: process.workCenters.map(({ id }) => id),
    ...(process.pilot ? { spike: process.pilot } : {}),
  }));
}

export async function listProducts(root: string) {
  if (!await products.declaresProducts(root)) return [];

  return (await plant(root, products.projectProducts).getPlant()).lines.map((line) => ({
    name: line.name,
    root: line.folder,
    schema: line.process,
  }));
}

export async function listProcessesCommand(args: string[]): Promise<number> {
  const listed = await listSchemas(PROJECT_ROOT);
  const lines = await listProducts(PROJECT_ROOT);

  if (args.includes("--json")) {
    console.log(JSON.stringify(lines.length ? { schemas: listed, products: lines } : listed, null, 2));

    return 0;
  }

  for (const { name, description, workstreams, spike } of listed)
    console.log(
      `${name}\n  ${description}\n  ${workstreams.length ? `workstreams: ${workstreams.join(", ")}` : "no workstreams: its tasks name none"}${spike ? `\n  spike: ${spike} builds the approved spikes first` : ""}`,
    );

  if (lines.length) {
    console.log("\nproducts (a change builds one, made with its schema)");

    for (const { name, root, schema } of lines)
      console.log(`${name}\n  folder: ${root}\n  schema: ${schema}`);
  }

  return 0;
}

export async function prepareLineCommand(): Promise<number> {
  await project.initialize();
  const prepareLine = new PrepareLineUseCase(plant(PROJECT_ROOT, async () => [project.product]));
  const folders = await prepareLine.execute(project.product.name);
  console.log(folders.length ? folders.map((folder) => `created ${folder}`).join("\n") : "nothing to prepare");

  return 0;
}
