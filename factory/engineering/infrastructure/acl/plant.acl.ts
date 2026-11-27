import { z } from "zod";
import type { Architecture, FactoryConfig, SchemaDefinition } from "../../../shared/domain/schemas/line-types.schema.ts";
import type { ProductEntry, ProjectConfig, resolveConfig } from "../../../shared/domain/schemas/configuration.schema.ts";
import type { CatalogSchema } from "./process.acl.ts";

export type { ProductEntry, ProjectConfig };
/** A named product and its resolved configuration, or the implicit product at the project root. */
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


const roots = z.object({
  modules: z.string(),
  productSpecs: z.string(),
  entry: z.array(z.string()),
  acceptance: z.string(),
  integration: z.string(),
  unit: z.string(),
  e2e: z.string(),
  ignore: z.array(z.string()),
  base: z.array(z.string()).optional(),
  allowUnmatched: z.array(z.string()).optional(),
});

export const PlantRecordSchema = z.object({
  root: z.string(),
  lines: z.array(z.object({
    name: z.string(),
    folder: z.string(),
    process: z.string(),
    roots,
  })),
});

export type PlantRecord = z.infer<typeof PlantRecordSchema>;
export type RootRecord = z.infer<typeof roots>;

export interface PlantAcl {
  readPlant(): Promise<PlantRecord>;
  prepareRoots(root: string, inputs: RootRecord): Promise<string[]>;
}
