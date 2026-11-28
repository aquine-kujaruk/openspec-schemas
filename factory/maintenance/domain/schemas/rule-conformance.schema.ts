import { z } from "zod";

export const RuleChange = { Removed: "removed", Unchanged: "unchanged" } as const;

export const RuleConformanceSchema = z.object({
  rule: z.string().min(1),
  change: z.enum(["added", "changed", RuleChange.Removed, RuleChange.Unchanged]),
  files: z.array(z.string()),
  product: z.string().optional(),
});

export type RuleConformance = z.infer<typeof RuleConformanceSchema>;
