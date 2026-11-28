import { z } from "zod";

export const MaintenanceKind = {
  Missing: "missing",
  Drift: "drift",
  Note: "note",
  Suspect: "suspect",
} as const;

export const MaintenanceItemSchema = z.object({
  kind: z.enum(MaintenanceKind),
  requirement: z.string(),
  detail: z.string(),
  agent: z.string().optional(),
  repaired: z.boolean().default(false),
});

export type MaintenanceItemProps = z.input<typeof MaintenanceItemSchema>;
