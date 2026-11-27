import { z } from "zod";
import type { MaintenanceItemProps } from "./maintenance-item.schema.ts";

export const RepairKind = {
  Pin: "pin",
  Link: "link",
  Default: "default",
  Roots: "roots",
  Instruction: "instruction",
} as const;

export const EquipmentRepairSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal(RepairKind.Pin), hadPin: z.boolean() }),
  z.object({ kind: z.literal(RepairKind.Link), schema: z.string() }),
  z.object({ kind: z.literal(RepairKind.Default) }),
  z.object({ kind: z.literal(RepairKind.Roots), paths: z.array(z.string()) }),
  z.object({ kind: z.literal(RepairKind.Instruction), file: z.string(), before: z.string().optional() }),
]);
export type EquipmentRepair = z.infer<typeof EquipmentRepairSchema>;

export type EquipmentFinding = MaintenanceItemProps & { repair?: EquipmentRepair };

export const AgentReadingSchema = z.object({
  name: z.string(),
  skills: z.string().optional(),
  missingSkills: z.array(z.string()).optional(),
  rules: z.string().optional(),
  missingRules: z.array(z.string()).optional(),
  instructionFile: z.string().optional(),
  instructionText: z.string().optional(),
  unwiredGuards: z.array(z.string()).optional(),
  hooks: z.string().optional(),
});
export type AgentReading = z.infer<typeof AgentReadingSchema>;

export const EquipmentReadingSchema = z.object({
  pinned: z.string().optional(),
  links: z.array(z.object({ schema: z.string(), path: z.string(), holds: z.boolean(), ownFolder: z.boolean() })),
  hasDefault: z.boolean(),
  missingRoots: z.array(z.string()),
  declared: z.record(z.string(), z.string()),
  web: z.boolean(),
  node: z.string(),
  agents: z.array(AgentReadingSchema),
});
export type EquipmentReading = z.infer<typeof EquipmentReadingSchema>;

export const EquipmentNotesSchema = z.object({
  missingKeys: z.array(z.object({ name: z.string(), slug: z.string(), file: z.string() })),
  packageManagerVersion: z.string().optional(),
  pendingApprovals: z.boolean(),
  typeCheckerVersion: z.string().optional(),
});
export type EquipmentNotes = z.infer<typeof EquipmentNotesSchema>;

export const EquipmentPlaceSchema = z.object({
  skills: z.string(),
  instruction: z.union([z.object({ rules: z.string() }), z.object({ file: z.string() })]),
  hooks: z.string(),
});
export type EquipmentPlace = z.infer<typeof EquipmentPlaceSchema>;
