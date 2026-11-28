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


export const ProcessRecordSchema = z.object({
  name: z.string(),
  base: z.string().optional(),
  description: z.string(),
  pilot: z.string().optional(),
  workCenters: z.array(z.object({
    id: z.string(),
    waitsFor: z.array(z.string()),
    parts: z.array(z.object({
      name: z.string(),
      standards: z.array(z.object({ id: z.string(), title: z.string() })),
    })),
  })),
});

export type ProcessRecord = z.infer<typeof ProcessRecordSchema>;

export interface ProcessAcl {
  listProcesses(): Promise<ProcessRecord[]>;
}
