import type { Validator } from "./production/domain/services/work-order-assessment.service.ts";
import { EngineeringController } from "./engineering/framework/controllers/engineering.controller.ts";
import { consoleIo } from "./shared/infrastructure/adapters/cli.adapter.ts";
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

const listProcessesAt = (root: string) => {
  const processes = new ProcessRepositoryImplementation(async () => {
    const available = schema.schemaNames();
    const { installed } = await import("./maintenance.ts");
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

  return new ListProcessesUseCase(processes);
};

export async function listProducts(root: string) {
  if (!await products.declaresProducts(root)) return [];

  return (await plant(root, products.projectProducts).getPlant()).lines.map((line) => ({
    name: line.name,
    root: line.folder,
    schema: line.process,
  }));
}

const controller = new EngineeringController({
  listProcesses: () => listProcessesAt(PROJECT_ROOT),
  listProducts: () => listProducts(PROJECT_ROOT),
  prepareLine: async () => {
    await project.initialize();

    return { useCase: new PrepareLineUseCase(plant(PROJECT_ROOT, async () => [project.product])), line: project.product.name };
  },
}, consoleIo);

export const listProcessesCommand = controller.schemas.bind(controller);
export const prepareLineCommand = controller.prepare.bind(controller);
