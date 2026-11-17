import { z } from "zod";
import { ProcessName } from "../../../shared/domain/value-objects/process-name.value-object.ts";

const packageManager = z.object({ name: z.string(), version: z.string() });
const project = z.object({
  testRunner: z.string(),
  typeChecker: z.object({ name: z.string(), version: z.string() }),
  e2e: z.object({ node: z.string(), packages: z.record(z.string(), z.string()) }).optional(),
});

export const EquipmentSchema = z.object({
  name: z.string(),
  version: z.string(),
  processes: z.array(z.instanceof(ProcessName)),
  workInstructions: z.array(z.string()),
  controls: z.array(z.string()),
  command: z.string(),
  assets: z.string(),
  agents: z.array(z.string()),
  instructions: z.record(z.string(), z.string()),
  packageManager,
  project,
});
export type EquipmentProps = z.input<typeof EquipmentSchema>;
