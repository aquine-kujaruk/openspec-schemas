import { z } from "zod";

export const AuditFindingSchema = z.object({
  file: z.string(),
  row: z.string(),
  verdict: z.enum(["accepted", "rejected"]).default("accepted"),
  p: z.number().min(0).max(1),
  from: z.number().int().min(1),
  to: z.number().int().min(1),
  title: z.string(),
});

export type AuditFindingProps = z.input<typeof AuditFindingSchema>;
