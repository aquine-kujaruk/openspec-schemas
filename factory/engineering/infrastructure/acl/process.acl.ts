import { z } from "zod";

import type {
  CoreDefinition,
  SchemaDefinition,
  SchemaVariant,
  Topology,
  WorkstreamDeclaration,
} from "../../../shared/domain/schemas/line-types.schema.ts";

import type { ProjectConfig } from "../../../shared/domain/schemas/configuration.schema.ts";
export type { CoreDefinition, ProjectConfig, SchemaDefinition, SchemaVariant, Topology, WorkstreamDeclaration };

export type CatalogResourceKind = "core" | "workstream" | "validator" | "question policy" | "template";

export type CatalogSchema<V = unknown> = {
  definition: SchemaDefinition;
  workstreams: Record<string, WorkstreamDeclaration>;
  validator: V;
  questions: string;
  templates: Record<string, string>;
  workstreamDirs: Record<string, string>;
  rubrics: string[];
  resources: Array<{ kind: CatalogResourceKind; id: string; file: string }>;
};

export type MisplacedResource = {
  kind: CatalogResourceKind;
  id: string;
  held: string[];
  belongs: string;
};


export { ProcessRecordSchema } from "../../domain/schemas/process.schema.ts";
import type { ProcessRecord } from "../../domain/schemas/process.schema.ts";

export type { ProcessRecord };

export type ProcessPort = () => Promise<unknown>;
