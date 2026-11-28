import { z } from "zod";
import { ProcessNameSchema } from "../../../shared/domain/schemas/process-name.schema.ts";

const packageManager = z.object({ name: z.string(), version: z.string() });

const project = z.object({
  testRunner: z.string(),
  typeChecker: z.object({ name: z.string(), version: z.string() }),
  e2e: z.object({ node: z.string(), packages: z.record(z.string(), z.string()) }).optional(),
});

export const EquipmentSchema = z.object({
  name: z.string(),
  version: z.string(),
  processes: z.array(ProcessNameSchema),
  workInstructions: z.array(z.string()),
  controls: z.array(z.string()),
  command: z.string(),
  assets: z.string(),
  agents: z.array(z.string()),
  instructions: z.record(z.string(), z.string()),
  packageManager,
  project,
});

export const EquipmentRecordSchema = z.object({
  installed: z.object({
    package: z.string(),
    version: z.string(),
    command: z.string(),
    agents: z.array(z.string()),
    schemas: z.array(ProcessNameSchema),
    phases: z.array(z.string()),
    instructions: z.record(z.string(), z.string()),
    guards: z.array(z.string()),
    packageManager,
    project,
  }),
  assets: z.string(),
});

export type EquipmentProps = z.input<typeof EquipmentSchema>;
export type EquipmentRecord = z.input<typeof EquipmentRecordSchema>;
