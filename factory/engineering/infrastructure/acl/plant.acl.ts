import type { LineRootsProps } from "../../../shared/domain/schemas/line-roots.schema.ts";
import type { Architecture, FactoryConfig, SchemaDefinition } from "../../../shared/domain/schemas/line-types.schema.ts";
import type { ProductEntry, ProjectConfig, resolveConfig } from "../../../shared/domain/schemas/configuration.schema.ts";
import type { CatalogSchema } from "./process.acl.ts";

export type { ProductEntry, ProjectConfig };

export type Product = {
  name: string;
  root: string;
  schema: string;
  config: FactoryConfig;
  elsewhere: string[];
};

export type ProductDefinitions = {
  loadDefinition(name: string, root?: string): Promise<SchemaDefinition>;
  loadHolder(name: string, root?: string): Promise<Pick<CatalogSchema, "definition">>;
  projectSchemaName(project: string, root?: string): Promise<string>;
};

export type ProductConfiguration = typeof resolveConfig;

export type { Architecture, FactoryConfig };

export type {
  Folders as WorkCenterFolders,
} from "../../domain/aggregates/process.aggregate.ts";

export type BuildWorkstreams = typeof import("../../domain/aggregates/process.aggregate.ts").ProcessAggregate.loadWorkstreams;

export type ActiveProjectDefinitions<V> = {
  loadHolder(name: string): Promise<CatalogSchema<V>>;
  currentProduct(root: string): Promise<Product>;
};


export { PlantRecordSchema } from "../../../shared/domain/schemas/plant.schema.ts";
import type { PlantRecord } from "../../../shared/domain/schemas/plant.schema.ts";

export type { PlantRecord };
export type RootRecord = LineRootsProps;

export interface PlantAcl {
  readPlant(): Promise<PlantRecord>;
  prepareRoots(root: string, inputs: RootRecord): Promise<string[]>;
}
